import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

/**
 * Track 3.t3-react-query-canonical — pre-configured TanStack Query client.
 *
 * Defaults:
 *   • staleTime  : 60_000   — list/detail data goes stale after 60s.
 *   • gcTime     : 300_000  — cached responses live 5 minutes post-unmount.
 *   • retry      : 2 attempts with exponential backoff (1s, 2s) capped at 5s.
 *   • networkMode: 'offlineFirst' — cached data still renders during outages.
 *
 * Mirrored in the component-library template emitter
 * (apps/agent-server/src/workflows/nodes/generate-component-library.ts) so
 * Phase 1 (scaffold-only) and Phase 2 (post-injection) ship identical config.
 */
const retryDelay = (attemptIndex: number): number => Math.min(1000 * 2 ** attemptIndex, 5000);

const shouldRetry = (failureCount: number, error: unknown): boolean => {
  const retryable = (error as any)?.retryable;
  if (retryable === false) return false;
  return failureCount < 2;
};

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60 * 1000,
    retry: shouldRetry,
    retryDelay,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    networkMode: 'offlineFirst',
  },
  mutations: {
    retry: 1,
    retryDelay,
    networkMode: 'offlineFirst',
  },
};

export const queryClient = new QueryClient({ defaultOptions });
