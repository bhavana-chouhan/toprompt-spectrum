import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, View, TextInput, StyleSheet, type TextInputProps, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { MIN_TOUCH_TARGET } from '@/constants/touchTarget';
import { MobileStyle, BUTTON_RADIUS } from '@/constants/mobileStyle';

/**
 * Canonical visual variants are 'filled' | 'outlined'. We ALSO accept
 * 'underline' (common LLM-emitted alias from web-style designs) and resolve
 * it to 'outlined'. Without this, a generated screen passing variant="underline"
 * would crash the SWC type-check or render as the default — both bad outcomes.
 */
type InputVariantCanonical = 'filled' | 'outlined';
type InputVariant = InputVariantCanonical | 'underline';

const INPUT_VARIANT_ALIAS_MAP: Record<string, InputVariantCanonical> = {
  filled: 'filled', outlined: 'outlined',
  underline: 'outlined',
};

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  /**
   * Hint text rendered below the input when there is no error. Common
   * LLM-emitted prop name — kept on the contract so screens like form-edit
   * can surface field-level guidance ("Min 8 characters", etc.) without
   * crashing on a "prop does not exist" type error.
   */
  helperText?: string;
  containerStyle?: ViewStyle;
  /**
   * Leading icon. Accepts either an Ionicons name string (the LLM's natural
   * idiom, e.g. icon="document-text-outline") or a React element. String
   * names are coerced into <Ionicons .../> at render — see the render block
   * below. Matches the union ListItem / EmptyState / Chip already use in
   * this same file, so every iconified primitive shares one contract.
   *
   * Without this union, the LLM's bare-string idiom would render as
   * <View>{"document-text-outline"}</View> — exactly the JSX shape React
   * Native flags with "Text strings must be rendered within a <Text>
   * component". The coercion eliminates that warning class generically.
   */
  icon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  /**
   * Override the visual variant. When omitted, defaults to the project's
   * MobileStyle.inputStyle resolved from the design scheme — so 'flat-design'
   * projects get outlined inputs and 'modern-dark' projects get filled inputs
   * automatically. Pass an explicit value at call sites where a single
   * screen needs the opposite style (e.g. an outlined search input on an
   * otherwise-filled-input app).
   */
  variant?: InputVariant;
  /**
   * iOS-native floating-label pattern: when input is empty AND unfocused,
   * the label sits inside the input where a placeholder would. On focus or
   * once content is entered, the label rises and shrinks above the text.
   *
   * Defaults to true when a label is provided. Pass false to use the
   * traditional static-label-above-input layout (e.g. for terse labels on
   * a multi-column form).
   */
  floatingLabel?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(function Input(
  { label, error, helperText, containerStyle, icon, variant: variantProp, floatingLabel: floatingProp, ...props },
  ref,
) {
  // Per-project default: use MobileStyle.inputStyle if the caller didn't
  // override. This makes input shapes vary by project without any change
  // at the call site — same <Input label="Email" /> renders as filled on
  // 'modern-dark' and outlined on 'flat-design'.
  const variant: InputVariantCanonical = variantProp
    ? (INPUT_VARIANT_ALIAS_MAP[variantProp as string] || 'outlined')
    : MobileStyle.inputStyle;
  // Floating label is iOS-native default; opt-out via prop=false. Only
  // applies when an actual label is provided.
  const useFloating = (floatingProp ?? true) && Boolean(label);
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Track value internally so the clear (×) button works for both controlled
  // (props.value provided) and uncontrolled (just defaultValue) inputs. For
  // controlled inputs, props.value remains the source of truth on subsequent
  // renders; for uncontrolled, internalValue tracks the user's typing.
  const [internalValue, setInternalValue] = useState<string>(
    typeof props.value === 'string' ? props.value : (props.defaultValue ?? '')
  );
  const value = typeof props.value === 'string' ? props.value : internalValue;
  const hasContent = typeof value === 'string' && value.length > 0;

  const { colors, typography } = useTheme();
  const isOutlined = variant === 'outlined';

  // Floating-label animation. 0 = label sits inside the input (empty +
  // unfocused state); 1 = label floats above (focused or has content).
  // useNativeDriver: false because we animate fontSize + top, which the
  // native driver doesn't support (those are layout properties).
  const labelAnim = useRef(new Animated.Value(hasContent ? 1 : 0)).current;
  useEffect(() => {
    if (!useFloating) return;
    Animated.timing(labelAnim, {
      toValue: focused || hasContent ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focused, hasContent, useFloating, labelAnim]);

  const isPassword = props.secureTextEntry === true;
  // Show the clear (×) button when there's content to clear AND the caller
  // wired onChangeText (otherwise clearing wouldn't propagate to the parent).
  const canShowClear = hasContent && !isPassword && props.onChangeText !== undefined;
  // Show the eye toggle on password fields once the user has typed
  // something. Hiding it when empty matches iOS Mail / Cash App behavior.
  const canShowEye = isPassword && hasContent;

  const handleChangeText = (text: string) => {
    setInternalValue(text);
    props.onChangeText?.(text);
  };
  const handleClear = () => {
    setInternalValue('');
    props.onChangeText?.('');
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Static label (only when floating label is disabled). */}
      {label && !useFloating ? (
        <Typography variant="subhead" style={[styles.label, { color: colors.textSecondary }]}>
          {label}
        </Typography>
      ) : null}

      <View
        style={[
          styles.inputWrap,
          {
            borderColor: error
              ? colors.error
              : focused
                ? colors.primary
                : (isOutlined ? colors.border : 'transparent'),
            borderWidth: isOutlined ? 1 : 0,
            // Match input corner radius to the project's button radius so
            // every shape on the screen shares the same visual language —
            // pill buttons + pill inputs (modern-dark), or sharp buttons +
            // sharp inputs (neo-brutalism). Pill (full=9999) clamps to the
            // input height naturally so it still looks correct.
            borderRadius: BUTTON_RADIUS,
            backgroundColor: isOutlined
              ? colors.background
              : (colors.inputBackground ?? colors.surface),
            // When floating label is active, expand vertical space to give
            // room for the label to sit inside the input on its way up.
            paddingTop: useFloating ? 18 : 0,
            paddingBottom: useFloating ? 6 : 0,
            minHeight: useFloating ? 56 : MIN_TOUCH_TARGET,
          },
        ]}
      >
        {/* Coerce string icons (the LLM's natural Ionicons-name idiom, e.g.
            icon="document-text-outline") into <Ionicons .../>. Without this
            coercion, RN would warn "Text strings must be rendered within a
            <Text> component" because {string} as a direct child of <View>
            is an unwrapped text node. Same pattern as ListItem / EmptyState
            / Chip in this file — Input was the lone holdout. */}
        {icon ? (
          <View style={styles.icon}>
            {typeof icon === 'string' ? (
              <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.textSecondary} />
            ) : (
              icon
            )}
          </View>
        ) : null}

        {/* Floating label — animated position + size. pointerEvents=none
            so taps pass through to the TextInput underneath. */}
        {useFloating ? (
          <Animated.Text
            pointerEvents="none"
            style={[
              styles.floatingLabel,
              {
                color: error
                  ? colors.error
                  : focused
                    ? colors.primary
                    : colors.textSecondary,
                left: icon ? 50 : 14,
                top: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 6] }),
                fontSize: labelAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 11] }),
              },
            ]}
          >
            {label}
          </Animated.Text>
        ) : null}

        <TextInput
          {...props}
          ref={ref}
          // secureTextEntry honors the eye toggle: when showPassword=true,
          // we flip secureTextEntry off so the field renders plaintext.
          secureTextEntry={isPassword && !showPassword}
          style={[
            styles.input,
            typography.body,
            { color: colors.text },
            icon ? styles.inputWithIcon : null,
            useFloating ? { paddingTop: 4 } : null,
          ]}
          placeholderTextColor={colors.placeholder ?? colors.textSecondary}
          // Suppress placeholder while the floating label is "inside" the
          // input (empty + unfocused) — the label takes over the placeholder
          // slot. Once focused or content exists, the user-supplied
          // placeholder shows alongside the floated-up label.
          placeholder={useFloating && !focused && !hasContent ? '' : props.placeholder}
          onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
          onChangeText={handleChangeText}
          value={typeof props.value === 'string' ? props.value : internalValue}
        />

        {/* Trailing controls — eye toggle for password fields, clear (×)
            for normal text fields with content. Mutually exclusive. */}
        {canShowEye ? (
          <Pressable
            onPress={() => setShowPassword((s) => !s)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={styles.trailing}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        ) : null}
        {canShowClear ? (
          <Pressable
            onPress={handleClear}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Clear input"
            style={styles.trailing}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Typography variant="footnote" color={colors.error} style={styles.error}>
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="footnote" color={colors.textSecondary} style={styles.error}>
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { marginBottom: 6 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET,   // iOS HIG minimum tap target
    position: 'relative',          // anchors the absolutely-positioned floating label
  },
  icon: { paddingLeft: 12 },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, minHeight: MIN_TOUCH_TARGET },
  inputWithIcon: { paddingLeft: 8 },
  floatingLabel: {
    position: 'absolute',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  trailing: {
    paddingHorizontal: 12,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: MIN_TOUCH_TARGET,
  },
  error: { marginTop: 4 },
});