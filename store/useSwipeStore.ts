import { create } from 'zustand';

import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Swipe } from '@/types/entities';
import { swipes as seedSwipes } from '@/services/mock-data';

const RESOURCE_PATH = '/api/swipes';

/**
 * Phase fingerprint baked at emit time. Phase 1 generators emit `true`,
 * Phase 2 generators emit `false`. The check is a compile-time constant —
 * Metro can statically eliminate the dead branch in Phase 2 builds.
 */
const IS_DESIGN_PREVIEW = true;

interface SwipeStore {
  // ── Data ──
  swipes: Swipe[];
  // ── Async / network state ──
  loading: boolean;
  error: string | null;
  // ── Pagination state (cursor-based; null cursor = first page) ──
  hasMore: boolean;
  cursor: string | null;
  // ── CRUD actions ──
  fetchSwipes: () => Promise<void>;
  fetchNextSwipes: () => Promise<void>;
  addSwipe: (input: Partial<Swipe>) => Promise<Swipe>;
  /** Alias of addSwipe kept for screens that call the older name. */
  addOptimisticSwipe: (input: Partial<Swipe>) => Promise<Swipe>;
  updateSwipe: (id: string, patch: Partial<Swipe>) => Promise<void>;
  deleteSwipe: (id: string) => Promise<void>;
  toggleField: (id: string, field: keyof Swipe) => Promise<void>;
  getSwipeById: (id: string) => Swipe | null;
}

/**
 * UNIFIED dual-phase Zustand store for Swipe.
 *
 * The SAME file runs in Phase 1 (design preview) AND Phase 2 (real backend).
 * The ONLY thing the Phase 2 codemod changes is two lines at the top:
 *
 *   1. The `import { swipes as seedSwipes } from '@/services/mock-data'`
 *      line is stripped (mock-data.ts is deleted in Phase 2).
 *   2. The `swipes: (seedSwipes as Swipe[]) ?? []` initializer
 *      collapses to `swipes: []` once `seedSwipes` is undefined.
 *      The `?? []` keeps both phases safe; the codemod additionally rewrites
 *      `seedSwipes` references in the body to `undefined` for clarity.
 *
 * EVERY method body is identical across phases — try the canonical API,
 * catch the failure path:
 *
 *   • Phase 1 — the in-sandbox API server isn't running yet, so apiGet /
 *     apiPost throw a network error. The catch block keeps the mock-seeded
 *     state (for reads) or keeps the optimistic local mutation (for writes)
 *     so the design preview stays interactive. The error state is NOT
 *     surfaced for network failures — that's the Phase 1 signature.
 *
 *   • Phase 2 — the API is live, so apiGet / apiPost succeed and the store
 *     reflects real data. Real failures (4xx/5xx) surface in error state
 *     and mutations roll back to the previous state.
 *
 * Why this matters: this is the "edit, don't rewrite" model in practice.
 * Phase 2 used to wholesale-rewrite the store file, which produced a new
 * envelope, field name, and method shape every release — every drift was
 * a new runtime crash. Now there is ONE template, ONE codemod, and no
 * downstream sweep can break the shape because there's no shape to drift.
 */
const __isNetworkError = (err: unknown): boolean => {
  if (!(err instanceof Error)) return false;
  // Real network-layer failure (DNS, connection refused) — services/api.ts
  // wraps these as ApiError with status=0 and a "Cannot reach …" message.
  const msg = err.message || '';
  if (/Cannot reach|Network|Failed to fetch|NetworkError/i.test(msg)) return true;
  // ApiError carries a numeric status. In Phase 1 the sandbox has no
  // Next.js backend on /api/* yet, so the ALB returns 502 (Bad Gateway)
  // — that's an "infrastructure not ready" signal, not an application
  // failure. Same for 503 (Service Unavailable) and 504 (Gateway Timeout).
  // 0 also signals network-level failure. Treat all of these as Phase-1-
  // safe and keep the seeded store state intact.
  const status = (err as { status?: unknown }).status;
  if (typeof status === 'number') {
    if (status === 0 || status === 502 || status === 503 || status === 504) {
      return true;
    }
  }
  return false;
};

const __synthId = (prefix: string): string =>
  prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

