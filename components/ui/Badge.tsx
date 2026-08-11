import React from 'react';
import { View, StyleSheet } from 'react-native';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';

type BadgeSizeCanonical = 'sm' | 'md';
type BadgeVariantCanonical = 'default' | 'success' | 'warning' | 'error' | 'info';

const BADGE_SIZE_ALIASES: Record<string, BadgeSizeCanonical> = {
  sm: 'sm', md: 'md', s: 'sm', m: 'md',
  small: 'sm', medium: 'md', large: 'md', // 'large' → md (closest valid; better than crash)
};
const BADGE_VARIANT_ALIASES: Record<string, BadgeVariantCanonical> = {
  default: 'default', success: 'success', warning: 'warning', error: 'error', info: 'info',
  danger: 'error', destructive: 'error', // common LLM aliases
  primary: 'info', secondary: 'default',
};

export interface BadgeProps {
  label: string;
  variant?: BadgeVariantCanonical | 'danger' | 'destructive' | 'primary' | 'secondary';
  size?: BadgeSizeCanonical | 'small' | 'medium' | 'large' | 's' | 'm';
}

export function Badge({ label, variant: variantProp = 'default', size: sizeProp = 'sm' }: BadgeProps) {
  const variant: BadgeVariantCanonical = BADGE_VARIANT_ALIASES[variantProp as string] || 'default';
  const size: BadgeSizeCanonical = BADGE_SIZE_ALIASES[sizeProp as string] || 'sm';
  const { colors, borderRadius } = useTheme();
  const palette = {
    default: { bg: colors.surface, text: colors.text },
    success: { bg: colors.success, text: colors.textInverse },
    warning: { bg: colors.warning, text: colors.textInverse },
    error: { bg: colors.error, text: colors.textInverse },
    info: { bg: colors.primary, text: colors.textInverse },
  }[variant];
  return (
    <View
      style={[
        styles.base,
        size === 'md' && styles.md,
        { backgroundColor: palette.bg, borderRadius: borderRadius.full },
      ]}
    >
      <Typography variant="caption" color={palette.text} style={[styles.text, size === 'md' && styles.mdText]}>
        {label}
      </Typography>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9999, alignSelf: 'flex-start' },
  md: { paddingHorizontal: 12, paddingVertical: 4 },
  text: { textTransform: 'uppercase', letterSpacing: 0.3 },
  mdText: { fontSize: 12 },
});