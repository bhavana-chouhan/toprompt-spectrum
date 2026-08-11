import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type TextStyle, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTarget';
import { BUTTON_RADIUS, MobileStyle, PRESS_SCALE } from '@/constants/mobileStyle';

/**
 * Canonical sizes are 'sm' | 'md' | 'lg'. We ALSO accept the common LLM-emitted
 * aliases 'small' | 'medium' | 'large' (typed as 'string' for compatibility with
 * loose JSX consumers; resolved via SIZE_ALIAS_MAP at runtime). Any unknown
 * string falls back to 'md' rather than crashing on `sizeConfig` lookup.
 */
type ButtonSizeCanonical = 'sm' | 'md' | 'lg';
type ButtonSize = ButtonSizeCanonical | 'small' | 'medium' | 'large';

const SIZE_ALIAS_MAP: Record<string, ButtonSizeCanonical> = {
  sm: 'sm', md: 'md', lg: 'lg',
  small: 'sm', medium: 'md', large: 'lg',
  // Defensive: also accept HIG-style names
  s: 'sm', m: 'md', l: 'lg',
};

type ButtonVariantCanonical = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
type ButtonVariant = ButtonVariantCanonical | 'destructive' | 'tertiary' | 'gradient-primary';

const VARIANT_ALIAS_MAP: Record<string, ButtonVariantCanonical> = {
  primary: 'primary', secondary: 'secondary', outline: 'outline', ghost: 'ghost', danger: 'danger', gradient: 'gradient',
  destructive: 'danger',  // common HIG name
  tertiary: 'ghost',       // common alias
  'gradient-primary': 'gradient',  // alias
};

export interface ButtonProps {
  /**
   * Button label text. THREE prop-name aliases are accepted; whichever the
   * LLM emits, the button renders correctly:
   *   • title    — canonical (RN convention)
   *   • label    — common LLM alias (web-style)
   *   • children — natural JSX idiom: <Button onPress={...}>Save</Button>
   *
   * Internally the children-as-string case is coerced to title at the top
   * of the function body. Without this triple-alias, an LLM-emitted
   * <Button>Save</Button> would render with EMPTY text (the component
   * would silently drop the children) — a confirmed blocker from the
   * 2026-06 E2E review.
   */
  title?: string;
  label?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  /** Override haptic intensity. Defaults: primary/secondary=Medium, outline/ghost=Light, danger=Warning. */
  haptic?: 'none' | 'light' | 'medium' | 'heavy' | 'success' | 'warning';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function Button({
  title,
  label,
  children,
  onPress,
  variant: variantProp = 'primary',
  size: sizeProp = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  haptic,
  style,
  textStyle,
}: ButtonProps) {
  // Accept "title" OR "label" OR "children" — whichever the LLM emits, render
  // it as the button label. The children-as-string case is the most natural
  // JSX idiom (<Button>Save</Button>); we coerce string/number children to
  // text. JSX-element children (<Button><Icon/></Button>) flow through as the
  // text source — extremely rare in mobile-ui-generator output, and the
  // String(children) coercion gives a readable accessibilityLabel even then.
  const childrenAsString =
    typeof children === 'string' || typeof children === 'number'
      ? String(children)
      : '';
  const buttonText: string = title ?? label ?? childrenAsString;
  // Resolve aliases (e.g. 'small' → 'sm', 'destructive' → 'danger') and fall
  // back to safe defaults for unknown values. Without this, an LLM-emitted
  // size='small' would yield sizeConfig=undefined and crash the entire screen.
  const size: ButtonSizeCanonical = SIZE_ALIAS_MAP[sizeProp as string] || 'md';
  let variant: ButtonVariantCanonical = VARIANT_ALIAS_MAP[variantProp as string] || 'primary';

  // Per-project style upgrade: when the resolved MobileStyle picks a
  // gradient-leaning aesthetic (modern-dark, web3, cyberpunk), promote a
  // bare 'primary' button to 'gradient' so the project's primary CTA gets
  // the on-brand gradient treatment by default. Explicit variant props at
  // call sites still win — this only affects unspecified primaries.
  if (variant === 'primary' && MobileStyle.cardStyle === 'gradient' && variantProp === 'primary') {
    variant = 'gradient';
  }

  const isDisabled = disabled || loading;
  const { colors, typography } = useTheme();
  const palette = {
    primary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      textColor: colors.textInverse,
    },
    secondary: {
      backgroundColor: colors.secondary,
      borderColor: colors.secondary,
      textColor: colors.textInverse,
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: colors.border,
      textColor: colors.text,
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      textColor: colors.primary,
    },
    danger: {
      backgroundColor: colors.error,
      borderColor: colors.error,
      textColor: colors.textInverse,
    },
    gradient: {
      // Background not used directly — LinearGradient renders behind text.
      // Keep a fallback color for the rare case the gradient component fails.
      backgroundColor: colors.primary,
      borderColor: 'transparent',
      textColor: colors.textInverse,
    },
  }[variant];

