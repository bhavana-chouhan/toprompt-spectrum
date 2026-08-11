import React, { useContext } from 'react';
import { Animated, View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Icon } from '@/components/ui/Icon';
import { ScreenSafeAreaContext } from '@/components/ui/Screen';
import { useTheme } from '@/hooks/useTheme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTarget';
import { MobileStyle } from '@/constants/mobileStyle';

// Scroll thresholds for the iOS large-title collapse.
//   • Below LARGE_HIDE_AT — large title at full size + opacity.
//   • Between LARGE_HIDE_AT and COMPACT_SHOW_AT — large title fades down.
//   • Above COMPACT_SHOW_AT — compact navbar title is visible at full opacity.
//
// Tuned to match Apple Notes / iOS Settings: ~50px scroll = full collapse.
const LARGE_HIDE_AT = 16;     // px scroll where large title starts to fade
const LARGE_HIDDEN_AT = 50;   // px scroll where large title is fully hidden
const COMPACT_SHOW_AT = 30;   // px scroll where compact title starts to fade in
const COMPACT_VISIBLE_AT = 60;// px scroll where compact title is fully visible

export interface AppHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  /**
   * Trailing header content. Accepts EITHER:
   *   • An Ionicons name string ('settings-outline', 'add', 'ellipsis-horizontal',
   *     etc.) — coerced into <Ionicons name=... size={22} color={colors.text}/>
   *     at render. This is the LLM's natural idiom for header action icons.
   *   • A React element (Pressable wrapping an icon, a custom badge, etc.) —
   *     rendered as-is.
   * Without the coercion, an LLM emitting <AppHeader rightElement="settings-outline"/>
   * would render a bare string child of <View> and RN would warn "Text strings
   * must be rendered within a <Text> component" — same bug class as the
   * Input primitive fix in commit a15c4bf.
   */
  rightElement?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  /**
   * iOS large-title mode. When true, renders the title at 34pt Bold in-screen
   * (above the content) instead of inline in a compact navbar. Combine with
   * `<Stack.Screen options={{ headerShown: false }} />` so the header in this
   * component is the only visible title. Mirrors the Apple Notes / Settings
   * large-title pattern.
   */
  large?: boolean;
  /**
   * Scroll-aware collapse driver. Pass an `Animated.Value` updated by your
   * ScrollView's `onScroll` event (using `Animated.event`) and the large
   * title will animate down to a compact inline title as the user scrolls —
   * exactly the iOS 11+ Settings / Mail / Notes pattern.
   *
   * Usage:
   *   const scrollY = useRef(new Animated.Value(0)).current;
   *   const onScroll = Animated.event(
   *     [{ nativeEvent: { contentOffset: { y: scrollY } } }],
   *     { useNativeDriver: true }
   *   );
   *   <AppHeader title="Notes" large scrollY={scrollY} />
   *   <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16}>...
   *
   * Only effective in `large` mode. In compact mode, the title is already
   * inline — collapse is a no-op.
   */
  scrollY?: Animated.Value;
  /** @deprecated Safe area is now handled by Screen component with edges={['top']} */
  safeArea?: boolean;
  style?: ViewStyle;
}

