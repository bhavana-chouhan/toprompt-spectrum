import React from 'react';
import { Switch as RNSwitch, Platform, type SwitchProps as RNSwitchProps } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';

export interface SwitchProps extends Omit<RNSwitchProps, 'onValueChange' | 'trackColor' | 'thumbColor'> {
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** Suppress the selection haptic (default: fires on toggle). */
  silent?: boolean;
}

/**
 * Theme-aware wrapper around react-native Switch. Applies brand-tinted track
 * color and fires a selection haptic on change — the default RN Switch has
 * iOS green + no haptic, which reads as unstyled and unresponsive.
 */
export function Switch({ value, onValueChange, silent = false, ...props }: SwitchProps) {
  const { colors } = useTheme();
  return (
    <RNSwitch
      value={value}
      onValueChange={(next) => {
        if (!silent) Haptics.selectionAsync();
        onValueChange(next);
      }}
      trackColor={{ false: colors.separator ?? colors.border, true: colors.primary }}
      thumbColor={Platform.OS === 'android' ? (value ? colors.primaryLight ?? colors.background : '#f4f3f4') : undefined}
      ios_backgroundColor={colors.separator ?? colors.border}
      {...props}
    />
  );
}