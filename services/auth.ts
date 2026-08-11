import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

import { ApiError, apiGet, apiPost, getStoredAuthToken, setStoredAuthToken } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { resetAllUserStores } from '@/store/resetAllStores';
import { AUTH_ROUTE } from '@/constants/navigation';

const APP_PHASE = 'design';
const IS_DESIGN_PREVIEW = APP_PHASE === 'design';
const AUTH_USER_STORAGE_KEY = 'toprompt.auth-user';
// Storage key for the phase fingerprint. When APP_PHASE differs from the
// previously-stored value (e.g. a project graduates from 'design' → 'full'),
// migratePhaseIfNeeded() wipes any auth cache from the prior phase so the
// new phase doesn't inherit a stale mock-user identity.
const PHASE_FINGERPRINT_KEY = 'toprompt.app-phase';
// Sentinel _id used by the Phase 1 mock user. Phase 2 must NEVER trust a
// cached user with this _id — it's the leftover from design preview and
// would silently auto-authenticate the user on real Phase 2 cold boot.
const MOCK_USER_SENTINEL_ID = 'preview-user';

export interface AuthUser {
  _id: string;
  id?: string;
  username: string;
  name?: string;
  email: string;
  role: string;
  avatarUrl?: string;
}

interface AuthEnvelope {
  success?: boolean;
  error?: string;
  message?: string;
  token?: string;
  authToken?: string;
  user?: unknown;
  data?: unknown;
}

const MOCK_USER: AuthUser = {
  _id: 'preview-user',
  id: 'preview-user',
  username: 'preview_user',
  name: 'Preview User',
  email: 'preview@example.com',
  role: 'member',
  avatarUrl: '',
};

function normalizeAuthUser(input: unknown): AuthUser | null {
  if (!input || typeof input !== 'object') return null;
  const value = input as Record<string, unknown>;
  const id = String(value._id || value.id || '').trim();
  const username = String(value.username || value.displayName || value.name || '').trim();
  const email = String(value.email || '').trim();

  if (!id || !email) return null;

  return {
    _id: id,
    id,
    username: username || email.split('@')[0] || 'member',
    name: String(value.name || value.displayName || username || '').trim() || undefined,
    email,
    role: String(value.role || 'member'),
    avatarUrl: String(value.avatarUrl || value.profileImage || ''),
  };
}

/**
 * User profile persistence.
 *
 * Storage split:
 *   - JWT token  → expo-secure-store (encrypted, iOS Keychain / Android Keystore)
 *   - User JSON  → AsyncStorage (non-sensitive profile data — easier to inspect
 *                  via React DevTools; no encryption overhead needed)
 *
 * Prior scaffolds stored the user in secure-store too. The one-time migration
 * helper below copies a legacy secure-store entry into AsyncStorage on first
 * read, then deletes the secure-store copy so future reads go straight to
 * AsyncStorage.
 */
async function readCachedUser(): Promise<AuthUser | null> {
  try {
    await migrateUserCacheIfNeeded();
    const raw = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (!raw) return null;
    return normalizeAuthUser(JSON.parse(raw));
  } catch {
    return null;
  }
}

async function cacheUser(user: AuthUser | null): Promise<void> {
  try {
    if (!user) {
      await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore persistence failures — the caller still gets the in-memory user object.
  }
}

let migrationAttempted = false;
async function migrateUserCacheIfNeeded(): Promise<void> {
  if (migrationAttempted) return;
  migrationAttempted = true;
  try {
    // If AsyncStorage already has the user, nothing to do.
    const existing = await AsyncStorage.getItem(AUTH_USER_STORAGE_KEY);
    if (existing) return;
    // Check the legacy secure-store location.
    const legacy = await SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY);
    if (!legacy) return;
    await AsyncStorage.setItem(AUTH_USER_STORAGE_KEY, legacy);
    await SecureStore.deleteItemAsync(AUTH_USER_STORAGE_KEY);
  } catch {
    // Migration is best-effort. If secure-store access fails (e.g. on web),
    // readCachedUser will just return null — user re-authenticates.
  }
}

