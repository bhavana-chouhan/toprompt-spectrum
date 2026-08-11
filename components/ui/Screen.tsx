import React, { createContext, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Pressable,
  type ViewStyle,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';

import { useTheme } from '@/hooks/useTheme';
import { ErrorState, type ErrorReason } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/SkeletonLoader';

// Track 3.t3-skeleton-transitions — map any thrown / TanStack-Query error
// into the canonical ErrorReason taxonomy so ErrorState renders the right
// copy without screens having to know about it.
function mapErrorToReason(error: unknown): ErrorReason {
  if (!error) return 'unknown';
  const reason = (error as any)?.reason;
  if (reason === 'offline' || reason === 'timeout' || reason === 'server' || reason === 'forbidden' || reason === 'notFound') {
    return reason;
  }
  const status = (error as any)?.status;
  if (typeof status === 'number') {
    if (status === 401 || status === 403) return 'forbidden';
    if (status === 404) return 'notFound';
    if (status >= 500) return 'server';
  }
  const name = (error as any)?.name;
  if (name === 'TimeoutError') return 'timeout';
  // Network / TypeError from fetch usually means offline.
  if (name === 'NetworkError' || name === 'TypeError') return 'offline';
  return 'unknown';
}

// Track 3.t3-skeleton-transitions — variant → Skeleton shimmer subtree.
// Screens pass skeleton='list' | 'detail' | 'form' for a canonical layout,
// or hand in their own JSX for one-off cases.
function renderScreenSkeleton(variant: 'list' | 'detail' | 'form' | React.ReactNode): React.ReactNode {
  if (typeof variant !== 'string') return variant;
  if (variant === 'detail') {
    return (
      <View style={{ padding: 16, gap: 12 }}>
        <Skeleton width="100%" height={180} radius={16} />
        <Skeleton width="60%" height={22} />
        <Skeleton width="100%" height={14} />
        <Skeleton width="90%" height={14} />
        <Skeleton width="80%" height={14} />
      </View>
    );
  }
  if (variant === 'form') {
    return (
      <View style={{ padding: 16, gap: 16 }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ gap: 6 }}>
            <Skeleton width="40%" height={12} />
            <Skeleton width="100%" height={44} radius={10} />
          </View>
        ))}
      </View>
    );
  }
  // Default: list skeleton — five stacked rows mirroring the FlatList rhythm.
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
          <Skeleton width={56} height={56} radius={12} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

/**
 * SCREEN ↔ APPHEADER SAFE-AREA CONTRACT
 * ──────────────────────────────────────
 * The single source of truth for "who owns the top safe-area inset" on a
 * given screen. Without coordination, Screen's <SafeAreaView edges={['top']}>
 * AND AppHeader's internal useSafeAreaInsets().top BOTH push the content
 * down — the user sees ~94px of empty space above the title (the recurring
 * "header has too much top spacing" bug).
 *
 * Rule:
 *   • Screen broadcasts whether it added the 'top' edge to its own
 *     SafeAreaView via this Context.
 *   • AppHeader reads the Context. If Screen already covered top, AppHeader
 *     skips its own inset (uses 0). If Screen did NOT cover top (edges={[]}
 *     or AppHeader rendered standalone outside a Screen), AppHeader applies
 *     the inset itself.
 *
 * Result: top safe-area is always applied EXACTLY ONCE, regardless of which
 * permutation the LLM emits. No regex sweep needed.
 */
export interface ScreenSafeAreaContextValue {
  /** True when an enclosing Screen has already added the 'top' edge. */
  topInsetHandled: boolean;
}

export const ScreenSafeAreaContext = createContext<ScreenSafeAreaContextValue>({
  topInsetHandled: false,
});

