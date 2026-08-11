import 'react-native-gesture-handler';
// Auto-injected by toPrompt — forwards JS runtime errors to Metro stdout
// (and from there to CloudWatch) so the server-side error-detector can
// classify them and surface them in the chat thread. Import order matters:
// gesture-handler must come first per RN docs; the bridge runs as soon as
// the JS engine has booted so it can intercept errors thrown during
// subsequent module init (font load, splash, auth hydration, etc.). The
// bridge file itself is emitted by the deterministic component-library
// node (apps/agent-server/src/workflows/shared/mobile-error-bridge.ts).
import './_toprompt_error_bridge';

import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { useFonts } from 'expo-font';
import { allFonts } from 'expo-font-assets';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useTheme } from '@/hooks/useTheme';
import { queryClient } from '@/services/queryClient';
import { ThemeProvider } from '@/theme';
import { getCurrentUser } from '@/services/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { HOME_ROUTE, AUTH_ROUTE } from '@/constants/navigation';
import { ToastHost } from '@/components/ui/Toast';
import { AppSplash } from '@/components/ui/AppSplash';
import { APP_NAME, APP_TAGLINE, REFERENCE_PRESET_ID } from '@/constants/appBranding';

// Hide the native (static PNG) splash immediately. We replace it with the
// in-JS <AppSplash /> below — that component renders the dynamic, branded
// splash (gradient, app name, tagline, animated logo) and stays visible
// until splashDone gates true. Keeping the native splash up while the JS
// splash mounts causes a flash where users see PNG → JS splash → home.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Minimum time the in-JS splash is shown — even if fonts + auth resolve
// in <300ms (Phase 1 has no network round-trip), the splash sticks around
// so users always see the brand reveal. Tuned to 2.5s after several rounds
// of UX feedback that "splash never shows".
const SPLASH_MIN_MS = 2500;

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { isDark } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  const status = useAuthStore((s) => s.status);
  const setAuth = useAuthStore((s) => s.setAuth);
  const markUnauthenticated = useAuthStore((s) => s.markUnauthenticated);

  // splashMinReached → SPLASH_MIN_MS elapsed since mount.
  // splashDone       → splashMinReached AND fonts loaded AND auth hydrated.
  // Until splashDone is true we render <AppSplash /> instead of <Stack />,
  // and we DO NOT run the auth-redirect effect — otherwise the redirect
  // fires immediately when status flips to 'unauthenticated' and the
  // splash never gets a chance to paint.
  const [splashMinReached, setSplashMinReached] = useState(false);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSplashMinReached(true), SPLASH_MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // 1. Hydrate auth once on mount. getCurrentUser() handles both phases:
  //    - Phase 1 (mock): returns the cached user from expo-secure-store, or null.
  //    - Phase 2 (rewired): calls apiGet('/api/user/profile') with the bearer token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const user = await getCurrentUser();
        if (cancelled) return;
        if (user) setAuth(user);
        else markUnauthenticated();
      } catch {
        if (!cancelled) markUnauthenticated();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setAuth, markUnauthenticated]);

  // 2. Once all three gates are true, hide the native splash (no-op if
  //    already hidden) and flip splashDone — that re-renders the Stack
  //    and unblocks the auth-redirect effect below.
  useEffect(() => {
    if (fontsLoaded && status !== 'loading' && splashMinReached && !splashDone) {
      SplashScreen.hideAsync().catch(() => {});
      setSplashDone(true);
    }
  }, [fontsLoaded, status, splashMinReached, splashDone]);

  // 3. Watch auth status + current route segment. Redirect whenever the user
  //    is in the "wrong" group for their status. Gated on splashDone so the
  //    splash is guaranteed to render first. This effect owns auth
  //    navigation — auth screens MUST NOT call router.replace manually;
  //    setAuth from services/auth.ts flips status and this effect redirects.
  //    HOME_ROUTE is generated per-project based on navigationPattern so
  //    drawer + stack-only apps work too (not just tabs).
  useEffect(() => {
    if (!splashDone) return;
    if (status === 'loading') return;
    const group = segments[0];
    const inAuthGroup = group === '(auth)';
    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace(AUTH_ROUTE);
    } else if (status === 'authenticated' && inAuthGroup) {
      router.replace(HOME_ROUTE);
    }
  }, [splashDone, status, segments, router]);

  if (!splashDone) {
    return (
      <AppSplash
        appName={APP_NAME}
        tagline={APP_TAGLINE}
        referencePresetId={REFERENCE_PRESET_ID}
      />
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  // Load all 7 design-system fonts (Montserrat, Poppins, Urbanist, Roboto,
  // Raleway, Bitter, Moderustic — each in 4 weights). expo-font-assets
  // ships these as a single `allFonts` map keyed by 'Family-Weight' which
  // matches what constants/typography.ts emits via withWeight() helper.
  // If a font fails to load (network blip, rare), useFonts returns
  // [false, error] — we still render with a system fallback so the app
  // never bricks on a font miss.
  const [fontsLoaded, fontError] = useFonts(allFonts);
  if (fontError) {
    // Don't block rendering on font load failure; log + continue with system.
    // eslint-disable-next-line no-console
    console.warn('[fonts] Failed to load expo-font-assets:', fontError);
  }
  const fontsReady = fontsLoaded || Boolean(fontError);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider>
              <ErrorBoundary>
                <RootNavigator fontsLoaded={fontsReady} />
                {/* Singleton Toast host — renders the overlay when any layer */}
                {/* (screen / hook / service) calls showToast(...). Mount once. */}
                <ToastHost />
              </ErrorBoundary>
            </ThemeProvider>
          </QueryClientProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
