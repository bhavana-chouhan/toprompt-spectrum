import React, { createContext, useMemo } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { Colors, type ThemeColors } from '@/constants/Colors';
import { FontFamily, FontWeight } from '@/constants/fonts';
import { BorderRadius, SCREEN_PADDING, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { useAppStore } from '@/store/useAppStore';

export interface ThemeContextValue {
  colors: ThemeColors;
  fonts: typeof FontFamily;
  fontWeight: typeof FontWeight;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  screenPadding: number;
  typography: typeof Typography;
  isDark: boolean;
  colorScheme: 'light' | 'dark';
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;
}

export function useResolvedThemeValue(): ThemeContextValue {
  const systemScheme = useSystemColorScheme();
  const { colorScheme: userPreference, setColorScheme } = useAppStore();

  const resolvedScheme: 'light' | 'dark' =
    userPreference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : userPreference;

  return useMemo(
    () => ({
      colors: Colors[resolvedScheme],
      fonts: FontFamily,
      fontWeight: FontWeight,
      spacing: Spacing,
      borderRadius: BorderRadius,
      screenPadding: SCREEN_PADDING,
      typography: Typography,
      isDark: resolvedScheme === 'dark',
      colorScheme: resolvedScheme,
      setColorScheme,
    }),
    [resolvedScheme, setColorScheme],
  );
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const value = useResolvedThemeValue();
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