export interface ScreenProps {
  children: React.ReactNode;
  /** Enable ScrollView wrapper (default: true) */
  scroll?: boolean;
  /** Apply horizontal + bottom padding (default: true) */
  padded?: boolean;
  /** Enable KeyboardAvoidingView for form screens */
  keyboardAvoiding?: boolean;
  /** Pull-to-refresh loading state */
  refreshing?: boolean;
  /** Pull-to-refresh callback */
  onRefresh?: () => void;
  /**
   * Safe-area edges to apply. Default ['top', 'left', 'right'] is the safe
   * choice for screens WITHOUT an <AppHeader>. When you mount an <AppHeader>
   * inside this Screen, you do NOT need to drop 'top' — the Context coupling
   * tells AppHeader the Screen owns the inset. AppHeader will skip its own.
   *
   * If you explicitly want the Screen to NOT apply any safe-area, pass [].
   * (Useful for screens where you want a hero image to bleed under the
   * status bar.)
   */
  edges?: Edge[];
  /**
   * Track 3.t3-skeleton-transitions — query-aware loading transition.
   *
   * When `loading === true`, Screen renders `skeleton` (a SkeletonLoader
   * variant) INSTEAD of children. Pair with a TanStack Query's isLoading
   * (initial fetch) or isPending so screens never need their own
   * `loading ? ... : ...` ternary.
   *
   * Note: this is for the INITIAL fetch only. Refetches during `isFetching`
   * should keep stale data visible per offlineFirst conventions; use the
   * `refreshing`/`onRefresh` props for pull-to-refresh affordances.
   */
  loading?: boolean;
  /**
   * Skeleton variant rendered while `loading === true`. Defaults to 'list'
   * — appropriate for most data screens. Pass 'detail' for a hero+meta
   * skeleton, 'form' for stacked fields, or 'custom' with your own JSX.
   */
  skeleton?: 'list' | 'detail' | 'form' | React.ReactNode;
  /**
   * Track 3.t3-skeleton-transitions — error transition.
   *
   * When `error` is truthy AND `loading` is false, Screen renders
   * `<ErrorState onRetry={onRetry} reason="..." />` instead of children
   * so screens don't need their own try-catch + ternary. Pair with a
   * TanStack Query's error + refetch.
   */
  error?: unknown;
  /** Called when the user taps the retry button inside the canonical ErrorState. */
  onRetry?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

/**
 * L2 — ScreenErrorBoundary
 *
 * React error boundary that wraps every Screen's children. If anything throws
 * during render (LLM emitted bad field access, undefined access, etc.) the
 * user lands on a polite "Something went wrong" UI with a Retry button —
 * NEVER a white screen, NEVER a crash. The whole-app ErrorBoundary at root
 * still catches anything below this layer.
 *
 * The layered model: input-side strength + build-time validators + this
 * runtime boundary. Even if everything else fails, the user sees a graceful
 * fallback they can recover from.
 */
interface ScreenErrorBoundaryProps {
  children: React.ReactNode;
  bg: string;
  text: string;
  textSecondary: string;
  primary: string;
  primaryText: string;
  surface: string;
}

class ScreenErrorBoundary extends React.Component<
  ScreenErrorBoundaryProps,
  { hasError: boolean; error: Error | null; copied: boolean }
> {
  state = { hasError: false, error: null as Error | null, copied: false };
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error, copied: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    if (typeof console !== 'undefined' && console.error) {
      console.error('[ScreenErrorBoundary]', error, info?.componentStack);
    }
  }

  componentWillUnmount() {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
  }

  reset = () => {
    this.setState({ hasError: false, error: null, copied: false });
  };

  // Contract (PRO2-766): the copy control never disappears after use — it
  // flips to "Copied!" for ~2s, reverts, and stays clickable throughout.
  copyErrorInfo = async () => {
    const err = this.state.error;
    const details = [
      err ? (err.name || 'Error') + ': ' + (err.message || 'Unknown error') : 'Unknown error',
      err && err.stack ? err.stack : '',
    ].filter(Boolean).join('\n\n');
    try {
      await Clipboard.setStringAsync(details);
      this.setState({ copied: true });
      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard unavailable — keep the button as-is rather than hiding it.
    }
  };