let phaseMigrationAttempted = false;
/**
 * One-time-per-boot phase-transition guard.
 *
 * When a project is built in Phase 1 (design preview) the user runs through
 * the mock auth flow which writes MOCK_USER (sentinel _id 'preview-user') to
 * AsyncStorage. Later, the same project graduates to Phase 2 (real backend).
 * Without this migration, on the next cold boot the Phase 2 `getCurrentUser`
 * call to /api/auth/me fails (no real token yet) and the older code silently
 * fell back to the cached mock user — flipping the auth store to
 * 'authenticated' and skipping the login screen entirely. The user landed on
 * the home tab without ever logging in, with empty real data because no
 * Bearer token meant every list query 401'd.
 *
 * The fix: stash the current APP_PHASE value in storage. On every boot,
 * compare. If the phase differs (or there's no fingerprint yet), wipe the
 * auth cache + token before `getCurrentUser` runs. Idempotent — once
 * the fingerprint matches, future boots are no-ops.
 *
 * Edge case: a hypothetical Phase 2 → Phase 1 downgrade (not a supported
 * flow) would also wipe a real user's session here. That's acceptable
 * because (a) it's not a flow we generate, and (b) wiping is safer than
 * carrying real credentials into a mock environment.
 */
async function migratePhaseIfNeeded(): Promise<void> {
  if (phaseMigrationAttempted) return;
  phaseMigrationAttempted = true;
  try {
    const previous = await AsyncStorage.getItem(PHASE_FINGERPRINT_KEY);
    if (previous === APP_PHASE) return;
    // Phase changed (or first run on a freshly-installed app). Wipe everything
    // auth-related so Phase 2 doesn't inherit Phase 1's mock identity.
    await AsyncStorage.removeItem(AUTH_USER_STORAGE_KEY);
    try {
      await SecureStore.deleteItemAsync('toprompt.auth-token');
    } catch {
      // SecureStore unavailable on web — the mobile token storage is the
      // canonical path; web fallback uses AsyncStorage and clearAuth covers it.
    }
    await AsyncStorage.setItem(PHASE_FINGERPRINT_KEY, APP_PHASE);
  } catch {
    // Best-effort. If migration fails, the worst case is one stale-cache
    // boot — which the sentinel guard in getCurrentUser still rejects.
  }
}

function extractAuthToken(payload: AuthEnvelope | null | undefined): string | null {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.token === 'string' && payload.token) return payload.token;
  if (typeof payload.authToken === 'string' && payload.authToken) return payload.authToken;
  if (payload.data && typeof payload.data === 'object') {
    const nested = payload.data as Record<string, unknown>;
    if (typeof nested.token === 'string' && nested.token) return nested.token;
    if (typeof nested.authToken === 'string' && nested.authToken) return nested.authToken;
  }
  return null;
}

