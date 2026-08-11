import React, { useRef } from 'react';
import { View, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';

export interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  /** Haptic warning on threshold (before release). Defaults true. */
  enableThresholdHaptic?: boolean;
  style?: ViewStyle;
}

/**
 * Wraps any list row with native iOS-style swipe-to-delete / swipe-to-archive
 * actions. Uses react-native-gesture-handler's Swipeable primitive.
 *
 * Usage:
 *   <SwipeableRow onDelete={() => deleteNote(item._id)}>
 *     <ListItem title={item.title} onPress={...} />
 *   </SwipeableRow>
 */
export function SwipeableRow({
  children,
  onDelete,
  onArchive,
  enableThresholdHaptic = true,
  style,
}: SwipeableRowProps) {
  const { colors } = useTheme();
  const haptedRef = useRef(false);

  const renderRightActions = () => {
    return (
      <View style={styles.rightActions}>
        {onArchive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Archive"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onArchive();
            }}
            style={[styles.action, { backgroundColor: colors.warning }]}
          >
            <Ionicons name="archive-outline" size={22} color="#fff" />
            <Typography variant="caption1" color="#fff">Archive</Typography>
          </Pressable>
        ) : null}
        {onDelete ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete"
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onDelete();
            }}
            style={[styles.action, { backgroundColor: colors.error }]}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
            <Typography variant="caption1" color="#fff">Delete</Typography>
          </Pressable>
        ) : null}
      </View>
    );
  };

  if (!onDelete && !onArchive) {
    return <View style={style}>{children}</View>;
  }

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      rightThreshold={40}
      onSwipeableWillOpen={() => {
        if (enableThresholdHaptic && !haptedRef.current) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          haptedRef.current = true;
        }
      }}
      onSwipeableClose={() => { haptedRef.current = false; }}
      containerStyle={style}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  rightActions: {
    flexDirection: 'row',
  },
  action: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
});