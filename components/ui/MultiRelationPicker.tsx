import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

export interface MultiRelationOption {
  _id: string;
  displayValue: string;
}

export interface MultiRelationPickerProps {
  label: string;
  /** Current selection as string[] of _ids. */
  value: string[];
  /** Called with the next selection array (idempotent toggle). */
  onChange: (ids: string[]) => void;
  options: MultiRelationOption[];
  required?: boolean;
  error?: string;
  emptyMessage?: string;
  /** Boundary E supplement — create-related-entity onramp. */
  onCreateNew?: () => void;
  createNewLabel?: string;
}

/**
 * GENERATED DETERMINISTICALLY by generate-component-library.ts (Convergence
 * batch). Single writer for [ObjectId] array-of-refs UI.
 */
export function MultiRelationPicker(props: MultiRelationPickerProps): JSX.Element {
  const { label, value, onChange, options, required, error, emptyMessage, onCreateNew, createNewLabel } = props;
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selectedSet = useMemo(() => new Set(value || []), [value]);
  const selected = useMemo(
    () => options.filter((o) => selectedSet.has(o._id)),
    [options, selectedSet],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.displayValue.toLowerCase().includes(q));
  }, [options, query]);

  const hasError = Boolean(error);
  const empty = options.length === 0;
  const canCreate = typeof onCreateNew === 'function';

  const toggle = (id: string) => {
    const next = new Set(value || []);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(Array.from(next));
  };

  const remove = (id: string) => {
    onChange((value || []).filter((v) => v !== id));
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Typography variant="caption" color={colors.textSecondary}>
          {label}{required ? ' *' : ''}
        </Typography>
      </View>
      <Pressable
        onPress={() => {
          if (empty && canCreate) { onCreateNew && onCreateNew(); return; }
          if (!empty) setOpen(true);
        }}
        accessibilityRole="button"
        accessibilityLabel={String(label ?? "option")}
        style={[
          styles.field,
          {
            borderColor: hasError ? colors.error : colors.border,
            backgroundColor: colors.surface,
            opacity: empty && !canCreate ? 0.6 : 1,
          },
        ]}
      >
        {selected.length === 0 ? (
          <Typography variant="body1" color={colors.textMuted} style={styles.fieldText} numberOfLines={1}>
            {empty
              ? (canCreate ? (createNewLabel || `Create ${String(label ?? "new")}`) : (emptyMessage || `No ${String(label ?? "option").toLowerCase()} yet`))
              : `Select ${String(label ?? "option").toLowerCase()}`}
          </Typography>
        ) : (
          <View style={styles.chipRow}>
            {selected.map((s) => (
              <Pressable
                key={s._id}
                onPress={() => remove(s._id)}
                style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Typography variant="caption" color={colors.text}>{s.displayValue}</Typography>
                <Ionicons name="close" size={12} color={colors.textMuted} />
              </Pressable>
            ))}
          </View>
        )}
        <Ionicons name={empty && canCreate ? 'add' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {hasError ? (
        <Typography variant="caption" color={colors.error} style={styles.errorText}>{error}</Typography>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.sheet, { backgroundColor: colors.background }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHeader}>
              <Typography variant="h3">{String(label ?? "Select an option")}</Typography>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {canCreate ? (
                  <Pressable
                    onPress={() => { setOpen(false); onCreateNew && onCreateNew(); }}
                    accessibilityLabel={createNewLabel || `Create ${label}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                    <Typography variant="body2" color={colors.primary}>{createNewLabel || `New ${label}`}</Typography>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => setOpen(false)} accessibilityLabel="Close">
                  <Ionicons name="close" size={22} color={colors.text} />
                </Pressable>
              </View>
            </View>
            <View style={[styles.searchRow, { borderColor: colors.border }]}>
              <Ionicons name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search"
                placeholderTextColor={colors.textMuted}
                value={query}
                onChangeText={setQuery}
                autoCorrect={false}
                autoCapitalize="none"
              />
            </View>
            {filtered.length === 0 ? (
              <View style={styles.empty}>
                <Typography variant="body2" color={colors.textMuted} align="center">No matches</Typography>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isActive = selectedSet.has(item._id);
                  return (
                    <Pressable
                      onPress={() => toggle(item._id)}
                      style={[styles.row, { backgroundColor: isActive ? colors.surface : 'transparent', borderBottomColor: colors.divider }]}
                    >
                      <Typography variant="body1" color={isActive ? colors.primary : colors.text} style={styles.rowText}>
                        {item.displayValue}
                      </Typography>
                      {isActive ? <Ionicons name="checkmark" size={18} color={colors.primary} /> : null}
                    </Pressable>
                  );
                }}
              />
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
  },
  fieldText: { flex: 1, marginRight: Spacing.sm },
  chipRow: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginRight: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, borderWidth: StyleSheet.hairlineWidth,
  },
  errorText: { paddingHorizontal: Spacing.xs },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.base,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, paddingHorizontal: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: BorderRadius.md,
  },
  searchInput: { flex: 1, paddingVertical: Spacing.sm, fontSize: 15 },
  empty: { paddingVertical: Spacing.xl },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: Spacing.base, paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
});
