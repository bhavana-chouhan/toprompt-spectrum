import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography } from '@/components/ui/Typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

export interface FormFieldProps {
  children: React.ReactNode;
  /** Inline error message — surfaced from backend ValidationError.fieldErrors. */
  error?: string;
  /** Helper text shown when there is no error. */
  helperText?: string;
}

/**
 * GENERATED DETERMINISTICALLY by generate-component-library.ts.
 *
 * Single writer for inline form field error display. The form body
 * wraps inputs with this; <Input> / <RelationPicker> etc still own
 * their visual border styling, but the canonical error layer is here.
 */
export function FormField({ children, error, helperText }: FormFieldProps): JSX.Element {
  const { colors } = useTheme();
  return (
    <View style={styles.wrapper}>
      {children}
      {error ? (
        <Typography variant="caption" color={colors.error} style={styles.text}>
          {error}
        </Typography>
      ) : helperText ? (
        <Typography variant="caption" color={colors.textMuted} style={styles.text}>
          {helperText}
        </Typography>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  text: { paddingHorizontal: Spacing.xs },
});
