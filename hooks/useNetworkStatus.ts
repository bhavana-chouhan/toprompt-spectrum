import { useEffect, useRef, useState } from 'react';

export type NetworkType = 'wifi' | 'cellular' | 'unknown' | 'none';

export interface NetworkStatus {
  /**
   * True when the device reports any active network connection (Wi-Fi,
   * cellular, ethernet). Defaults to true on first render so we never flash
   * an offline banner while NetInfo's initial event is in flight.
   *
   * Debounced: an offline event must persist for OFFLINE_DEBOUNCE_MS before
   * flipping this to false. This suppresses the false-positive "Slow
   * Connection" banner that appears during Metro hot-reloads and brief
   * WebSocket reconnect blips. Reconnects do NOT debounce — flipping back
   * to true is instant so the banner clears immediately when service is
   * restored.
   */
  isConnected: boolean;
  /**
   * NetInfo's "internet reachable" probe (best-effort DNS hit). May be:
   *   • true  — connected AND a probe succeeded.
   *   • false — connected but the probe failed (e.g. captive portal).
   *   • null  — probe hasn't completed yet, or NetInfo isn't available.
   */
  isInternetReachable: boolean | null;
  /** Connection type when known. */
  type: NetworkType;
}

const DEFAULT_STATUS: NetworkStatus = {
  isConnected: true,
  isInternetReachable: null,
  type: 'unknown',
};

/**
 * Milliseconds an offline event must persist before flipping isConnected
 * to false. NetInfo's isConnected flickers on every Metro hot-reload and
 * brief WebSocket reconnect; without this debounce the OfflineBanner
 * pops up multiple times per session on a perfectly healthy network.
 * Real outages persist for seconds — 800ms is short enough to surface
 * them quickly, long enough to filter transient blips.
 */
const OFFLINE_DEBOUNCE_MS = 800;

/**
 * Subscribe to device network status. Returns the latest known status; the
 * value updates whenever NetInfo emits a change event.
 *
 * Implementation notes:
 *   • Uses require() (not static import) so the module is loaded lazily and
 *     a missing native module degrades gracefully to DEFAULT_STATUS instead
 *     of a Metro resolve error.
 *   • Cleans up the subscription on unmount so screen-level usages don't
 *     leak listeners.
 *   • Debounces offline → online transitions only one direction: a brief
 *     drop-and-recover never flips isConnected, but a sustained outage
 *     surfaces after OFFLINE_DEBOUNCE_MS. Reconnects are instant.
 */
export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(DEFAULT_STATUS);
  // Pending offline-flip timer ID; cleared on every event so a quick
  // reconnect (within OFFLINE_DEBOUNCE_MS) cancels the pending offline flip.
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let NetInfo: any = null;
    try {
      // Lazy require — if @react-native-community/netinfo isn't installed
      // or its native module failed to link, fall through to default
      // status (assumes online; no banner) rather than crashing.
      NetInfo = require('@react-native-community/netinfo').default;
    } catch {
      return; // keep DEFAULT_STATUS
    }
    if (!NetInfo || typeof NetInfo.addEventListener !== 'function') {
      return;
    }

    const clearPendingOffline = () => {
      if (offlineTimerRef.current) {
        clearTimeout(offlineTimerRef.current);
        offlineTimerRef.current = null;
      }
    };

    const apply = (raw: any) => {
      const rawType: string = typeof raw?.type === 'string' ? raw.type : 'unknown';
      const normalizedType: NetworkType =
        rawType === 'wifi' || rawType === 'cellular' || rawType === 'none' ? rawType : 'unknown';
      const isConnectedNow = raw?.isConnected !== false;
      const isInternetReachable =
        typeof raw?.isInternetReachable === 'boolean' ? raw.isInternetReachable : null;

      if (isConnectedNow) {
        // Online — flip immediately, cancel any pending offline timer.
        clearPendingOffline();
        setStatus({ isConnected: true, isInternetReachable, type: normalizedType });
        return;
      }

      // Offline — debounce. Update type + reachability now (cosmetic),
      // but only flip isConnected to false after the debounce window
      // confirms the outage is real.
      setStatus((prev) => ({ ...prev, isInternetReachable, type: normalizedType }));
      if (offlineTimerRef.current) return; // already pending
      offlineTimerRef.current = setTimeout(() => {
        offlineTimerRef.current = null;
        setStatus((prev) => ({ ...prev, isConnected: false }));
      }, OFFLINE_DEBOUNCE_MS);
    };

    // Apply initial snapshot then subscribe to changes.
    if (typeof NetInfo.fetch === 'function') {
      NetInfo.fetch().then(apply).catch(() => {});
    }
    const unsubscribe = NetInfo.addEventListener(apply);
    return () => {
      clearPendingOffline();
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  return status;
}
