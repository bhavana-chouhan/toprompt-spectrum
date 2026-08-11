/**
 * Centralized color palette for the entire app.
 * Generated from design scheme — edit these values to change the entire app theme.
 * All components using useTheme() will automatically reflect changes.
 */

export const LightColors = {
  // Brand
  primary: '#2563EB',
  primaryLight: '#6a95f1',
  primaryDark: '#1043b1',
  secondary: '#7C3AED',
  accent: '#F59E0B',

  // Backgrounds
  background: '#F0F4FF',
  surface: '#FFFFFF',
  card: '#F0F4FF',
  cardBackground: '#F0F4FF',
  groupedBackground: '#fafafa',   // iOS inset-grouped list bg (Settings-screen feel)

  // Text
  text: '#0F172A',
  textSecondary: '#687076',
  textMuted: '#90979d',
  textInverse: '#ffffff',

  // Borders & Dividers
  border: '#C7D2FE',
  divider: '#f0f3ff',
  separator: '#f0f3ff',                           // iOS semantic alias for hairline separator
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Status
  success: '#1daf5c',
  warning: '#db9824',
  error: '#db2a24',
  info: '#217bca',

  // Interactive
  link: '#217bca',
  inputBackground: '#e5ecff',
  inputBorder: '#afbffd',
  placeholder: '#90979d',

  // Navigation
  tint: '#2563EB',
  tabIconDefault: '#687076',
  tabIconSelected: '#2563EB',
  icon: '#687076',
};

export const DarkColors: typeof LightColors = {
  // Brand
  primary: '#5585ec',
  primaryLight: '#8cadf2',
  primaryDark: '#2764e7',
  secondary: '#9c6cef',
  accent: '#f4b13e',

  // Backgrounds
  background: '#151619',
  surface: '#1e2024',
  card: '#25272d',
  cardBackground: '#25272d',
  groupedBackground: '#151619',                 // iOS dark grouped list bg = pure black

  // Text
  text: '#ECEDEE',
  textSecondary: '#9BA1A6',
  textMuted: '#687076',
  textInverse: '#11181C',

  // Borders & Dividers
  border: '#32363e',
  divider: '#25272d',
  separator: '#25272d',                            // iOS semantic alias for hairline separator
  overlay: 'rgba(0, 0, 0, 0.7)',

  // Status
  success: '#28d774',
  warning: '#dfac53',
  error: '#df5753',
  info: '#4194dc',

  // Interactive
  link: '#4194dc',
  inputBackground: '#1e2024',
  inputBorder: '#393d46',
  placeholder: '#687076',

  // Navigation
  tint: '#ffffff',
  tabIconDefault: '#9BA1A6',
  tabIconSelected: '#ffffff',
  icon: '#9BA1A6',
};

export const Colors = {
  light: LightColors,
  dark: DarkColors,
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof LightColors;
