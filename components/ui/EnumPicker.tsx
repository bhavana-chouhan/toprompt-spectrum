import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

/**
 * Normalize any option shape an LLM-authored screen might pass into
 * { _id, displayValue }. Accepts:
 *   'Cat'                                  → { _id: 'Cat', displayValue: 'Cat' }
 *   { _id, displayValue }                  → unchanged (canonical)
 *   { label, value } | { value, label }    → the universal React select idiom
 *   { id, name } | { _id, name/title/... } → entity records passed raw
 * Anything unrecognizable degrades to its stringified id rather than
 * rendering blank or crashing the row.
 */
function normalizeOption(opt: any): { _id: string; displayValue: string } {
  if (opt === null || opt === undefined) return { _id: '', displayValue: '' };
  if (typeof opt === 'string' || typeof opt === 'number') {
    return { _id: String(opt), displayValue: String(opt) };
  }
  const id = opt._id ?? opt.id ?? opt.value ?? opt.key ?? '';
  const display =
    opt.displayValue ?? opt.label ?? opt.name ?? opt.title ?? opt.text ?? String(id);
  return { _id: String(id), displayValue: String(display) };
}

export interface EnumPickerProps {
  label: string;
  /** Current value — must be one of `options` (or empty). */
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
}

/**
 * GENERATED DETERMINISTICALLY by generate-component-library.ts.
 * Single writer for enum fields. LLM authoring a raw <TextInput> for an
 * enum-typed field is structurally wrong and is caught by the
 * form-fields-respect-partition class.
 */
export function EnumPicker(props: EnumPickerProps): JSX.Element {
  const { label, value, onChange, options: rawOptions, required, error } = props;
  // DC-5: keep the VALUE alongside its display text. This used to collapse to
  // `displayValue` and emit the label, so a form saved species='Dog' while the
  // entity type, seed data and filter chips all used 'dog' — created records
  // then vanished under every filter chip. RelationPicker already preserved
  // _id; EnumPicker now mirrors that. Accepts string[] | {label,value}[] |
  // {value,displayValue}[] | entity records.
  const options = (Array.isArray(rawOptions) ? rawOptions : []).map((o: any) => {
    const n = normalizeOption(o);
    const raw =
      o && typeof o === 'object'
        ? (o.value ?? o._id ?? o.id ?? n.displayValue)
        : n.displayValue;
    return { value: String(raw), displayValue: n.displayValue };
  });
  // Display text for the current value (falls back to the value itself so a
  // seeded record whose value isn't in the option list still reads sensibly).
  const selectedLabel =
    options.find((o) => o.value === value)?.displayValue ?? (value || '');
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const hasError = Boolean(error);

  // ≤4 options → segmented; >4 → modal list.
  if (options.length > 0 && options.length <= 4) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.labelRow}>
          <Typography variant="caption" color={colors.textSecondary}>
            {label}{required ? ' *' : ''}
          </Typography>
        </View>
        <View style={[styles.segment, { borderColor: hasError ? colors.error : colors.border, backgroundColor: colors.surface }]}>
          {options.map((opt, i) => {
            const active = value === opt.value;
            const isLast = i === options.length - 1;
            return (
              <Pressable
                key={opt.value}
                onPress={() => onChange(opt.value)}
                style={[
                  styles.segmentItem,
                  active && { backgroundColor: colors.primary },
                  !isLast && { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
                ]}
              >
                <Typography variant="body2" color={active ? '#fff' : colors.text}>{opt.displayValue}</Typography>
              </Pressable>
            );
          })}
        </View>
        {hasError ? (
          <Typography variant="caption" color={colors.error} style={styles.errorText}>{error}</Typography>
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Typography variant="caption" color={colors.textSecondary}>
          {label}{required ? ' *' : ''}
        </Typography>
      </View>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={String(label ?? "option")}
        style={[
          styles.field,
          { borderColor: hasError ? colors.error : colors.border, backgroundColor: colors.surface },
        ]}
      >
        <Typography variant="body1" color={value ? colors.text : colors.textMuted} style={styles.fieldText} numberOfLines={1}>
          {selectedLabel || `Select ${String(label ?? "option").toLowerCase()}`}
        </Typography>
        <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
      </Pressable>
      {hasError ? (
        <Typography variant="caption" color={colors.error} style={styles.errorText}>{error}</Typography>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Typography variant="h3">{String(label ?? "Select an option")}</Typography>
              <Pressable onPress={() => setOpen(false)} accessibilityLabel="Close">
                <Ionicons name="close" size={22} color={colors.text} />
              </Pressable>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const active = value === item.value;
                return (
                  <Pressable
                    onPress={() => { onChange(item.value); setOpen(false); }}
                    style={[styles.row, { backgroundColor: active ? colors.surface : 'transparent', borderBottomColor: colors.divider }]}
                  >
                    <Typography variant="body1" color={active ? colors.primary : colors.text} style={styles.rowText}>
                      {item.displayValue}
                    </Typography>
                    {active ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: Spacing.xs },
  labelRow: { paddingHorizontal: Spacing.xs },
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    minHeight: 48, paddingHorizontal: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.md,
  },
  fieldText: { flex: 1, marginRight: Spacing.sm },
  segment: {
    flexDirection: 'row', minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  segmentItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  errorText: { paddingHorizontal: Spacing.xs },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '60%',
    borderTopLeftRadius: BorderRadius.xl, borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg, paddingBottom: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
});
