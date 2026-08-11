/**
 * Logout cleanup registry. Wipes every per-entity store so a subsequent
 * login can't see the previous user's data.
 *
 * Do NOT edit by hand — regenerated from state.pageManifest.entities on every
 * build. New entities automatically get added; removed entities automatically
 * get dropped.
 *
 * Infrastructure stores (useAuthStore, useAppStore, useUserPreferencesStore)
 * are intentionally excluded — see plan for rationale.
 */
import { useSwipeStore } from './useSwipeStore';
import { useMatchStore } from './useMatchStore';

export function resetAllUserStores(): void {
  useSwipeStore.setState({ swipes: [], loading: false, error: null });
  useMatchStore.setState({ matchs: [], loading: false, error: null });
}
