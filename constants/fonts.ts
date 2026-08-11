import { Platform } from 'react-native';

/**
 * Font families loaded by expo-font-assets in app/_layout.tsx.
 * Style: Clean Flat (flat-design)
 *
 * Font weight mapping:
 *   FontWeight.regular → 'Roboto-Regular'
 *   FontWeight.medium  → 'Roboto-Medium'
 *   FontWeight.semibold → 'Roboto-SemiBold'
 *   FontWeight.bold    → 'Roboto-Bold'
 */
export const FontFamily = {
  heading: 'Roboto',
  body: 'Roboto',
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) ?? 'monospace',
} as const;

export const FontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;
