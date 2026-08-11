import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

import { Typography } from '@/components/ui/Typography';
import { Button } from '@/components/ui/Button';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

/**
 * Canonical date / date-time field.
 *
 * Uses the NATIVE picker (@react-native-community/datetimepicker, already in
 * the Expo scaffold's dependencies). The previous implementation opened a
 * modal containing a bare <TextInput> and asked the user to TYPE
 * "YYYY-MM-DD" — users reported the picker as "missing", and any typo left
 * the required date empty so the form could never be submitted.
 *
 * Platform behaviour matches each OS's convention:
 *   iOS     — spinner inside a bottom sheet, confirmed with Done.
 *   Android — the OS dialog, which closes itself on set/dismiss.
 *
 * Value contract is unchanged: ISO 8601 ('YYYY-MM-DD', or full ISO when
 * withTime) so every existing caller and store keeps working.
 */
export interface DatePickerProps {
  label: string;
  /** ISO 8601 date string (YYYY-MM-DD) or empty. */
  value: string;
  onChange: (iso: string) => void;
  required?: boolean;
  error?: string;
  /** When true also allows hh:mm input. */
  withTime?: boolean;
  /** Optional placeholder; defaults to "Select <label>". */
  placeholder?: string;
}

function toIso(d: Date, withTime?: boolean): string {
  const pad = (n: number) => (n < 10 ? '0' + String(n) : String(n));
  const day = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  if (!withTime) return day;
  return day + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

function parseIso(value: string): Date {
  if (value) {
    const parsed = new Date(value);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

/** Human-friendly display of an ISO value ('12 Mar 2026'). */
function formatDisplay(value: string, withTime?: boolean): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const date = d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  return date + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export function DatePicker(props: DatePickerProps) {
  const { label, value, onChange, required, error, withTime, placeholder } = props;
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Date>(() => parseIso(value));

  const display = useMemo(() => formatDisplay(value, withTime), [value, withTime]);
  const hasError = Boolean(error);
  const safeLabel = String(label ?? 'value');

  const openPicker = () => {
    setDraft(parseIso(value));
    setOpen(true);
  };

  // Android's dialog owns its own lifecycle: it fires once and dismisses.
  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
      if (event.type === 'set' && selected) onChange(toIso(selected, withTime));
      return;
    }
    if (selected) setDraft(selected);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Typography variant="caption" color={colors.textSecondary}>
          {safeLabel}{required ? ' *' : ''}
        </Typography>
      </View>
      <Pressable
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={'Pick ' + safeLabel}
        style={[
          styles.field,
          { borderColor: hasError ? colors.error : colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Typography
          variant="body1"
          color={display ? colors.text : colors.textMuted}
          style={styles.fieldText}
          numberOfLines={1}
        >
          {display || placeholder || ('Select ' + safeLabel.toLowerCase())}
        </Typography>
        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
      </Pressable>
      {hasError ? (
        <Typography variant="caption" color={colors.error} style={styles.errorText}>{error}</Typography>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={draft}
          mode={withTime ? 'datetime' : 'date'}
          display="default"
          onChange={onNativeChange}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          {/* Full-screen overlay: an INLINE sheet can be clipped by any parent
              (Card overflow, ScrollView bounds) and then the picker looks
              "missing". A Modal always renders above everything. */}
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
            <Pressable
              style={[styles.iosSheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={(e) => e.stopPropagation()}
            >
              <DateTimePicker
                value={draft}
                mode={withTime ? 'datetime' : 'date'}
                display="spinner"
                onChange={onNativeChange}
                textColor={colors.text}
              />
              <View style={styles.iosActions}>
                <Button title="Cancel" variant="secondary" onPress={() => setOpen(false)} style={styles.iosButton} />
                <Button
                  title="Done"
                  variant="primary"
                  onPress={() => { onChange(toIso(draft, withTime)); setOpen(false); }}
                  style={styles.iosButton}
                />
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  labelRow: { marginBottom: Spacing.xs, paddingHorizontal: Spacing.xs },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
  },
  fieldText: { flex: 1, marginRight: Spacing.sm },
  errorText: { paddingHorizontal: Spacing.xs },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  iosSheet: {
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  iosActions: { flexDirection: 'row', gap: Spacing.sm },
  iosButton: { flex: 1 },
});