function extractAuthUser(payload: AuthEnvelope | null | undefined): AuthUser | null {
  if (!payload || typeof payload !== 'object') return null;
  return (
    normalizeAuthUser(payload.user) ||
    normalizeAuthUser(payload.data) ||
    (payload.data && typeof payload.data === 'object'
      ? normalizeAuthUser((payload.data as Record<string, unknown>).user)
      : null)
  );
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  // Run the phase-transition guard FIRST (idempotent / once per boot). If
  // APP_PHASE changed since the last boot — most importantly Phase 1 → Phase 2
  // — this wipes any mock-user cache before we look at it.
  await migratePhaseIfNeeded();

  if (IS_DESIGN_PREVIEW) {
    // Phase 1 auth contract:
    //   - First cold boot (no cached user) → returns null → root layout
    //     flips status to 'unauthenticated' → redirect to /(auth)/login
    //     so the user previews the login screen FIRST.
    //   - After mock login() was called (any email/password) → cached user
    //     exists → returned here → root layout flips to 'authenticated' →
    //     redirect to HOME_ROUTE. This is also how Phase 1 previews
    //     "remember me" behavior — reopening the app keeps the user signed
    //     in if they haven't explicitly tapped Sign Out.
    //   - logout() in this same file clears the cache + flips state to
    //     unauthenticated, so Sign Out → back to /(auth)/login as expected.
    const cached = await readCachedUser();
    return cached;
  }

  // Phase 2 (real backend) auth contract — STRICT: no silent cache fallback.
  //
  // Past behavior fell back to readCachedUser() when /api/auth/me failed,
  // which on a Phase 1 → Phase 2 graduation would return the cached MOCK_USER
  // (preview-user sentinel) and silently auto-authenticate the new build —
  // skipping the login screen and producing an empty home view because no
  // real Bearer token meant every entity-list call 401'd. Now:
  //
  //   1. No stored token  → unauth, clear any leftover cache, return null.
  //   2. /api/auth/me returns a real user → cache and return it.
  //   3. /api/auth/me explicitly returned but no user (token invalid) →
  //      clear the bad token + cache, return null.
  //   4. /api/auth/me threw (network down, 5xx, etc.) → network is genuinely
  //      down; we don't know if the user is auth'd. Return null and require
  //      a fresh login. The only state we can verify is "no token", and we
  //      shouldn't pretend a stale cache is fresh authentication.
  //   5. ANY path returning a user with the MOCK_USER_SENTINEL_ID is rejected
  //      and the cache is wiped — Phase 2 must never authenticate as the
  //      preview-user identity even if the API echoed it.
  const token = await getStoredAuthToken();
  if (!token) {
    await cacheUser(null);
    return null;
  }

  let payload: unknown;
  try {
    payload = await apiGet<unknown>('/api/auth/me');
  } catch {
    // Real-network failure: don't fall back to cache. Splash stays visible
    // while this resolves, so the user sees a brief load — not a fake auth.
    return null;
  }

  const user = normalizeAuthUser(
    payload && typeof payload === 'object' && 'user' in (payload as Record<string, unknown>)
      ? (payload as Record<string, unknown>).user
      : payload,
  );

  if (!user) {
    // API responded but no valid user → stored token is bad. Clear it.
    await setStoredAuthToken(null);
    await cacheUser(null);
    return null;
  }

  if (user._id === MOCK_USER_SENTINEL_ID || user.id === MOCK_USER_SENTINEL_ID) {
    // Hard-reject the Phase 1 sentinel. Should never happen via a real Phase 2
    // backend, but if it does (e.g. bad seed data, dev shenanigans), refuse.
    await setStoredAuthToken(null);
    await cacheUser(null);
    return null;
  }

  await cacheUser(user);
  return user;
}

export async function login(
  email: string,
  password: string,
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  if (IS_DESIGN_PREVIEW) {
    const user: AuthUser = { ...MOCK_USER, email: email || MOCK_USER.email };
    // Mock auth still persists across app restarts (cached user) so session
    // persistence works in Phase 1 design preview too.
    await cacheUser(user);
    useAuthStore.getState().setAuth(user);
    return { success: true, user };
  }

  try {
    const payload = await apiPost<AuthEnvelope>(
      '/api/auth/login',
      { email, password },
      { useAuth: false, unwrapData: false },
    );

    const token = extractAuthToken(payload);
    if (token) {
      await setStoredAuthToken(token);
    }

    // Try response payload first, then a fresh /api/auth/me lookup with the
    // just-stored token. We deliberately do NOT fall back to readCachedUser
    // here — a Phase 1 mock cache must not pose as a Phase 2 login success.
    let user = extractAuthUser(payload);
    if (!user && token) {
      user = await getCurrentUser();
    }

    if (!user) {
      // Login API responded "success" but we have no usable user object AND
      // /api/auth/me didn't return one either. Surface this to the user as
      // a login failure rather than pretending success and landing them in
      // an empty home view. Most likely cause: the generated /api/auth/login
      // route returned only `{ token }` without `user` — a regression in
      // the api-generator prompt that the smoke-fixture should catch.
      // eslint-disable-next-line no-console
      console.warn('[auth.login] success response missing user payload; aborting login');
      await setStoredAuthToken(null);
      return {
        success: false,
        error: 'Login succeeded but the server did not return a user profile. Please try again.',
      };
    }

    await cacheUser(user);
    // Flip auth status — the root layout's segment effect picks this up and
    // redirects to /(tabs). Screens MUST NOT call router.replace themselves.
    useAuthStore.getState().setAuth(user);

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, 'Unable to sign in right now.'),
    };
  }
}

