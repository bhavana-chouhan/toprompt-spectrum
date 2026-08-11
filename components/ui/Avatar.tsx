import React from 'react';
import { View, Text, StyleSheet, ViewStyle, ImageStyle, StyleProp } from 'react-native';
import { Image } from 'expo-image';

import { useTheme } from '@/hooks/useTheme';

/**
 * Canonical size tokens for Avatar. The LLM commonly emits string sizes
 * (`<Avatar size="xl" />`) borrowed from web/Tailwind conventions; the
 * previous API only accepted numeric pixel sizes, so a string size made
 * width/height NaN and the avatar collapsed to 0×0. Each token maps to
 * a tap-target-safe pixel size proportionate to typical mobile layouts.
 *
 * Confirmed blocker from the 2026-06 E2E review.
 */
const AVATAR_SIZE_TOKEN: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,    // canonical default
  lg: 56,
  xl: 80,    // profile-header / detail-header
  '2xl': 96,
  '3xl': 120,
};

export type AvatarSizeToken = keyof typeof AVATAR_SIZE_TOKEN;

export interface AvatarProps {
  uri?: string | null;
  name?: string;
  /**
   * Avatar size. Accepts:
   *   • A token string ('xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl')
   *     mapped to a canonical pixel size — preserves visual consistency
   *     across the app without each screen picking arbitrary pixel values.
   *   • A raw pixel number — for one-off sizes (rare).
   *
   * Omit to default to 'md' (40px).
   */
  size?: AvatarSizeToken | number;
  /**
   * Style override. Accepts ViewStyle (fallback initials surface) OR ImageStyle
   * (image variant) — same prop name for ergonomic call sites that don't know
   * which branch will render. Internally narrowed via cast at the leaf.
   */
  style?: StyleProp<ViewStyle | ImageStyle>;
}

function resolveAvatarSize(size: AvatarProps['size']): number {
  if (typeof size === 'number') return size;
  if (typeof size === 'string' && AVATAR_SIZE_TOKEN[size]) return AVATAR_SIZE_TOKEN[size];
  // Default token ('md' = 40px) — matches the prior numeric default.
  return AVATAR_SIZE_TOKEN.md;
}

export function Avatar({ uri, name, size, style }: AvatarProps) {
  const { colors } = useTheme();
  const px = resolveAvatarSize(size);
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[{ width: px, height: px, borderRadius: px / 2 }, style as StyleProp<ImageStyle>]}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        { backgroundColor: colors.primary },
        { width: px, height: px, borderRadius: px / 2 },
        style as StyleProp<ViewStyle>,
      ]}
    >
      <Text style={[styles.initials, { fontSize: px * 0.4, color: colors.textInverse }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initials: { fontWeight: '600' },
});