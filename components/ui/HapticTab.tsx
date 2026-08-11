import React from 'react';
import { Pressable, type PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

export interface HapticTabProps extends PressableProps {
  children?: React.ReactNode;
}

/**
 * Tab-bar button wrapper with haptic feedback.
 * Provides a subtle tap vibration when switching tabs.
 */
export function HapticTab({ children, onPress, ...props }: HapticTabProps) {
  return (
    <Pressable
      onPress={(e) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(e);
      }}
      {...props}
    >
      {children}
    </Pressable>
  );
}