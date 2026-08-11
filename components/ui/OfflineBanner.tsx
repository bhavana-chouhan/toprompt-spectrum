import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/hooks/useTheme';

/**
 * Slim "You're offline" banner. Mount once at the root layout — it overlays
 * every screen via absolute positioning so individual screens never need to
 * import it.
 *
 * Behavior:
 *   • Hidden when isConnected === true (initial state).
 *   • Slides in over ~180ms when isConnected flips to false.
 *   • Slides out on reconnect with the same timing.
 *   • Tap-through (pointerEvents='none') so it never blocks touches below.
 *
 * Visual rhythm matches iOS banner conventions: dark surface + bright text
 * + small icon + safe-area-aware top inset.
 */
export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const { colors, spacing } = useTheme();
  const slide = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: isConnected ? -80 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isConnected, slide]);

  if (isConnected) {
    return null;
  }

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        {
          backgroundColor: colors.error,
          paddingTop: insets.top + 6,
          paddingHorizontal: spacing.md,
          transform: [{ translateY: slide }],
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={16} color={colors.textInverse} />
        <Typography variant="footnote" color={colors.textInverse} style={styles.label}>
          You're offline
        </Typography>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingBottom: 8,
    zIndex: 9999,
    ...(Platform.OS === 'android' ? { elevation: 8 } : {}),
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  label: { marginLeft: 6, fontWeight: '600' },
});