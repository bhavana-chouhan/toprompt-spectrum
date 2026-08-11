import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTarget';

export interface SegmentedControlProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  style?: ViewStyle;
}

/**
 * iOS-style segmented control. Use for mutually-exclusive filters with 2-5
 * options (All / Mine / Shared, Day / Week / Month, etc.). NEVER emit a
 * web-style `<Pressable>Tab</Pressable>` row for this — it will not feel native.
 *
 * Triggers a selection haptic on change.
 */
export function SegmentedControl({ values, selectedIndex, onChange, style }: SegmentedControlProps) {
  const { colors, borderRadius } = useTheme();
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.groupedBackground ?? colors.surface,
          borderRadius: borderRadius.md,
        },
        style,
      ]}
    >
      {values.map((label, i) => {
        const selected = i === selectedIndex;
        return (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={label}
            onPress={() => {
              if (i !== selectedIndex) {
                Haptics.selectionAsync();
                onChange(i);
              }
            }}
            style={({ pressed }) => [
              styles.segment,
              {
                backgroundColor: selected ? (colors.cardBackground ?? colors.background) : 'transparent',
                borderRadius: borderRadius.md - 2,
                opacity: pressed && !selected ? 0.7 : 1,
              },
            ]}
          >
            <Typography
              variant="subhead"
              color={selected ? colors.text : colors.textSecondary}
              style={styles.label}
            >
              {label}
            </Typography>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 2,
    gap: 2,
  },
  segment: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  label: {
    fontWeight: '600',
  },
});