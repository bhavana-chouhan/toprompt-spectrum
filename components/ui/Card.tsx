import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Elevation, type ElevationTier } from '@/constants/elevation';
import { MobileStyle, CARD_RADIUS, SHADOW_TIER, PRESS_SCALE } from '@/constants/mobileStyle';

type CardElevationCanonical = ElevationTier;

const CARD_ELEVATION_ALIASES: Record<string, CardElevationCanonical> = {
  none: 'none', sm: 'sm', md: 'md', lg: 'lg', xl: 'xl',
  // Common LLM-emitted aliases — map to the closest canonical tier.
  flat: 'none', low: 'sm', medium: 'md', high: 'lg', highest: 'xl',
  small: 'sm', large: 'lg', // size-style names
};

// LLMs occasionally emit numeric elevation values (e.g., <Card elevation={2} />)
// borrowed from RN's android-only `elevation` style prop. Map them to the
// nearest canonical tier so the Card resolves correctly instead of falling
// back to 'md' silently.
const CARD_ELEVATION_NUMERIC_ALIASES: Record<number, CardElevationCanonical> = {
  0: 'none', 1: 'sm', 2: 'md', 3: 'lg', 4: 'xl',
};

export interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  /**
   * Style override. Accepts a single ViewStyle, an array of styles, or a
   * StyleSheet ID — same shape as RN's <View style>. The earlier
   * narrow ViewStyle-only typing rejected the LLM's common pattern of
   * passing an inline array (`style={[styles.card, { backgroundColor }]}`).
   */
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /**
   * Optional tap handler. When provided, the Card renders as a Pressable
   * instead of a View — with a subtle press-down scale animation + light
   * haptic feedback. This is the LLM's natural idiom for tappable list
   * rows (e.g. <Card onPress={() => router.push(`/item/${id}`)}>); the
   * earlier API silently dropped this prop and the cards became dead taps,
   * a confirmed blocker from the 2026-06 E2E review.
   *
   * Omit for static informational cards (no press feedback rendered).
   */
  onPress?: () => void;
  /**
   * Disables the press handler without dimming the card. Has no effect
   * unless onPress is also set.
   */
  pressDisabled?: boolean;
  /**
   * Override the elevation tier. When omitted, the project's MobileStyle
   * resolves the right shadow from `shadowLevel` — flat-design gets none,
   * saas-tech gets sm, modern-dark gets md, claymorphism gets lg, etc.
   * Pass an explicit tier when one specific card needs a different depth.
   *
   * Accepts canonical tiers ('none' | 'sm' | 'md' | 'lg' | 'xl'), common
   * string aliases ('flat' / 'low' / 'medium' / 'high' / 'highest'), and
   * numeric values 0-4 (the RN android `elevation` style convention).
   */
  elevation?: ElevationTier | 'flat' | 'low' | 'medium' | 'high' | 'highest' | 'small' | 'large' | number;
  /**
   * Override the surface treatment. When omitted, the project's MobileStyle
   * decides: 'elevated' (default solid + shadow), 'outlined' (1px border, no
   * shadow — flat-design feel), 'flat' (no border, no shadow — minimal), or
   * 'gradient' (LinearGradient bg from primary→accent — modern-dark / web3).
   */
  surface?: 'elevated' | 'outlined' | 'flat' | 'gradient' | boolean;
  /**
   * DC-7 alias. Sonnet emits <Card elevated> (boolean) about as often as the
   * documented surface="elevated". Before this alias existed the unknown
   * prop was silently dropped and bare surface (= boolean true) defeated the
   * surface switch entirely, so cards rendered FLAT and borderless in all four
   * audited apps regardless of the picked design direction. Accepting the
   * shape the model actually produces is cheaper and more reliable than
   * fighting it — same lesson as the onPress alias above.
   */
  elevated?: boolean;
  /** DC-7 alias for surface="outlined". */
  outlined?: boolean;
}

function resolveCardElevation(prop: CardProps['elevation']): CardElevationCanonical {
  if (typeof prop === 'number') {
    return CARD_ELEVATION_NUMERIC_ALIASES[prop] ?? 'md';
  }
  if (typeof prop === 'string') {
    return CARD_ELEVATION_ALIASES[prop] || 'md';
  }
  return SHADOW_TIER;
}

