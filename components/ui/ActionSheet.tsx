import React, { useImperativeHandle, useRef, forwardRef } from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';

export type ActionSheetAction = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

export interface ActionSheetHandle {
  open: () => void;
  close: () => void;
}

export interface ActionSheetProps {
  title?: string;
  actions: ActionSheetAction[];
  onClose?: () => void;
}

/**
 * iOS-style action sheet backed by @gorhom/bottom-sheet. Use for context menus
 * that offer 2-5 actions on a tapped entity (Share / Duplicate / Delete /
 * Cancel). For single-confirmation flows, prefer a native Alert.alert.
 *
 * Usage (substitute YOUR entity name + id; this docblock is illustrative only):
 *   const sheet = useRef<ActionSheetHandle>(null);
 *   <ActionSheet ref={sheet} title="Actions" actions={[
 *     { label: 'Edit', icon: 'create-outline', onPress: handleEdit },
 *     { label: 'Delete', icon: 'trash-outline', destructive: true, onPress: handleDelete },
 *   ]} />
 *   <Button title="..." onPress={() => sheet.current?.open()} />
 *
 * NOTE: this docblock intentionally does NOT show a literal router.push with a
 * quoted path. Hardcoded example paths (e.g. "/post/123/edit") get picked up by the
 * route-normalizer as candidate app routes, which then warns about them not
 * existing in the route registry. Always derive the route from props/data.
 */
export const ActionSheet = forwardRef<ActionSheetHandle, ActionSheetProps>(
  ({ title, actions, onClose }, ref) => {
    const { colors, borderRadius } = useTheme();
    const bottomSheetRef = useRef<GorhomBottomSheet>(null);

    useImperativeHandle(ref, () => ({
      open: () => bottomSheetRef.current?.snapToIndex(0),
      close: () => bottomSheetRef.current?.close(),
    }));

    const snapPoint = Math.min(90, 25 + actions.length * 10) + '%';

    const renderBackdrop = (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
    );

    return (
      <GorhomBottomSheet
        ref={bottomSheetRef}
        snapPoints={[snapPoint]}
        index={-1}
        enablePanDownToClose
        onClose={onClose}
        backdropComponent={renderBackdrop}
        backgroundStyle={{
          backgroundColor: colors.cardBackground ?? colors.surface,
          borderTopLeftRadius: borderRadius.xl,
          borderTopRightRadius: borderRadius.xl,
        }}
        handleIndicatorStyle={{ backgroundColor: colors.separator ?? colors.border }}
      >
        <BottomSheetView style={styles.content}>
          {title ? (
            <Typography variant="headline" style={styles.title} align="center">{title}</Typography>
          ) : null}
          {actions.map((action, i) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => {
                Haptics.impactAsync(action.destructive ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium);
                bottomSheetRef.current?.close();
                // Defer the action slightly so the sheet close animation is visible
                setTimeout(() => action.onPress(), 150);
              }}
              style={({ pressed }) => [
                styles.action,
                {
                  backgroundColor: pressed ? (colors.groupedBackground ?? colors.surface) : 'transparent',
                  borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                  borderTopColor: colors.separator ?? colors.border,
                },
              ]}
            >
              {action.icon ? (
                <Ionicons
                  name={action.icon}
                  size={22}
                  color={action.destructive ? colors.error : colors.primary}
                />
              ) : null}
              <Typography
                variant="body"
                color={action.destructive ? colors.error : colors.text}
                style={styles.actionLabel}
              >
                {action.label}
              </Typography>
            </Pressable>
          ))}
        </BottomSheetView>
      </GorhomBottomSheet>
    );
  },
);
ActionSheet.displayName = 'ActionSheet';

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 24 },
  title: { paddingVertical: 12 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    minHeight: 50,
  },
  actionLabel: { fontWeight: '500' },
});