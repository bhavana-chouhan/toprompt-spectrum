import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

export const AUTH_TOKEN_STORAGE_KEY = 'toprompt.auth-token';

/** LLM rewire alias — same storage key as `AUTH_TOKEN_STORAGE_KEY`. */
export const TOKEN_KEY = AUTH_TOKEN_STORAGE_KEY;

/** Next.js API server port — matches `api/package.json` `dev` script. */
const API_PORT = 3001;

/**
 * Phase fingerprint — same token services/auth.ts uses, substituted at emit
 * time by tasks.ts / scaffold-builder.ts / validate-and-fix.ts. The
 * `no-unresolved-template-placeholders` structural invariant fails the
 * build if this ever ships unsubstituted.
 *
 * Used as defense-in-depth (Fix C) to suppress error toasts during Phase 1.
 * The primary Phase-1 isolation (Fix B) lives in the entity stores — they
 * short-circuit before ever calling `apiRequest`. This guard catches any
 * stray call that slips through (a hand-written hook, a third-party screen,
 * a regression) so the design preview never surfaces an infra toast.
 */
const APP_PHASE = 'design';
const IS_DESIGN_PREVIEW = APP_PHASE === 'design';

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

/**
 * Convergence batch — Validation Ownership.
 *
 * Thrown when the backend responds 400 with a structured `errors` payload
 * (`{ errors: { fieldName: 'message', ... } }`). The form body reads
 * `err.fieldErrors` and binds each entry to the matching <FormField error>
 * so users see inline field-level validation messages instead of a generic
 * banner.
 *
 * The canonical backend route handlers emit this shape from Mongoose
 * validation errors. The mobile bundle never needs to know the schema —
 * it just renders whatever fieldErrors arrive.
 */
export class ValidationError extends ApiError {
  fieldErrors: Record<string, string>;

