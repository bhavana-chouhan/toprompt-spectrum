import { useEffect } from 'react';

import { useAuthStore } from '@/store/useAuthStore';

/**
 * Boot-time session hydration.
 *
 * Mounted once near the root of the tree (typically inside app/_layout.tsx
 * or app/index.tsx). Reads the persisted token, validates it server-side,
 * and updates useAuthStore so downstream screens render the correct shell
 * (auth / tabs / drawer) on first paint.
 *
 * Idempotent — multiple mounts share the same hydrate() guard inside
 * useAuthStore so concurrent calls don't double-validate.
 */
export function useSessionRestore(): void {
  const setAuth = useAuthStore((s) => s.setAuth);
  const markUnauthenticated = useAuthStore((s) => s.markUnauthenticated);
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    // Only run while auth is still resolving. After the first transition
    // (setAuth / markUnauthenticated) screens own the state machine via
    // login/signup/logout.
    if (status !== 'loading') return;

    let cancelled = false;
    (async () => {
      try {
        // Lazy require: in Phase 1 these modules don't exist and the catch
        // below treats that as "no session" instead of crashing the app.
        const apiModule = require('@/services/api');
        const apiGet = apiModule.apiGet ?? apiModule.apiRequest;
        if (typeof apiGet !== 'function') {
          if (!cancelled) markUnauthenticated();
          return;
        }
        const user = await apiGet('/api/auth/me');
        if (cancelled) return;
        if (user && typeof user === 'object') {
          setAuth(user as any);
        } else {
          markUnauthenticated();
        }
      } catch {
        if (!cancelled) markUnauthenticated();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, setAuth, markUnauthenticated]);
}
