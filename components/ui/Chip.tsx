import React from 'react';
import { Pressable, View, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';

export interface ChipProps {
  label: string;
  /** selected = filled pill (primary color). unselected = outlined. */
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  // P5 — accept an Ionicon NAME or a ready-made element; normalized at render.
  icon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  variant?: 'filter' | 'tag';
  style?: ViewStyle;
}

/**
 * iOS / Material chip. Use for:
 *   - filter chips (variant='filter', selectable) — horizontal scrolling row
 *     of filter pills above a list.
 *   - tag chips  (variant='tag', non-interactive or with onRemove) — metadata
 *     attached to an entity (e.g. labels on a note).
 *
 * Do NOT use a Badge for filter affordances — Badges are non-interactive
 * status indicators; Chips are tappable.
 */
export function Chip({
  label,
  selected = false,
  onPress,
  onRemove,
  icon,
  variant = 'filter',
  style,
}: ChipProps) {
  const { colors, borderRadius } = useTheme();

  const baseStyle = [
    styles.chip,
    {
      borderRadius: borderRadius.full,
      backgroundColor: selected ? colors.primary : 'transparent',
      borderColor: selected ? colors.primary : (colors.separator ?? colors.border),
    },
    style,
  ];

  const labelColor = selected ? colors.textInverse : colors.text;

  const inner = (
    <>
      {icon ? (typeof icon === 'string' ? <Ionicons name={icon} size={14} color={labelColor} /> : icon) : null}
      <Typography variant="footnote" color={labelColor} style={styles.label}>
        {label}
      </Typography>
      {onRemove && variant === 'tag' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={'Remove ' + label}
          onPress={() => { Haptics.selectionAsync(); onRemove(); }}
          hitSlop={6}
        >
          <Ionicons name="close" size={14} color={labelColor} />
        </Pressable>
      ) : null}
    </>
  );

  if (!onPress) return <View style={baseStyle}>{inner}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [...baseStyle, pressed && styles.pressed]}
    >
      {inner}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 32,
  },
  label: { fontWeight: '500' },
  pressed: { opacity: 0.7 },
});