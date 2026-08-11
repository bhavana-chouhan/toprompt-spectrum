import React from 'react';
import { View, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

/**
 * Canonical sizes are 'small' | 'large' (RN ActivityIndicator native names).
 * We ALSO accept the common LLM-emitted aliases 'sm' | 'md' | 'lg' from the
 * Button-style sizing scheme — without this, an LLM-emitted
 * <LoadingSpinner size="sm" /> would render as the default ('large') and
 * crash in TypeScript-strict callers.
 */
type LoadingSpinnerSize = 'small' | 'large' | 'sm' | 'md' | 'lg';

const SPINNER_SIZE_MAP: Record<string, 'small' | 'large'> = {
  small: 'small', large: 'large',
  sm: 'small', md: 'small', lg: 'large',
};

export interface LoadingSpinnerProps {
  size?: LoadingSpinnerSize;
  overlay?: boolean;
  style?: ViewStyle;
}

export function LoadingSpinner({ size: sizeProp = 'large', overlay = false, style }: LoadingSpinnerProps) {
  const { colors, spacing } = useTheme();
  const size: 'small' | 'large' = SPINNER_SIZE_MAP[sizeProp as string] || 'large';

  return (
    <View
      style={[
        styles.base,
        overlay ? [styles.overlay, { backgroundColor: colors.overlay }] : null,
        !overlay ? { padding: spacing.xl } : null,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
});