  render() {
    if (this.state.hasError) {
      // Real recovery UI (was placeholder bars/dots before): tinted alert
      // icon, "Something went wrong" headline, secondary line explaining
      // the screen can be reloaded, and a primary "Try again" button that
      // resets the boundary to render children fresh. The class-component
      // can't use `useTheme()` (no hooks), so colors are passed in as
      // props from the parent functional Screen component.
      return (
        <View style={[boundaryStyles.fallback, { backgroundColor: this.props.bg }]}>
          <View style={[boundaryStyles.iconCircle, { backgroundColor: this.props.surface }]}>
            <Ionicons name="alert-circle-outline" size={36} color={this.props.primary} />
          </View>
          <Text style={[boundaryStyles.title, { color: this.props.text }]}>
            Something went wrong
          </Text>
          <Text style={[boundaryStyles.message, { color: this.props.textSecondary }]}>
            This screen ran into a problem. You can try again — the rest of
            the app is still working.
          </Text>
          <Pressable
            onPress={this.reset}
            accessibilityRole="button"
            accessibilityLabel="Try again"
            style={({ pressed }) => [
              boundaryStyles.button,
              { backgroundColor: this.props.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={[boundaryStyles.buttonText, { color: this.props.primaryText }]}>
              Try again
            </Text>
          </Pressable>
          <Pressable
            onPress={this.copyErrorInfo}
            accessibilityRole="button"
            accessibilityLabel="Copy error info"
            style={({ pressed }) => [
              boundaryStyles.secondaryButton,
              { borderColor: this.props.textSecondary, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[boundaryStyles.secondaryButtonText, { color: this.props.textSecondary }]}>
              {this.state.copied ? 'Copied!' : 'Copy error info'}
            </Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

const boundaryStyles = StyleSheet.create({
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  // iOS HIG-aligned typography (title3 size for the headline, subhead for
  // the message, bold-semibold for the CTA). Inline literals here because
  // class-component can't read constants/typography via hook.
  title: { fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: 0.38, textAlign: 'center', marginTop: 4 },
  message: { fontSize: 15, lineHeight: 20, letterSpacing: -0.24, textAlign: 'center', maxWidth: 320 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonText: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontWeight: '600' },
  secondaryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 2, borderWidth: 1 },
  secondaryButtonText: { fontSize: 15, lineHeight: 20, letterSpacing: -0.24, fontWeight: '600' },
});

export function Screen({
  children,
  scroll = true,
  padded = true,
  keyboardAvoiding = false,
  refreshing,
  onRefresh,
  style,
  contentStyle,
  edges = ['top', 'left', 'right'],
  loading = false,
  skeleton = 'list',
  error,
  onRetry,
}: ScreenProps) {
  const { colors, screenPadding } = useTheme();

  // Track 3.t3-skeleton-transitions — query-aware loading + error transition.
  //
  // Resolve the rendered body BEFORE wrapping in the error boundary so that
  // the canonical skeleton / ErrorState pair short-circuits children. Phase 2
  // forms / lists pass loading={isLoading} error={error} onRetry={refetch}
  // from TanStack Query — the screen body stays a single JSX tree without
  // `loading ? ... : error ? ... : ...` ternaries.
  let body: React.ReactNode;
  if (loading) {
    body = renderScreenSkeleton(skeleton);
  } else if (error) {
    body = (
      <ErrorState
        reason={mapErrorToReason(error)}
        onRetry={onRetry}
      />
    );
  } else {
    body = children;
  }

  // Wrap the entire screen subtree in a per-screen ErrorBoundary. This is a
  // SECOND layer below the root ErrorBoundary in app/_layout.tsx — a single
  // broken screen no longer takes down sibling screens or the tab shell.
  // The boundary is a class component (hooks not allowed in class), so we
  // pass theme colors as props.
  const safeChildren = (
    <ScreenErrorBoundary
      bg={colors.background}
      text={colors.text ?? '#000'}
      textSecondary={colors.textSecondary ?? '#666'}
      primary={colors.primary}
      primaryText={colors.textInverse ?? '#fff'}
      surface={colors.surface ?? colors.cardBackground ?? '#f0f0f0'}
    >
      {body}
    </ScreenErrorBoundary>
  );

  const content = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        padded ? { paddingHorizontal: screenPadding, paddingBottom: screenPadding + 16 } : null,
        contentStyle,
      ]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets={keyboardAvoiding}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing ?? false} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {safeChildren}
    </ScrollView>
  ) : (
    safeChildren
  );

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  // When edges is empty (e.g. stack screen with AppHeader handling safe area),
  // use a plain View to avoid double safe area insets
  const Container = edges.length > 0 ? SafeAreaView : View;

  // Broadcast to descendants whether THIS Screen added the top edge so that
  // a child <AppHeader> can skip its own useSafeAreaInsets().top. memoized
  // so the context value identity stays stable across re-renders that don't
  // change `edges`.
  const safeAreaContextValue = useMemo<ScreenSafeAreaContextValue>(
    () => ({ topInsetHandled: edges.includes('top') }),
    // edges is a prop array — readers care only about whether 'top' is in it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [edges.includes('top')],
  );

  return (
    <ScreenSafeAreaContext.Provider value={safeAreaContextValue}>
      <Container edges={edges} style={[styles.container, { backgroundColor: colors.background }, style]}>
        {wrapped}
      </Container>
    </ScreenSafeAreaContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  scroll: { flex: 1 },
});