export async function signup(
  name: string,
  email: string,
  password: string,
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  if (IS_DESIGN_PREVIEW) {
    const user: AuthUser = {
      ...MOCK_USER,
      name: name || MOCK_USER.name,
      username: name ? name.toLowerCase().replace(/\s+/g, '_') : MOCK_USER.username,
      email: email || MOCK_USER.email,
    };
    await cacheUser(user);
    useAuthStore.getState().setAuth(user);
    return { success: true, user };
  }

  try {
    // Derive a username from email so signup works whether the server schema
    // requires it or not. Some api-mobile generations include `username` in
    // the User schema (zod.string().min(3)), others derive it server-side.
    // Sending it always is the safe path — extra fields are ignored if unused.
    const usernameSeed = (email.split('@')[0] || name || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 30);
    const username = usernameSeed.length >= 3 ? usernameSeed : `user_${usernameSeed}${Math.random().toString(36).slice(2, 6)}`;

    const payload = await apiPost<AuthEnvelope>(
      '/api/auth/signup',
      { username, name, email, password },
      { useAuth: false, unwrapData: false },
    );

    const token = extractAuthToken(payload);
    if (token) {
      await setStoredAuthToken(token);
    }

    // Same hardening as login(): try the response payload, then a fresh
    // /api/auth/me. NEVER fall back to readCachedUser — Phase 1 mock cache
    // must not silently pose as a Phase 2 signup result.
    let user = extractAuthUser(payload);
    if (!user && token) {
      user = await getCurrentUser();
    }

    if (!user) {
      // eslint-disable-next-line no-console
      console.warn('[auth.signup] success response missing user payload; aborting signup');
      await setStoredAuthToken(null);
      return {
        success: false,
        error: 'Account created but the server did not return your profile. Please try signing in.',
      };
    }

    await cacheUser(user);
    useAuthStore.getState().setAuth(user);

    return {
      success: true,
      user,
    };
  } catch (error) {
    return {
      success: false,
      error: getErrorMessage(error, 'Unable to create your account right now.'),
    };
  }
}

export async function logout(): Promise<void> {
  // JWT is stateless — no server-side session to invalidate, so we skip any
  // /api/auth/logout POST. Previous scaffolds called it and swallowed the 404
  // (the mobile api scaffold never emitted that route). Clearing the token
  // on the client is sufficient: every subsequent request lacks the Bearer
  // header and the middleware rejects it.
  // If you later add refresh-token rotation, revisit this: a server POST is
  // needed to invalidate the refresh token.

  await setStoredAuthToken(null);
  await cacheUser(null);
  // Wipe every per-entity Zustand slice so user-A's data never leaks into
  // user-B's session. Infrastructure stores (theme, preferences) are NOT
  // reset — those belong to the device, not the user.
  try {
    resetAllUserStores();
  } catch {
    // resetAllUserStores is best-effort: if one store's setState throws,
    // we still clear the auth flag below.
  }
  // Flip auth status → root layout redirects. The explicit router.replace
  // below is a belt-and-braces guarantee: if logout is called from deep
  // inside a stack (e.g. a settings screen), the segment effect may take a
  // tick to fire. The explicit replace makes the UX immediate.
  useAuthStore.getState().clearAuth();
  try {
    router.replace(AUTH_ROUTE);
  } catch {
    // router may not be mounted in unusual flows (e.g. called from a web build).
  }
}

export async function hasActiveSession(): Promise<boolean> {
  if (IS_DESIGN_PREVIEW) return true;
  const token = await getStoredAuthToken();
  if (token) return true;
  const cachedUser = await readCachedUser();
  return Boolean(cachedUser);
}

// LLM-friendly aliases — kept in sync with CANONICAL_MODULE_EXPORTS in
// apps/agent-server/src/workflows/nodes/validate-and-fix/post-loop-mobile-imports.ts.
// Some screens import `signOut` / `signIn` / `signUp` (camelCase noun-style)
// instead of `logout` / `login` / `signup` (verb-style). Both call the same
// code path. Without these aliases, post-loop-mobile-imports silently strips
// the alternate names, leaving the bound buttons connected to `undefined`.
// The screen-archetype auth.template.ts uses `signIn` / `signUp` directly;
// LLM-generated code in the wild uses both forms — the aliases neutralise
// the variance.
export const signOut = logout;
export const signIn = login;
export const signUp = signup;
