import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';

/**
 * Industry-signature icon resolver. Reads MobileStyle.referencePresetId +
 * a shipped fallback table so each generation gets an on-brand splash.
 *
 * Falls back to a neutral 'sparkles-outline' when neither preset nor
 * known industry matches — better than crashing on a missing icon name.
 */
const PRESET_ICON: Record<string, string> = {
  'cash-app': 'wallet-outline',
  'robinhood': 'trending-up-outline',
  'stripe-dashboard': 'analytics-outline',
  'revolut': 'card-outline',
  'strava': 'walk-outline',
  'peloton': 'bicycle-outline',
  'headspace': 'leaf-outline',
  'instagram': 'camera-outline',
  'tiktok': 'play-circle-outline',
  'spotify': 'musical-notes-outline',
  'youtube': 'play-circle-outline',
  'linear': 'flash-outline',
  'notion': 'document-text-outline',
  'airbnb': 'home-outline',
  'doordash': 'fast-food-outline',
};

function resolveSplashIcon(presetId?: string, fallback = 'sparkles-outline'): string {
  if (presetId && PRESET_ICON[presetId]) return PRESET_ICON[presetId];
  return fallback;
}

export interface AppSplashProps {
  /** App name shown below the icon. Required — empty falls back to "Welcome". */
  appName: string;
  /** Optional tagline below the app name. */
  tagline?: string;
  /** Reference-preset id (e.g. 'spotify') for icon resolution. */
  referencePresetId?: string;
  /** Override icon — only used when no preset matches. Defaults to 'sparkles-outline'. */
  fallbackIcon?: string;
  /** How long the splash stays before calling onComplete. Default 3000ms —
   *  long enough on a cold-start that the user clearly perceives the
   *  branded entrance, reads the app name + tagline, and feels a
   *  deliberate hand-off to the home screen. Shorter values made the
   *  splash flash by too quickly to register on faster devices. */
  duration?: number;
  /** Called once the splash animation has fully played out. */
  onComplete?: () => void;
}

export function AppSplash({
  appName,
  tagline,
  referencePresetId,
  fallbackIcon,
  duration = 3000,
  onComplete,
}: AppSplashProps) {
  const themeCtx = useTheme();
  // Defensive — if theme isn't mounted yet (rare cold-start race), fall back
  // to a high-contrast dark-on-bright palette so the splash is ALWAYS
  // visible. The brand colors win when theme is ready (the common path).
  const colors = themeCtx?.colors ?? {
    background: '#0F172A',  // slate-900
    primary: '#22C55E',     // emerald-500
    text: '#F8FAFC',        // slate-50
    textSecondary: '#94A3B8',
  };
  const iconName = resolveSplashIcon(referencePresetId, fallbackIcon);

  // Three layered animations:
  //   • iconScale  — pulses from 0.85 → 1.0 with bounce, settles
  //   • iconOpacity — fades in
  //   • textOpacity — fades in 200ms behind the icon for stagger
  //   • outerOpacity — fades out the entire splash before onComplete
  const iconScale = useRef(new Animated.Value(0.85)).current;
  const iconOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const outerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(iconScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    const fadeDelay = Math.max(0, duration - 350);
    const fadeTimer = setTimeout(() => {
      Animated.timing(outerOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && onComplete) onComplete();
      });
    }, fadeDelay);

    return () => clearTimeout(fadeTimer);
  }, [iconScale, iconOpacity, textOpacity, outerOpacity, duration, onComplete]);

  return (
    <Animated.View
      style={[
        styles.root,
        { backgroundColor: colors.background, opacity: outerOpacity },
      ]}
      pointerEvents="none"
    >
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.iconWrap,
            {
              backgroundColor: colors.primary,
              transform: [{ scale: iconScale }],
              opacity: iconOpacity,
            },
          ]}
        >
          <Ionicons name={iconName as any} size={56} color={colors.background ?? '#fff'} />
        </Animated.View>

        <Animated.View style={{ opacity: textOpacity, alignItems: 'center' }}>
          <Typography
            variant="largeTitle"
            color={colors.text}
            align="center"
            style={styles.title}
          >
            {appName || 'Welcome'}
          </Typography>
          {tagline ? (
            <Typography
              variant="subhead"
              color={colors.textSecondary}
              align="center"
              style={styles.tagline}
            >
              {tagline}
            </Typography>
          ) : null}
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconWrap: {
    width: 112,
    height: 112,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  title: {
    fontWeight: '700',
  },
  tagline: {
    marginTop: Spacing.sm,
    maxWidth: 320,
  },
});
