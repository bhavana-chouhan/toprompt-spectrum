import { FontFamily } from '@/constants/fonts';

/**
 * Maps FontFamily + weight to the exact loaded font name.
 * expo-font-assets loads fonts as "Family-Weight" (e.g. "Montserrat-Bold").
 * This helper constructs the correct fontFamily string for React Native.
 */
function withWeight(family: string, weight: 'Regular' | 'Medium' | 'SemiBold' | 'Bold'): string {
  return family + '-' + weight;
}

/**
 * Typography scale — GENERATED per app from the picked design direction
 * (typeContrast: 'moderate'). Display tiers carry the app's type
 * identity; body tiers are fixed for readability. Calibrated against Apple
 * HIG with Material 3 heuristics. Legacy h1–h6 aliases map to the closest
 * HIG tier.
 */
export const Typography = {
  // iOS HIG scale (preferred)
  largeTitle: { fontSize: 34, lineHeight: 41, letterSpacing: 0.37, fontFamily: withWeight(FontFamily.heading, 'Bold') },
  title1:     { fontSize: 28, lineHeight: 34, letterSpacing: 0.36, fontFamily: withWeight(FontFamily.heading, 'Bold') },
  title2:     { fontSize: 22, lineHeight: 28, letterSpacing: 0.35, fontFamily: withWeight(FontFamily.heading, 'Bold') },
  title3:     { fontSize: 20, lineHeight: 25, letterSpacing: 0.38, fontFamily: withWeight(FontFamily.heading, 'SemiBold') },
  headline:   { fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontFamily: withWeight(FontFamily.body, 'SemiBold') },
  body:       { fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontFamily: withWeight(FontFamily.body, 'Regular') },
  callout:    { fontSize: 16, lineHeight: 21, letterSpacing: -0.32, fontFamily: withWeight(FontFamily.body, 'Regular') },
  subhead:    { fontSize: 15, lineHeight: 20, letterSpacing: -0.24, fontFamily: withWeight(FontFamily.body, 'Regular') },
  footnote:   { fontSize: 13, lineHeight: 18, letterSpacing: -0.08, fontFamily: withWeight(FontFamily.body, 'Regular') },
  caption1:   { fontSize: 12, lineHeight: 16, letterSpacing: 0,     fontFamily: withWeight(FontFamily.body, 'Regular') },
  caption2:   { fontSize: 11, lineHeight: 13, letterSpacing: 0.07,  fontFamily: withWeight(FontFamily.body, 'Regular') },

  // Legacy aliases — map to nearest HIG tier (kept for backwards compat)
  h1: { fontSize: 34, lineHeight: 41, letterSpacing: 0.37, fontFamily: withWeight(FontFamily.heading, 'Bold') },
  h2: { fontSize: 28, lineHeight: 34, letterSpacing: 0.36, fontFamily: withWeight(FontFamily.heading, 'Bold') },
  h3: { fontSize: 22, lineHeight: 28, letterSpacing: 0.35, fontFamily: withWeight(FontFamily.heading, 'Bold') },
  h4: { fontSize: 20, lineHeight: 25, letterSpacing: 0.38, fontFamily: withWeight(FontFamily.heading, 'SemiBold') },
  h5: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontFamily: withWeight(FontFamily.body, 'SemiBold') },
  h6: { fontSize: 16, lineHeight: 21, letterSpacing: -0.32, fontFamily: withWeight(FontFamily.body, 'SemiBold') },
  subtitle1: { fontSize: 16, lineHeight: 22, fontFamily: withWeight(FontFamily.body, 'Medium') },
  subtitle2: { fontSize: 15, lineHeight: 20, fontFamily: withWeight(FontFamily.body, 'Medium') },
  body1: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontFamily: withWeight(FontFamily.body, 'Regular') },
  body2: { fontSize: 15, lineHeight: 20, letterSpacing: -0.24, fontFamily: withWeight(FontFamily.body, 'Regular') },
  caption: { fontSize: 12, lineHeight: 16, fontFamily: withWeight(FontFamily.body, 'Regular') },
  overline: { fontSize: 11, lineHeight: 13, fontFamily: withWeight(FontFamily.body, 'Medium'), letterSpacing: 0.8 },
  button: { fontSize: 17, lineHeight: 22, letterSpacing: -0.41, fontFamily: withWeight(FontFamily.body, 'SemiBold') },
  label: { fontSize: 13, lineHeight: 18, letterSpacing: -0.08, fontFamily: withWeight(FontFamily.body, 'Medium') },
} as const;

export type TypographyVariant = keyof typeof Typography;