export function AppHeader({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightElement,
  large = false,
  scrollY,
  safeArea = false,
  style,
}: AppHeaderProps) {
  const router = useRouter();
  // Coerce a string rightElement into an Ionicons render. Same pattern as
  // the Input primitive (a15c4bf). Defined as a render function so the two
  // render branches below (large vs compact) cannot diverge — both call
  // renderRightElement() with the same coercion logic.
  const renderRightElement = (): React.ReactNode => {
    if (rightElement === null || rightElement === undefined) return null;
    if (typeof rightElement === 'string') {
      // Treat string as an Ionicons name. The Icon primitive already guards
      // against unknown glyph names (renders 'ellipse-outline' fallback),
      // so a typo never shows the "?" glyph.
      return <Icon name={rightElement} size={22} />;
    }
    return rightElement;
  };
  const insets = useSafeAreaInsets();
  const { colors, spacing, borderRadius, typography } = useTheme();

  // ── Screen ↔ AppHeader safe-area coupling (single source of truth) ──
  // If an enclosing <Screen> already applied the 'top' edge to its SafeAreaView,
  // the inset is ALREADY accounted for at the SafeAreaView boundary. AppHeader
  // adding insets.top a second time would double-stack the spacing (~94px on
  // a notched iPhone — the recurring "header has too much top padding" bug).
  //
  // The Screen broadcasts its decision via ScreenSafeAreaContext. When
  // topInsetHandled === true, AppHeader uses 0 (the SafeAreaView already
  // pushed us past the status bar). When false (Screen with edges={[]} OR
  // AppHeader rendered outside a Screen entirely), AppHeader applies the
  // inset itself so the title isn't trapped under the notch.
  //
  // This eliminates the double-inset bug DETERMINISTICALLY without relying
  // on LLM-emitted edges={[...]} props or post-loop regex sweeps.
  const { topInsetHandled } = useContext(ScreenSafeAreaContext);
  const topInset = topInsetHandled ? 0 : insets.top;

  // iOS-native blur background when the project's MobileStyle calls for it
  // (modern-dark, web3, claymorphism use blur). Solid bg otherwise.
  const useBlur = MobileStyle.tabBarBackground === 'blur';

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    router.back();
  };

  // Suppress the back affordance when there is nowhere to go — e.g. a tab root
  // reached via <Redirect>, where router.canGoBack() is false. This kills the
  // stray chevron that appeared on top-level tab screens. An explicit onBack
  // (custom handler, e.g. modal close) always keeps the button.
  const canGoBack = typeof router.canGoBack === 'function' ? router.canGoBack() : false;
  const showBackResolved = showBack && (canGoBack || !!onBack);

  // Compact navbar (default) — inline title next to back button.
  // Large-title mode — title rendered below, no bottom border, no background
  // distinction, so it blends into the screen content.
  if (large) {
    // When scrollY is wired, the large title fades + scales down as the
    // user scrolls and a compact inline title fades in to replace it.
    // Without scrollY, both pieces just render statically (large visible,
    // compact hidden) — so the header behaves like the previous version.
    const largeTitleOpacity = scrollY
      ? scrollY.interpolate({
          inputRange: [0, LARGE_HIDE_AT, LARGE_HIDDEN_AT],
          outputRange: [1, 1, 0],
          extrapolate: 'clamp',
        })
      : 1;
    const largeTitleScale = scrollY
      ? scrollY.interpolate({
          inputRange: [0, LARGE_HIDDEN_AT],
          outputRange: [1, 0.85],
          extrapolate: 'clamp',
        })
      : 1;
    const compactTitleOpacity = scrollY
      ? scrollY.interpolate({
          inputRange: [0, COMPACT_SHOW_AT, COMPACT_VISIBLE_AT],
          outputRange: [0, 0, 1],
          extrapolate: 'clamp',
        })
      : 0;
    // Border + blur fade in together with the compact title — gives the
    // user a clear "header is now sticky" affordance, matching iOS Notes.
    const compactBgOpacity = scrollY
      ? scrollY.interpolate({
          inputRange: [0, COMPACT_SHOW_AT, COMPACT_VISIBLE_AT],
          outputRange: [0, 0, 1],
          extrapolate: 'clamp',
        })
      : 0;

    return (
      <View
        style={[
          styles.largeContainer,
          {
            backgroundColor: colors.background,
            paddingHorizontal: spacing.base,
            paddingTop: topInset + spacing.sm,
            paddingBottom: spacing.base,
          },
          style,
        ]}
      >
        {/* Sticky compact-mode background (blur or solid), fades in as
            user scrolls. Absolutely positioned at the top so it sits
            behind the back button + compact title. */}
        {scrollY ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.collapsedBackground,
              {
                opacity: compactBgOpacity,
                borderBottomColor: colors.separator ?? colors.border,
              },
            ]}
          >
            {useBlur ? (
              <BlurView
                intensity={80}
                tint={colors.background === '#151718' ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} />
            )}
          </Animated.View>
        ) : null}

        <View style={styles.largeTopRow}>
          {showBackResolved ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: pressed ? colors.border : 'transparent',
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Icon name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
          ) : <View style={styles.backButtonPlaceholder} />}
          {/* Compact inline title — invisible until user scrolls. Sits in
              the same row as the back button, centered between back and
              right element. */}
          {scrollY ? (
            <Animated.View style={[styles.compactTitleWrap, { opacity: compactTitleOpacity }]}>
              <Text
                numberOfLines={1}
                style={[typography.headline, { color: colors.text, textAlign: 'center' }]}
              >
                {title}
              </Text>
            </Animated.View>
          ) : null}
          {rightElement ? <View style={styles.right}>{renderRightElement()}</View> : null}
        </View>
        {/* Large title — fades + scales as scrollY exceeds threshold. */}
        <Animated.Text
          numberOfLines={1}
          style={[
            typography.largeTitle,
            styles.largeTitle,
            {
              color: colors.text,
              opacity: largeTitleOpacity,
              transform: [{ scale: largeTitleScale }],
              transformOrigin: 'left center' as any,
            },
          ]}
        >
          {title}
        </Animated.Text>
        {subtitle ? (
          <Animated.Text
            numberOfLines={2}
            style={[
              typography.subhead,
              { color: colors.textSecondary, marginTop: 4, opacity: largeTitleOpacity },
            ]}
          >
            {subtitle}
          </Animated.Text>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          // When blur is enabled, container itself is transparent and the
          // BlurView absoluteFill provides the visual surface. Otherwise
          // a solid background paints normally.
          backgroundColor: useBlur ? 'transparent' : colors.background,
          borderBottomColor: colors.separator ?? colors.border,
          paddingHorizontal: spacing.base,
          paddingTop: topInset + spacing.sm,
          paddingBottom: spacing.sm,
        },
        style,
      ]}
    >
      {useBlur ? (
        <BlurView
          intensity={80}
          tint={colors.background === '#151718' ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.row}>
        <View style={styles.left}>
          {showBackResolved ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              hitSlop={8}
              style={({ pressed }) => [
                styles.backButton,
                {
                  backgroundColor: pressed ? colors.border : 'transparent',
                  borderRadius: borderRadius.full,
                },
              ]}
            >
              <Icon name="chevron-back" size={24} color={colors.primary} />
            </Pressable>
          ) : null}
          <View style={styles.titleWrap}>
            <Text
              numberOfLines={1}
              style={[
                typography.headline,
                styles.title,
                { color: colors.text },
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={[
                  typography.caption1,
                  { color: colors.textSecondary, marginTop: 2 },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        {rightElement ? <View style={styles.right}>{renderRightElement()}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    gap: 12,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButton: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPlaceholder: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    marginBottom: 0,
  },
  right: {
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
  },
  largeContainer: {
    // No border — large-title blends into screen content like iOS Settings.
    // When scrollY is wired, an animated collapsedBackground inside this
    // container fades in to provide the sticky compact-mode surface.
    position: 'relative',
  },
  largeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MIN_TOUCH_TARGET,
    // Sit ABOVE the collapsedBackground (which is absolute at the top
    // of the largeContainer). Without this z-index, the back button
    // would be behind the fading-in compact background.
    zIndex: 2,
  },
  largeTitle: {
    marginTop: 8,
    zIndex: 1, // Stay above any sibling absolute background.
  },
  // Background layer that fades in as the user scrolls past the large
  // title. Sits absolute at the top of the largeContainer, only as tall
  // as the compact navbar row.
  collapsedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: MIN_TOUCH_TARGET + 16, // navbar row + paddingTop
    borderBottomWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    zIndex: 1,
  },
  // Compact title slot — sits in the largeTopRow between back button
  // and right element. Absolutely positioned with a transform-friendly
  // wrapper so the opacity animation runs on the native driver.
  compactTitleWrap: {
    position: 'absolute',
    left: MIN_TOUCH_TARGET + 12,
    right: MIN_TOUCH_TARGET + 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});