  constructor(
    message: string,
    fieldErrors: Record<string, string>,
    payload?: unknown,
  ) {
    super(message, 400, payload);
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Inspect a 400 payload for the canonical `errors` shape and extract a
 * field → message map. Falls back to `{}` for any payload that doesn't
 * carry field-level errors (the caller then renders the generic banner).
 */
function extractFieldErrors(payload: unknown): Record<string, string> {
  if (!payload || typeof payload !== 'object') return {};
  const errs = (payload as { errors?: unknown }).errors;
  if (!errs || typeof errs !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(errs as Record<string, unknown>)) {
    if (typeof v === 'string') out[k] = v;
    else if (v && typeof v === 'object' && typeof (v as { message?: unknown }).message === 'string') {
      out[k] = (v as { message: string }).message;
    }
  }
  return out;
}

export interface ApiRequestOptions {
  useAuth?: boolean;
  unwrapData?: boolean;
}

function normalizePath(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return path.startsWith('/') ? path : `/${path}`;
}

/**
 * Resolves the base URL for the Next.js API.
 *
 * Order of precedence:
 *   1. `EXPO_PUBLIC_API_URL` env (set by .env in production / sandbox / CI).
 *   2. Expo Go auto-detection from `Constants.expoConfig.hostUri`:
 *      a. LAN IP / localhost  → `http://<host>:3001`  (local 'pnpm dev')
 *      b. Public domain       → `https://<host>`      (sandbox / tunnel —
 *         ALB or tunnel routes /api/* to the API; never expose port 3001
 *         externally).
 *   3. Last-resort `http://localhost:${API_PORT}` for simulator / web bundle.
 *
 * The LAN-vs-public split is what lets ONE binary work in three environments:
 *   • iOS Simulator / Android Emulator on dev Mac    → LAN IP, port 3001
 *   • Physical phone via Expo Go on Wi-Fi             → LAN IP, port 3001
 *   • Sandbox preview at *.apps.toprompt.ai           → HTTPS, ALB on 443
 *   • Tunneled dev at *.exp.direct / *.expo.direct    → HTTPS, tunnel on 443
 */
function isPrivateLanHost(host: string): boolean {
  if (!host) return true;
  if (/^localhost$/i.test(host)) return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (host === '10.0.2.2') return true;             // Android emulator → host bridge
  if (host === '[::1]' || host === '::1') return true; // IPv6 loopback
  if (!host.includes('.')) return true;              // bare hostname (rare)
  return false;
}

/**
 * Host allowlist for EXPO_PUBLIC_API_URL. The env var is BUNDLED into the JS
 * payload at build time and visible to anyone with the .apk/.ipa, so a typo
 * or hostile deploy can silently send every request (including `Authorization:
 * Bearer …`) to the wrong host. This guard rejects unknown hosts.
 *
 * Allowed:
 *   • Private LAN (Expo Go on physical phones / sim)
 *   • *.apps.toprompt.ai     — production sandbox
 *   • *.exp.direct / *.expo.direct — Expo tunnel
 */
function isAllowedApiHost(host: string): boolean {
  if (!host) return false;
  if (isPrivateLanHost(host)) return true;
  if (/\.apps\.toprompt\.ai$/.test(host)) return true;
  if (/\.exp\.direct$/.test(host)) return true;
  if (/\.expo\.direct$/.test(host)) return true;
  return false;
}

export function getApiBaseUrl(): string {
  const override = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (override) {
    try {
      const parsed = new URL(override);
      const okProtocol = parsed.protocol === 'https:' || parsed.protocol === 'http:';
      if (okProtocol && isAllowedApiHost(parsed.hostname)) {
        return override.replace(/\/$/, '');
      }
      // eslint-disable-next-line no-console
      console.error(
        '[api] EXPO_PUBLIC_API_URL host "' + parsed.hostname + '" is not in the allowed list; ignoring and falling back to Expo Go detection.',
      );
    } catch {
      // eslint-disable-next-line no-console
      console.error('[api] EXPO_PUBLIC_API_URL is malformed; ignoring.');
    }
  }

  // Expo Go: extract host from the URI Metro reports back to the device.
  // Examples: "192.168.1.10:8081" (LAN), "moh2xt7k.apps.toprompt.ai" (sandbox),
  // "abc-defg.exp.direct" (tunnel), "[::1]:8081" (IPv6 loopback).
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoGo?.developer?.host ||
    (Constants as any).manifest?.hostUri ||
    null;
  if (typeof hostUri === 'string' && hostUri.length > 0) {
    // Strip Metro port if present; preserve bracketed IPv6.
    const lastColon = hostUri.lastIndexOf(':');
    const host = (lastColon > 0 && !hostUri.endsWith(']'))
      ? hostUri.slice(0, lastColon)
      : hostUri;

    if (isPrivateLanHost(host)) {
      // Local dev: dev Mac is reachable via HTTP on the API port.
      return `http://${host}:${API_PORT}`;
    }
    // Public domain: ALB / tunnel co-serves the API on HTTPS at standard
    // port 443. Internal port 3001 is NEVER exposed externally — appending
    // ":3001" to a public host fails (timeout) because the load-balancer
    // listener doesn't bind that port.
    return `https://${host}`;
  }

  return `http://localhost:${API_PORT}`;
}

export async function getStoredAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export async function setStoredAuthToken(token: string | null): Promise<void> {
  try {
    if (token) {
      await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore persistence failures — auth service still handles the in-memory result.
  }
}

// LLM-friendly alias — kept in sync with CANONICAL_MODULE_EXPORTS in
// apps/agent-server/src/workflows/nodes/validate-and-fix/post-loop-mobile-imports.ts.
// Some auth screens import `setToken` instead of `setStoredAuthToken`.
export const setToken = setStoredAuthToken;

// Phase-2 rewire often imports these names from api.ts; without explicit exports
// post-loop-mobile-imports strips them → login never persists JWT → 401/404.
export const setStoredToken = setStoredAuthToken;
export async function clearStoredToken(): Promise<void> {
  await setStoredAuthToken(null);
}

async function buildHeaders(useAuth: boolean, incoming?: HeadersInit): Promise<Headers> {
  const headers = new Headers(incoming || {});
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (useAuth) {
    const token = await getStoredAuthToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return headers;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options: ApiRequestOptions = {}
): Promise<T> {
  const { useAuth = true, unwrapData = true } = options;
  const url = `${getApiBaseUrl()}${normalizePath(path)}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      credentials: init.credentials ?? 'include',
      headers: await buildHeaders(useAuth, init.headers),
    });
  } catch (err) {
    // fetch() throws TypeError on DNS / connection failure. Surface the URL
    // we tried so the user can spot misconfiguration (wrong LAN IP, API not
    // running) without digging into network logs.
    const reason = err instanceof Error ? err.message : 'unknown';
    const networkMessage = `Cannot reach ${url} — is the API server running? (${reason})`;
    // Phase 1 (design preview): the sandbox has no backend yet, so DNS /
    // connection failures here are EXPECTED if any stray code somehow
    // reaches apiRequest. Suppress the toast so the user isn't shown an
    // error during the mocked preview. The store template (Fix B) ensures
    // no entity store ever lands here — this is defense-in-depth (Fix C).
    if (!IS_DESIGN_PREVIEW) {
      try {
        const { showToast } = await import('@/components/ui/Toast');
        showToast({
          type: 'error',
          title: 'Network error',
          message: 'Could not reach the server. Check your connection and try again.',
        });
      } catch {
        // Toast host may not be mounted; swallow.
      }
    }
    throw new ApiError(networkMessage, 0, { url, cause: reason });
  }

  const rawText = await response.text();
  let payload: unknown = null;
  if (rawText) {
    try {
      payload = JSON.parse(rawText);
    } catch {
      payload = rawText;
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : null) ||
      (payload && typeof payload === 'object' && 'message' in payload && typeof payload.message === 'string'
        ? payload.message
        : null) ||
      `Request failed with status ${response.status}`;

    // Surface unrecoverable server errors (5xx) AND network failures (status 0)
    // through the canonical Toast host. 4xx errors are caller-business-logic
    // (validation, conflict, not-found) — those propagate via throw and are
    // handled at the call site. 401 has its own redirect-to-login path.
    //
    // Phase 1 (design preview) suppresses the toast entirely: in Phase 1 a
    // 5xx means "no backend yet" — an expected non-error state. Fix B has
    // the entity-store template short-circuit BEFORE calling apiRequest in
    // Phase 1, so this branch is only reached by stray callers; suppressing
    // here is defense-in-depth (Fix C). The throw still propagates so any
    // caller that wants its own handling can have it.
    if (response.status >= 500 && !IS_DESIGN_PREVIEW) {
      try {
        const { showToast } = await import('@/components/ui/Toast');
        showToast({
          type: 'error',
          title: 'Server error',
          message,
        });
      } catch {
        // Toast host may not be mounted (e.g. headless test); swallow.
      }
    }

    // Convergence batch — validation ownership. 400 + structured `errors`
    // payload → ValidationError (carries fieldErrors). Everything else →
    // generic ApiError. The form body branches on err.fieldErrors.
    if (response.status === 400) {
      const fieldErrors = extractFieldErrors(payload);
      if (Object.keys(fieldErrors).length > 0) {
        throw new ValidationError(message, fieldErrors, payload);
      }
    }

    throw new ApiError(message, response.status, payload);
  }

  if (!unwrapData) {
    return payload as T;
  }

  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export async function apiGet<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' }, options);
}

export async function apiPost<T>(
  path: string,
  body: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    options,
  );
}

export async function apiPut<T>(
  path: string,
  body: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
    options,
  );
}

export async function apiPatch<T>(
  path: string,
  body: Record<string, unknown>,
  options?: ApiRequestOptions
): Promise<T> {
  return apiRequest<T>(
    path,
    {
      method: 'PATCH',
      body: JSON.stringify(body),
    },
    options,
  );
}

export async function apiDelete<T>(path: string, options?: ApiRequestOptions): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' }, options);
}

/**
 * Boundary I — Auth-Scoped Ownership.
 *
 * Appends `?userId=<currentUserId>` to a resource path when the auth store
 * has a signed-in user. Stores for user-scoped entities (entity has a
 * `userId` / `ownerId` field of type ObjectId) wrap their list-fetch URL
 * with this helper so users only see their own data, even when the
 * backend route handler hasn't explicitly enforced filtering.
 *
 * Defense-in-depth: the backend route handler SHOULD filter by JWT
 * `req.user._id`, but in practice generated handlers don't always. This
 * helper closes the gap from the client side. Existing query strings are
 * preserved; the userId is appended with the correct separator.
 *
 * When the user is anonymous (no auth token), the helper returns the path
 * unchanged. The caller's existing 401 handling then applies.
 *
 * The store generator detects user-scoped entities and emits
 * `apiGet(withCurrentUser(RESOURCE_PATH))` instead of the bare path; the
 * `auth-scoped-list-fetches` structural invariant enforces this on output.
 */
export function withCurrentUser(path: string): string {
  try {
    // Dynamic require so this file has no static dep on the auth store
    // (auth store imports from this module — would be a cycle).
    // The store exposes the canonical user via getState().user; we read
    // the _id and append as a query parameter.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod: { useAuthStore?: { getState?: () => { user?: { _id?: string; id?: string } } } } =
      require('@/store/useAuthStore');
    const state = mod?.useAuthStore?.getState?.();
    const userId = state && state.user ? (state.user._id || state.user.id) : undefined;
    if (!userId) return path;
    const separator = path.includes('?') ? '&' : '?';
    return path + separator + 'userId=' + encodeURIComponent(String(userId));
  } catch {
    // Auth store not available (e.g. anon flow / test bundle) — return
    // the path unchanged. Same behavior as the explicit anonymous case.
    return path;
  }
}