export function Card({
  children,
  title,
  subtitle,
  footer,
  style,
  padded = true,
  elevation: elevationProp,
  surface: surfaceProp,
  elevated: elevatedProp,
  outlined: outlinedProp,
  onPress,
  pressDisabled = false,
}: CardProps) {
  // Resolve elevation: explicit prop wins (string OR number alias), else
  // falls back to MobileStyle.shadowLevel.
  const elevation: CardElevationCanonical = resolveCardElevation(elevationProp);
  // Resolve surface treatment: explicit prop wins, else MobileStyle.cardStyle.
  // DC-7: coerce every shape the LLM emits into the canonical union BEFORE
  // the treatment switch. A bare surface prop arrives as boolean true;
  // elevated / outlined arrive as their own boolean props.
  const surface: 'elevated' | 'outlined' | 'flat' | 'gradient' =
    (typeof surfaceProp === 'string' ? surfaceProp : undefined) ??
    (surfaceProp === true || elevatedProp === true ? 'elevated' : undefined) ??
    (outlinedProp === true ? 'outlined' : undefined) ??
    MobileStyle.cardStyle;
  const { colors, spacing } = useTheme();

  // Per-surface treatment:
  //   • elevated → solid bg + shadow
  //   • outlined → solid bg + 1px border, NO shadow
  //   • flat     → solid bg, NO border, NO shadow
  //   • gradient → LinearGradient bg (primary→accent), NO shadow
  const isGradient = surface === 'gradient';
  const isOutlined = surface === 'outlined';
  const wantsShadow = surface === 'elevated';
  const gradientColors: [string, string] = [
    colors.primary,
    (colors as any).accent ?? colors.secondary ?? colors.primary,
  ];

  // Press handler: light haptic + call onPress. Defined unconditionally so
  // hooks don't conditionally run on subsequent renders.
  const handlePress = React.useCallback(() => {
    if (pressDisabled || !onPress) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  }, [onPress, pressDisabled]);

  // Shared inner content — rendered identically whether the outer is a View
  // or a Pressable. Extracted so the two render paths can't diverge.
  const innerContent = (
    <>
      {isGradient ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: CARD_RADIUS, opacity: 0.95 }]}
        />
      ) : null}
      {(title || subtitle) && (
        <View style={[styles.header, { paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.sm }]}>
          {title ? <Typography variant="headline">{title}</Typography> : null}
          {subtitle ? (
            <Typography variant="subhead" color={colors.textSecondary} style={styles.subtitle}>
              {subtitle}
            </Typography>
          ) : null}
        </View>
      )}
      <View style={padded ? [styles.body, { paddingHorizontal: spacing.base, paddingTop: (title || subtitle) ? 0 : spacing.base, paddingBottom: spacing.base }] : undefined}>{children}</View>
      {footer ? (
        <View
          style={[
            styles.footer,
            {
              paddingHorizontal: spacing.base,
              paddingVertical: spacing.md,
              borderTopColor: colors.separator ?? colors.border,
            },
          ]}
        >
          {footer}
        </View>
      ) : null}
    </>
  );

  const baseStyle = [
    styles.container,
    {
      backgroundColor: isGradient ? 'transparent' : (colors.cardBackground ?? colors.surface),
      borderRadius: CARD_RADIUS,
      borderWidth: isOutlined ? StyleSheet.hairlineWidth : 0,
      borderColor: isOutlined ? colors.border : 'transparent',
    },
    wantsShadow ? (Elevation[elevation] ?? Elevation.md) : null,
    style,
  ];

  // Pressable variant: when onPress is provided, render as a Pressable with
  // the canonical project press-down scale + haptic. The View variant is
  // unchanged from the previous version — guarantees no behavior drift for
  // static informational cards (the dominant case).
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={handlePress}
        disabled={pressDisabled}
        style={({ pressed }) => [
          baseStyle,
          pressed && !pressDisabled ? { transform: [{ scale: PRESS_SCALE }], opacity: 0.95 } : null,
        ]}
      >
        {innerContent}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{innerContent}</View>;
}

const styles = StyleSheet.create({
  container: {
    // No border by default — shadow (via Elevation) provides the hierarchy.
    // Flat web-style border + no shadow was making every card feel like a web card.
    overflow: 'hidden',
  },
  header: {},
  subtitle: { marginTop: 4 },
  body: {},
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});