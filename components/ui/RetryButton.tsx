import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

export interface RetryButtonProps {
  onPress: () => void;
  label?: string;
  /** Disable the button while a retry is already in flight. */
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

/**
 * Canonical "Try again" button.
 *
 * Used by ErrorState, OfflineBanner, and screen-level empty states whenever
 * a fetch fails. Always renders as secondary + sm so it never visually
 * competes with the screen's primary CTA — error recovery is recoverable,
 * not aspirational. Includes a refresh icon so the affordance is recognized
 * even when label localization is missing.
 *
 * Phase 1 (mock data): callers wire onPress to re-run the mock loader.
 * Phase 2 (real API): callers wire onPress to the matching query's
 *   refetch() (TanStack Query) or the manual fetch retry helper.
 */
export function RetryButton({ onPress, label = 'Try again', loading = false, disabled = false, style }: RetryButtonProps) {
  const { colors, spacing } = useTheme();
  return (
    <View style={[styles.wrap, { gap: spacing.xs }, style]}>
      <Ionicons name="refresh" size={16} color={colors.text} />
      <Button title={label} onPress={onPress} variant="secondary" size="sm" loading={loading} disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
});