import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import GorhomBottomSheet, { BottomSheetBackdrop, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useTheme } from '@/hooks/useTheme';

export type BottomSheetSnap = 'peek' | 'half' | 'full' | string;

export interface BottomSheetProps {
  /** Ref from useRef to control .present()/.close(). */
  bottomSheetRef: React.RefObject<GorhomBottomSheet | null>;
  snapPoints?: BottomSheetSnap[];
  children: React.ReactNode;
  /** Show a grey backdrop behind the sheet. Defaults true. */
  withBackdrop?: boolean;
  onClose?: () => void;
  style?: ViewStyle;
}

const SNAP_PRESETS: Record<'peek' | 'half' | 'full', string> = {
  peek: '25%',
  half: '50%',
  full: '90%',
};

/**
 * Theme-aware wrapper around @gorhom/bottom-sheet. Accepts symbolic snap
 * points (`'peek' | 'half' | 'full'`) or explicit percent strings. Renders
 * a translucent backdrop by default so the bottom sheet feels like a native
 * iOS action-sheet / inspector rather than a pushed screen.
 *
 * Usage:
 *   const ref = useRef<GorhomBottomSheet>(null);
 *   <BottomSheet bottomSheetRef={ref} snapPoints={['half', 'full']}>
 *     <Typography variant="title2">Filters</Typography>
 *     ...
 *   </BottomSheet>
 *   // Open: ref.current?.snapToIndex(0)
 *   // Close: ref.current?.close()
 */
export function BottomSheet({
  bottomSheetRef,
  snapPoints = ['half'],
  children,
  withBackdrop = true,
  onClose,
  style,
}: BottomSheetProps) {
  const { colors, borderRadius } = useTheme();

  const resolvedSnapPoints = useMemo(
    () => snapPoints.map((s) => (s === 'peek' || s === 'half' || s === 'full' ? SNAP_PRESETS[s] : s)),
    [snapPoints],
  );

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) =>
      withBackdrop ? (
        <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.4} />
      ) : null,
    [withBackdrop],
  );

  return (
    <GorhomBottomSheet
      ref={bottomSheetRef}
      snapPoints={resolvedSnapPoints}
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
      <BottomSheetView style={[styles.content, style]}>{children}</BottomSheetView>
    </GorhomBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, padding: 16 },
});