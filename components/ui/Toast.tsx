import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';

/**
 * Lightweight self-contained Toast surface (no native dep).
 *
 * The LLM never constructs toasts directly — it calls `showToast({ ... })`
 * from any screen, hook, or service. <ToastHost /> is mounted ONCE at the
 * app root (in `app/_layout.tsx`) and renders the Animated.View overlay.
 *
 *   import { showToast } from '@/components/ui/Toast';
 *   showToast({ type: 'error', title: 'Could not save', message: error.message });
 *
 * Use cases:
 *   • API errors (5xx, network failure) — `type: 'error'`
 *   • Mutation success confirmations  — `type: 'success'`
 *   • Non-blocking info               — `type: 'info'`
 *
 * For BLOCKING confirmations (delete-confirm, sign-out-confirm) prefer
 * Alert.alert. Toasts are transient feedback only.
 */

export type ToastType = 'success' | 'error' | 'info';

export interface ToastConfig {
  type?: ToastType;
  title: string;
  message?: string;
  /** Auto-dismiss delay in ms. Defaults: success/info=2500, error=4500. */
  durationMs?: number;
}

type Subscriber = (cfg: ToastConfig | null) => void;
let listeners: Subscriber[] = [];

/**
 * Show a toast. Safe to call from any layer (screen, store, service, hook).
 * The <ToastHost /> mounted at the app root receives the event and animates
 * the overlay in/out. If no host is mounted, the call is a no-op.
 */
export function showToast(cfg: ToastConfig): void {
  listeners.forEach((listener) => listener(cfg));
}

/** Imperatively dismiss the current toast. */
export function hideToast(): void {
  listeners.forEach((listener) => listener(null));
}

const ICON_MAP: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export function ToastHost() {
  const { colors, borderRadius, spacing } = useTheme();
  const [current, setCurrent] = useState<ToastConfig | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const listener: Subscriber = (cfg) => {
      if (dismissTimer.current) {
        clearTimeout(dismissTimer.current);
        dismissTimer.current = null;
      }

      if (!cfg) {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -24, duration: 180, useNativeDriver: true }),
        ]).start(() => setCurrent(null));
        return;
      }

      setCurrent(cfg);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();

      const duration = cfg.durationMs ?? (cfg.type === 'error' ? 4500 : 2500);
      dismissTimer.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
          Animated.timing(translateY, { toValue: -24, duration: 200, useNativeDriver: true }),
        ]).start(() => setCurrent(null));
      }, duration);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [opacity, translateY]);

  if (!current) return null;

  const tone = current.type ?? 'info';
  const accent =
    tone === 'success' ? colors.success ?? '#1FA365'
    : tone === 'error' ? colors.error ?? '#D6453B'
    : colors.primary;

  return (
    <SafeAreaView pointerEvents="box-none" style={styles.safeArea} edges={['top']}>
      <Animated.View
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          {
            opacity,
            transform: [{ translateY }],
            backgroundColor: colors.cardBackground ?? colors.surface,
            borderRadius: borderRadius.lg,
            borderColor: colors.separator ?? colors.border,
            shadowColor: '#000',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            marginHorizontal: spacing.md,
            marginTop: Platform.OS === 'android' ? spacing.sm : 0,
          },
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View style={styles.iconCol}>
          <Ionicons name={ICON_MAP[tone]} size={22} color={accent} />
        </View>
        <View style={styles.textCol}>
          <Typography variant="headline" numberOfLines={2}>{current.title}</Typography>
          {current.message ? (
            <Typography variant="footnote" color={colors.textSecondary} numberOfLines={3}>
              {current.message}
            </Typography>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          accessibilityHint="Dismisses this notification"
          onPress={hideToast}
          hitSlop={10}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
    minHeight: 64,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconCol: { paddingTop: 2 },
  textCol: { flex: 1, gap: 2 },
  closeBtn: { padding: 4, marginTop: 2 },
});