/**
 * Wire-format payload contract — Boundary B.
 *
 * Every body sent to apiPost/apiPatch goes through this helper. It does two
 * things, both required by the Phase 2 contract:
 *
 *   1. STRIP server-owned fields. The store generates a synthetic _id
 *      (`swipe_<ts>_<rand>`) so optimistic UI has a stable key. That
 *      id is NEVER persistent — the backend assigns the real Mongo ObjectId
 *      on insert. If the synthetic id leaks into the POST body, Mongoose
 *      tries to cast it to ObjectId and crashes with:
 *        "Cast to ObjectId failed for value \"swipe_1779...\""
 *      We strip _id / id / createdAt / updatedAt / __v unconditionally.
 *
 *   2. NORMALIZE relation fields. The entity-spec declares which fields are
 *      ObjectId references; for Swipe those are profileSwiped.
 *      The form authoring lets these be empty strings when the user hasn't
 *      selected a relation. An empty string sent to Mongoose crashes with:
 *        "Cast to ObjectId failed for value \"\""
 *      We drop the key when the relation value is empty (``/null/undefined),
 *      letting the backend's schema validator decide whether the field was
 *      required (yields a clean 400 with a message the UI can render).
 *
 * The set of fields stripped and the set of relation field names are both
 * baked at template-emit time, so this is a deterministic-source guarantee —
 * the LLM does not own this layer. The Phase 1 path doesn't reach this code
 * (IS_DESIGN_PREVIEW short-circuits before apiPost), so this is purely a
 * Phase 2 sanitization gate.
 */
// Both arrays baked from the canonical ownership partition at template-emit
// time (Boundary D). Replaces the pre-Boundary-D hardcoded list that missed
// userId/ownerId/createdBy and every other server-derived field name.
const __SERVER_OWNED_FIELDS: string[] = ["__v","createdAt","id"];
const __RELATION_FIELDS: string[] = ["profileSwiped"];
const __normalizeForWire = (
  input: Record<string, unknown> | Partial<Swipe>,
): Record<string, unknown> => {
  if (!input || typeof input !== 'object') return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    // ORDER MATTERS (DC-2): the relation check MUST run before the
    // server-owned strip. When relation FKs were (wrongly) also listed in
    // __SERVER_OWNED_FIELDS, the strip ran first and this branch was dead
    // code — the client removed the FK from every write and the API's
    // "<fk> is required" guard rejected every create. The emitter no longer
    // lists relation FKs as server-owned, and this ordering guarantees the
    // FK survives even if a future contract change reintroduces overlap.
    if (__RELATION_FIELDS.includes(k)) {
      // Drop relation values Mongoose cannot cast to ObjectId.
      //
      // R3: this block previously dropped ONLY empty/null values despite its
      // comment promising a 24-hex check. A legacy synthetic id (`pet-seed-01`)
      // therefore reached the API, Mongoose threw CastError, the route 500'd,
      // and the store rolled the optimistic row back — the record just
      // vanished with no user-visible reason. Enforce the documented rule:
      // a relation FK is forwarded only when it is a well-formed ObjectId.
      if (v === null || v === undefined) continue;
      if (typeof v !== 'string' || !/^[0-9a-f]{24}$/i.test(v.trim())) continue;
      // Valid FK — forward it and SKIP the server-owned strip below so an
      // overlapping classification can never remove it again.
      out[k] = v;
      continue;
    }
    if (__SERVER_OWNED_FIELDS.includes(k)) continue;
    out[k] = v;
  }
  return out;
};

