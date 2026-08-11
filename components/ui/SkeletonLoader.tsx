import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/spacing';

export interface SkeletonProps {
  width: number | string;
  height: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Animated shimmer placeholder for loading states.
 *
 * Uses a sliding gradient overlay (the iOS-native shimmer pattern used by
 * Linkedin, Apple Music, and Apple Notes) instead of opacity-only pulsing.
 * A solid base color (colors.border) shows underneath, and a brighter
 * gradient band slides across left-to-right on a continuous loop.
 *
 * Implementation:
 *   • Parent View has `overflow: 'hidden'` so the gradient is clipped to
 *     the rounded corners.
 *   • The gradient is positioned absolutely and fills the parent.
 *   • translateX animates from -SHIMMER_RANGE to +SHIMMER_RANGE in pixels
 *     (numeric values required for native-driver compatibility — string
 *     percentages don't work with useNativeDriver: true on all RN
 *     versions). 600px covers all common mobile widths (320–428pt).
 *   • The gradient itself has `transparent → highlight → transparent`
 *     stops so it appears as a band sweeping across, not a solid wash.
 */
const SHIMMER_RANGE = 600;        // half-width of the slide range in px
const SHIMMER_DURATION = 1400;    // single sweep, ms — matches iOS feel

export function Skeleton({ width, height, radius = BorderRadius.md, style }: SkeletonProps) {
  const { colors } = useTheme();
  const translate = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, { toValue: 1, duration: SHIMMER_DURATION, useNativeDriver: true }),
        // Reset instantly to -1 so the next iteration sweeps in the same
        // direction (left → right). Without this, the band would oscillate
        // back-and-forth, which doesn't match the iOS pattern.
        Animated.timing(translate, { toValue: -1, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [translate]);

  // The shimmer highlight color is the surface/card color (lighter than
  // the base border tint), giving a subtle bright band on a dimmer base.
  const highlightColor = colors.cardBackground ?? colors.background ?? '#ffffff';

  return (
    <View
      style={[
        { width: width as any, height, borderRadius: radius, backgroundColor: colors.border, overflow: 'hidden' },
        style,
      ]}
    >
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{
            translateX: translate.interpolate({
              inputRange: [-1, 1],
              outputRange: [-SHIMMER_RANGE, SHIMMER_RANGE],
            }),
          }],
        }}
      >
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, opacity: 0.55 }}
        />
      </Animated.View>
    </View>
  );
}

/** Card-shaped skeleton with image + text placeholders */
export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.card, style]}>
      <Skeleton width="100%" height={160} radius={BorderRadius.lg} />
      <View style={skeletonStyles.content}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  );
}

/** List-item-shaped skeleton */
export function SkeletonListItem({ style }: { style?: ViewStyle }) {
  return (
    <View style={[skeletonStyles.listItem, style]}>
      <Skeleton width={44} height={44} radius={22} />
      <View style={skeletonStyles.listContent}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="40%" height={10} />
      </View>
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  card: { gap: Spacing.sm },
  content: { gap: Spacing.sm, paddingHorizontal: Spacing.xs },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  listContent: { flex: 1, gap: Spacing.xs },
});