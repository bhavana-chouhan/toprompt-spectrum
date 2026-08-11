import { create } from 'zustand';
import type { AuthUser } from '@/services/auth';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthStore {
  status: AuthStatus;
  user: AuthUser | null;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
  markUnauthenticated: () => void;
  /**
   * Boot-time session hydration. Called by app/index.tsx (and any other root
   * entry that needs to know whether the user is authenticated before
   * rendering). Idempotent — running it multiple times is safe.
   *
   * Phase 1 (mock auth): no persisted session exists, so this just flips
   * status from 'loading' → 'unauthenticated' so screens stop spinning.
   * Phase 2 (real auth): services/auth.ts owns the actual token-restore
   * flow via getCurrentUser() and calls setAuth() / clearAuth() directly;
   * hydrate() still provides the fallback markUnauthenticated() so the
   * UI never gets stuck in 'loading' if the token-restore never completes.
   */
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: 'loading',
  user: null,
  setAuth: (user) => set({ status: 'authenticated', user }),
  clearAuth: () => set({ status: 'unauthenticated', user: null }),
  markUnauthenticated: () => set({ status: 'unauthenticated', user: null }),
  hydrate: () => {
    // Idempotent — only the first call transitions out of 'loading'.
    // Subsequent calls are a no-op so multiple useEffect mounts don't
    // thrash the store. setAuth()/clearAuth() override this freely if
    // services/auth.ts later confirms a real session.
    if (get().status !== 'loading') return;
    set({ status: 'unauthenticated' });
  },
}));