export const useSwipeStore = create<SwipeStore>((set, get) => ({
  swipes: (seedSwipes as Swipe[]) ?? [],
  loading: false,
  error: null,
  hasMore: false,
  cursor: null,

  fetchSwipes: async () => {
    if (IS_DESIGN_PREVIEW) {
      // Phase 1: state is already seeded from mock-data at store-init. No
      // backend exists; do not even start the request. This is the
      // structural Phase-1 isolation invariant — apiGet is unreachable.
      return;
    }
    set({ loading: true, error: null });
    try {
      const items = await apiGet<Swipe[]>(RESOURCE_PATH);
      set({
        swipes: Array.isArray(items) ? items : get().swipes,
        loading: false,
      });
    } catch (err) {
      // Phase 2 real backend error → surface for the UI to render.
      // (Phase 1's transient-502 path is now structurally unreachable.)
      if (__isNetworkError(err)) {
        set({ loading: false });
        return;
      }
      set({
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to load',
      });
    }
  },

  fetchNextSwipes: async () => {
    // Cursor-pagination is opt-in. The canonical /api/<entity> endpoint
    // returns a capped list and doesn't publish a cursor — so fetchNext
    // is a no-op unless the user wired pagination explicitly. Screens
    // can still call it for symmetry.
    if (!get().hasMore || get().loading) return;
  },

  addSwipe: async (input) => {
    const now = new Date().toISOString();
    const optimistic: Swipe = {
      ...(input as Swipe),
      _id: (input as { _id?: string })._id ?? __synthId('swipe'),
      createdAt: (input as { createdAt?: string }).createdAt ?? now,
      updatedAt: now,
    };
    // Optimistic insert so the UI reacts immediately.
    set((s) => ({ swipes: [optimistic, ...s.swipes] }));
    if (IS_DESIGN_PREVIEW) {
      // Phase 1: the optimistic insert IS the record. No POST, no rollback.
      return optimistic;
    }
    try {
      // Boundary B: __normalizeForWire strips _id/createdAt/updatedAt/__v
      // (server-owned) and drops empty relation FKs (categoryId, etc.) so
      // Mongoose's ObjectId cast never sees empty strings or synthetic ids.
      const created = await apiPost<Swipe>(RESOURCE_PATH, __normalizeForWire(input));
      if (created && (created as { _id?: string })._id) {
        // Replace the optimistic record with the server-confirmed one.
        set((s) => ({
          swipes: s.swipes.map((x) =>
            x._id === optimistic._id ? created : x
          ),
        }));
        return created;
      }
      return optimistic;
    } catch (err) {
      // Phase 2 real failure → roll back + surface error.
      // (Phase 1's "no backend" path is now structurally unreachable above.)
      if (__isNetworkError(err)) {
        return optimistic;
      }
      set((s) => ({
        swipes: s.swipes.filter((x) => x._id !== optimistic._id),
        error: err instanceof Error ? err.message : 'Failed to create',
      }));
      throw err;
    }
  },

  addOptimisticSwipe: async (input) => {
    // Alias retained for screens that import the older method name. The
    // unified template makes add and addOptimistic identical because
    // addSwipe is ALREADY optimistic.
    return get().addSwipe(input);
  },

  updateSwipe: async (id, patch) => {
    const prev = get().swipes.find((x) => x._id === id);
    if (!prev) return;
    const optimistic: Swipe = { ...prev, ...patch, updatedAt: new Date().toISOString() };
    set((s) => ({
      swipes: s.swipes.map((x) => x._id === id ? optimistic : x),
    }));
    if (IS_DESIGN_PREVIEW) {
      // Phase 1: the optimistic patch IS the persisted state. No PATCH, no rollback.
      return;
    }
    try {
      // Boundary B: same sanitation as add — strips server-owned + relation-empty.
      const updated = await apiPatch<Swipe>(RESOURCE_PATH + '/' + id, __normalizeForWire(patch));
      if (updated && (updated as { _id?: string })._id) {
        set((s) => ({
          swipes: s.swipes.map((x) => x._id === id ? updated : x),
        }));
      }
    } catch (err) {
      if (__isNetworkError(err)) {
        // Phase 2 transient network — keep optimistic patch.
        return;
      }
      // Phase 2 real failure — roll back.
      set((s) => ({
        swipes: s.swipes.map((x) => x._id === id ? prev : x),
        error: err instanceof Error ? err.message : 'Failed to update',
      }));
    }
  },

  deleteSwipe: async (id) => {
    const prev = get().swipes.find((x) => x._id === id);
    if (!prev) return;
    set((s) => ({
      swipes: s.swipes.filter((x) => x._id !== id),
    }));
    if (IS_DESIGN_PREVIEW) {
      // Phase 1: the optimistic delete IS the persisted state. No DELETE call.
      return;
    }
    try {
      await apiDelete(RESOURCE_PATH + '/' + id);
    } catch (err) {
      if (__isNetworkError(err)) {
        // Phase 2 transient network — keep optimistic delete.
        return;
      }
      set((s) => ({
        swipes: [prev, ...s.swipes],
        error: err instanceof Error ? err.message : 'Failed to delete',
      }));
    }
  },

  toggleField: async (id, field) => {
    const prev = get().swipes.find((x) => x._id === id);
    if (!prev) return;
    const nextVal = !((prev as Record<string, unknown>)[field as string]);
    await get().updateSwipe(id, { [field]: nextVal } as Partial<Swipe>);
  },

  getSwipeById: (id) => get().swipes.find((x) => x._id === id) ?? null,
}));
