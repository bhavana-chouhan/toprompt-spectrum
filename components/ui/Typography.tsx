import React from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';

import { Typography as TypographyTokens, type TypographyVariant } from '@/constants/typography';
import { useTheme } from '@/hooks/useTheme';

/**
 * Color shorthand the LLM commonly emits in mobile-ui-generator recipes:
 *
 *   <Typography color="secondary">Sign in to continue</Typography>
 *   <Typography color="error">{error}</Typography>
 *
 * These are NOT valid CSS-color values — RN's <Text style={{color:...}}>
 * silently falls back to default on unrecognized strings, so the entire
 * visual hierarchy of the screen collapses to one color. Resolving the
 * keyword at render via the project's useTheme() restores the intended
 * semantic color while still accepting raw hex values for explicit overrides.
 *
 * Confirmed blocker from the 2026-06 E2E review.
 */
type TypographyColorKeyword =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'error'
  | 'success'
  | 'warning'
  | 'text'
  | 'textSecondary'
  | 'textInverse'
  | 'muted'
  | 'placeholder'
  | 'link';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  /**
   * Text color. Accepts EITHER:
   *   • A semantic-palette keyword ('secondary', 'error', 'primary', etc.) —
   *     resolved at render via useTheme().colors so the project's design
   *     scheme controls the actual hex.
   *   • A raw CSS color string ('#ff0000', 'rgba(0,0,0,0.5)', 'red') —
   *     passed through unchanged for explicit overrides.
   *
   * Omit to inherit colors.text from the active theme.
   */
  color?: TypographyColorKeyword | string;
  align?: 'left' | 'center' | 'right';
}

export function Typography({
  variant = 'body1',
  color,
  align,
  style,
  children,
  ...props
}: TypographyProps) {
  const { colors } = useTheme();
  const resolvedVariant = TypographyTokens[variant] || TypographyTokens.body1;

  // Resolve color keyword → theme color, OR pass raw CSS values through.
  // Heuristic: a string starting with '#', 'rgb', 'hsl' or matching the
  // RN named-color set is treated as a raw CSS color; anything else is
  // looked up in the theme palette. Unknown keywords fall back to
  // colors.text (safer than a default RN black/white).
  const resolveColor = (input: string | undefined): string => {
    if (!input) return colors.text;
    const looksLikeCss =
      input.startsWith('#') ||
      input.startsWith('rgb') ||
      input.startsWith('hsl') ||
      input.startsWith('transparent') ||
      // Common single-word RN named colors that should NOT be treated as
      // semantic keywords (the screen is asking for the actual CSS color).
      input === 'black' || input === 'white' || input === 'red' ||
      input === 'blue' || input === 'green' || input === 'gray' || input === 'grey';
    if (looksLikeCss) return input;

    // Semantic keyword lookup. Theme palette wins; otherwise fall back to text.
    const palette = colors as Record<string, string | undefined>;
    if (palette[input]) return palette[input] as string;
    // Common aliases that don't exactly match palette keys.
    if (input === 'muted') return palette.textSecondary ?? colors.text;
    if (input === 'link') return palette.primary ?? colors.text;
    return colors.text;
  };
  const resolvedColor = resolveColor(color);

  return (
    <Text
      style={[
        resolvedVariant as TextStyle,
        { color: resolvedColor },
        align ? { textAlign: align } : null,
        style,
      ]}
      {...props}
    >
      {children}
    </Text>
  );
}