  // iOS HIG: all buttons meet 44pt minimum touch target.
  // Horizontal padding scales with size; vertical padding is derived so
  // minHeight always holds.
  const sizeConfig = {
    sm: { paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, lineHeight: 20, minHeight: MIN_TOUCH_TARGET },
    md: { paddingHorizontal: 20, paddingVertical: 12, fontSize: 17, lineHeight: 22, minHeight: MIN_TOUCH_TARGET },
    lg: { paddingHorizontal: 24, paddingVertical: 14, fontSize: 17, lineHeight: 22, minHeight: 50 },
  }[size];

  const defaultHaptic: NonNullable<ButtonProps['haptic']> = (() => {
    if (variant === 'primary' || variant === 'secondary') return 'medium';
    if (variant === 'danger') return 'warning';
    return 'light';
  })();
  const effectiveHaptic = haptic ?? defaultHaptic;

  const handlePress = () => {
    switch (effectiveHaptic) {
      case 'none': break;
      case 'light': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); break;
      case 'medium': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); break;
      case 'heavy': Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); break;
      case 'success': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); break;
      case 'warning': Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); break;
    }
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityLabel={buttonText}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: BUTTON_RADIUS,
          // For gradient variant, backgroundColor is transparent so the
          // LinearGradient absoluteFill underneath shows through. For all
          // other variants, the solid color paints the surface.
          backgroundColor: variant === 'gradient' ? 'transparent' : palette.backgroundColor,
          borderColor: palette.borderColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingHorizontal: sizeConfig.paddingHorizontal,
          paddingVertical: sizeConfig.paddingVertical,
          minHeight: sizeConfig.minHeight,
          // overflow:hidden clips the LinearGradient absoluteFill to the
          // borderRadius — without it, the gradient paints outside the
          // rounded corners on Android.
          overflow: 'hidden',
        },
        pressed && !isDisabled && { opacity: 0.85, transform: [{ scale: PRESS_SCALE }] },
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {variant === 'gradient' ? (
        <LinearGradient
          colors={[colors.primary, (colors as any).accent ?? colors.secondary ?? colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: BUTTON_RADIUS },
          ]}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator size="small" color={palette.textColor} />
      ) : (
        <Typography
          variant="button"
          color={palette.textColor}
          style={[
            styles.text,
            typography.button,
            { fontSize: sizeConfig.fontSize, lineHeight: sizeConfig.lineHeight },
            textStyle,
          ]}
        >
          {buttonText}
        </Typography>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  // Native press: slight opacity + subtle scale (iOS-feel). Android users still
  // get the opacity dip; overlay ripple is left to future work to keep this
  // primitive dependency-free.
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  disabled: { opacity: 0.5 },
  fullWidth: { width: '100%' },
  text: { textAlign: 'center' },
});