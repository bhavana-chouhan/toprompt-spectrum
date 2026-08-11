/**
 * Per-project design-style resolution.
 * Style: Clean Flat (flat-design)

 * Generated from `MobileDesignStyle` and consumed by Button, Input, Card,
 * AppHeader, and TabBar to set their DEFAULT visual variant. Override at
 * call sites with explicit props when a screen needs a different shape.
 */

import { Spacing, BorderRadius } from '@/constants/spacing';

export const MobileStyle = {
  id: 'flat-design',
  name: 'Clean Flat',

  // ── Component shapes ──
  /** Button corner radius bucket: sm / lg / full. Resolved value below. */
  buttonRadius: 'lg' as 'sm' | 'lg' | 'full',
  /** Input default variant. */
  inputStyle: 'outlined' as 'outlined' | 'filled',
  /** Card default style: elevated / outlined / flat / gradient. */
  cardStyle: 'outlined' as 'elevated' | 'outlined' | 'flat' | 'gradient',
  /** Card corner radius bucket. */
  cardRadius: 'lg' as 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full',

  // ── Motion ──
  /** Press scale on Pressable / Button (1.0 = no shrink, 0.92 = strong shrink). */
  pressScale: 0.97,
  /** Screen-enter animation. */
  enterAnimation: 'fade' as 'fade' | 'slide-up' | 'scale-up' | 'none',

  // ── Navigation ──
  tabBarStyle: 'minimal' as 'default' | 'floating' | 'minimal',
  tabBarBackground: 'solid' as 'solid' | 'blur' | 'transparent',
  headerStyle: 'inline' as 'large-title' | 'inline' | 'hidden',

  // ── Surfaces ──
  shadowLevel: 'none' as 'none' | 'subtle' | 'medium' | 'strong',
  spacingDensity: 'default' as 'compact' | 'default' | 'spacious',
} as const;

/**
 * Resolved button border-radius in pixels. Use directly:
 *   <Pressable style={{ borderRadius: BUTTON_RADIUS }} />
 */
export const BUTTON_RADIUS: number = (() => {
  switch (MobileStyle.buttonRadius) {
    case 'sm': return BorderRadius.sm;     // 4 — square-ish, brutalist
    case 'lg': return BorderRadius.lg;     // 12 — modern default
    case 'full': return BorderRadius.full; // 9999 — pill (Cash App, Linear)
    default: return BorderRadius.lg;
  }
})();

/**
 * Resolved card border-radius in pixels.
 */
export const CARD_RADIUS: number = (() => {
  switch (MobileStyle.cardRadius) {
    case 'sm': return BorderRadius.sm;
    case 'md': return BorderRadius.md;
    case 'lg': return BorderRadius.lg;
    case 'xl': return BorderRadius.xl;
    case '2xl': return BorderRadius['2xl'];
    case 'full': return BorderRadius.full;
    default: return BorderRadius.xl;
  }
})();

/**
 * Resolved press-scale transform value.
 */
export const PRESS_SCALE: number = MobileStyle.pressScale;

/**
 * Mapping for the elevation tier component-level. Card.tsx reads this to
 * pick the right Elevation token.
 */
export const SHADOW_TIER: 'none' | 'sm' | 'md' | 'lg' | 'xl' = (() => {
  switch (MobileStyle.shadowLevel) {
    case 'none': return 'none';
    case 'subtle': return 'sm';
    case 'medium': return 'md';
    case 'strong': return 'lg';
    default: return 'md';
  }
})();

/**
 * Vertical gap (px) to put BETWEEN major sections / cards on a screen.
 * Scaled by the design's spacingDensity so a 'compact' app breathes less and a
 * 'spacious' one more — gives every screen a consistent, density-aware rhythm
 * instead of ad-hoc per-element margins. Prefer this over hardcoded gaps:
 *   <View style={{ gap: SECTION_GAP }}>...sections...</View>
 */
export const SECTION_GAP: number = (() => {
  switch (MobileStyle.spacingDensity) {
    case 'compact': return Spacing.base;     // 16
    case 'spacious': return Spacing['2xl'];  // 32
    default: return Spacing.xl;              // 24
  }
})();

/**
 * Vertical gap (px) BETWEEN stacked items inside a single card/group (e.g. a
 * label above a value, or rows in a summary block). Density-aware sibling of
 * SECTION_GAP.
 */
export const CARD_GAP: number = (() => {
  switch (MobileStyle.spacingDensity) {
    case 'compact': return Spacing.sm;    // 8
    case 'spacious': return Spacing.base; // 16
    default: return Spacing.md;           // 12
  }
})();
