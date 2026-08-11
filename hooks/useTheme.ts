import { useContext } from 'react';

import { ThemeContext, type ThemeContextValue, useResolvedThemeValue } from '@/theme/ThemeContext';

/**
 * Access the resolved app theme.
 *
 * Works both with and without an explicit ThemeProvider so generated screen
 * code remains stable even if app/_layout.tsx stays minimal.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  const resolvedTheme = useResolvedThemeValue();
  return context ?? resolvedTheme;
}
