import { useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
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

export interface RelationPickerOption {
  _id: string;
  displayValue: string;
}

export interface RelationPickerProps {
  /** Label shown above the field (e.g. "Category"). NEVER the FK field name like "categoryId". */
  label: string;
  /** Current ObjectId value. Empty string means no selection. */
  value: string;
  /** Called with the selected option's _id (or "" to clear). */
  onChange: (id: string) => void;
  /** All available options drawn from the related entity's store. */
  options?: RelationPickerOption[];
  /**
   * Alias for 'options' — LLM-authored forms reliably emit items={...} plus
   * keyField/displayField (the universal list-component idiom). Billwise
   * (mrwj9nl8) shipped a form whose picker passed 'items' against this
   * contract: 'options' arrived undefined and the dropdown rendered
   * permanently empty while the SAME store filled the list screens.
   * Widening the component to the shape the model reliably produces beats
   * fighting it (same call as DC-9).
   */
  items?: unknown[];
  /** With 'items': which key holds the id (default '_id'). */
  keyField?: string;
  /** With 'items': which key holds the display text (default 'label'). */
  displayField?: string;
  /** Required indicator + error styling. */
  required?: boolean;
  /** Form-level validation error string (e.g. "Category is required"). */
  error?: string;
  /** Shown when options.length === 0 (related entity has no records). */
  emptyMessage?: string;
  /**
   * Boundary E supplement — Create-related-entity onramp. When provided,
   * the picker renders a "Create <X>" CTA both inside the modal sheet AND
   * inline when options.length === 0. Closes the "no Category yet → user
   * stranded" recurrence engine: tapping the CTA navigates to the related
   * entity's create route (typically `/<refSlug>/new`).
   */
  onCreateNew?: () => void;
  /** Label for the create-new CTA (e.g. "Create Category"). Defaults to "Create new". */
  createNewLabel?: string;
}

/**
 * GENERATED DETERMINISTICALLY by generate-component-library.ts (Heavy-CRUD batch).
 *
 * Replaces the bare `<Input>` that previously rendered for ObjectId fields.
 * The component owns the abstraction: users see entity names ("Category:
 * Groceries"), never infrastructure ("categoryId: 507f1f77...").
 */
export function RelationPicker(props: RelationPickerProps): JSX.Element {
  const { label, value, onChange, options: declaredOptions, items, keyField, displayField, required, error, emptyMessage, placeholder, onCreateNew, createNewLabel } = props;
  // items-alias resolution — see the interface note. keyField/displayField
  // are honored by projecting them onto the keys normalizeOption reads.
  const rawOptions = Array.isArray(declaredOptions) && declaredOptions.length > 0
    ? declaredOptions
    : Array.isArray(items)
      ? items.map((it: any) =>
          it && typeof it === 'object'
            ? { ...it, _id: it[keyField ?? '_id'] ?? it._id, displayValue: it[displayField ?? 'label'] ?? it.displayValue }
            : it)
      : declaredOptions;
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Accept any option shape the calling screen emits ({label,value} is the
  // universal React idiom and was rendering BLANK rows against the declared
  // {_id,displayValue} contract). Normalized once here; every read below is
  // canonical. Options without a display string are dropped rather than
  // rendered as empty rows.
  // DC-9: carry the RICH keys through. Screens consistently emit
  // { id, label, subtitle, imageUrl } (breed/species text and the pet photo);
  // normalizeOption mapped only id/label and DROPPED the rest, so every picker
  // rendered plain text rows instead of the authored rich rows. Widening the
  // component to the shape the model reliably produces beats fighting it.
  const options = useMemo(
    () =>
      (Array.isArray(rawOptions) ? rawOptions : [])
        .map((o: any) => {
          const n = normalizeOption(o);
          const src = o && typeof o === 'object' ? o : {};
          const subtitle = src.subtitle ?? src.secondary ?? src.description;
          const imageUrl = src.imageUrl ?? src.image ?? src.photo ?? src.avatarUrl;
          return {
            ...n,
            subtitle: typeof subtitle === 'string' && subtitle ? subtitle : undefined,
            imageUrl: typeof imageUrl === 'string' && imageUrl ? imageUrl : undefined,
          };
        })
        .filter((o) => o.displayValue.length > 0),
    [rawOptions],
  );

  const selected = useMemo(
    () => options.find((o) => o._id === value) || null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.displayValue.toLowerCase().includes(q));
  }, [options, query]);

  const hasError = Boolean(error);
  const empty = options.length === 0;
  const canCreate = typeof onCreateNew === 'function';

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Typography variant="caption" color={colors.textSecondary}>
          {label}
          {required ? ' *' : ''}
        </Typography>
      </View>
      <Pressable
        onPress={() => {
          // Boundary E supplement — when options are empty AND a create
          // handler is provided, tapping the field navigates straight to
          // the create flow instead of opening an empty sheet.
          if (empty && canCreate) {
            onCreateNew && onCreateNew();
            return;
          }
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
        <Typography
          variant="body1"
          color={selected ? colors.text : colors.textMuted}
          style={styles.fieldText}
          numberOfLines={1}
        >
          {empty
            ? (canCreate ? (createNewLabel || `Create ${String(label ?? "new")}`) : (emptyMessage || `No ${String(label ?? "option").toLowerCase()} yet`))
            : selected
              ? selected.displayValue
              : placeholder || `Select ${String(label ?? "option").toLowerCase()}`}
        </Typography>
        <Ionicons name={empty && canCreate ? 'add' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>
      {hasError ? (
        <Typography variant="caption" color={colors.error} style={styles.errorText}>
          {error}
        </Typography>
      ) : null}

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.background }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.sheetHeader}>
              <Typography variant="h3">{String(label ?? "Select an option")}</Typography>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {canCreate ? (
                  <Pressable
                    onPress={() => {
                      setOpen(false);
                      onCreateNew && onCreateNew();
                    }}
                    accessibilityLabel={createNewLabel || `Create ${label}`}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Ionicons name="add" size={18} color={colors.primary} />
                    <Typography variant="body2" color={colors.primary}>
                      {createNewLabel || `New ${label}`}
                    </Typography>
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
                <Typography variant="body2" color={colors.textMuted} align="center">
                  No matches
                </Typography>
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item._id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isActive = item._id === value;
                  return (
                    <Pressable
                      onPress={() => {
                        onChange(item._id);
                        setOpen(false);
                        setQuery('');
                      }}
                      style={[
                        styles.row,
                        {
                          backgroundColor: isActive ? colors.surface : 'transparent',
                          borderBottomColor: colors.divider,
                        },
                      ]}
                    >
                      {item.imageUrl ? (
                        <Image
                          source={{ uri: item.imageUrl }}
                          style={styles.rowThumb}
                          contentFit="cover"
                          transition={120}
                        />
                      ) : null}
                      <View style={styles.rowTextWrap}>
                        <Typography
                          variant="body1"
                          color={isActive ? colors.primary : colors.text}
                          style={styles.rowText}
                        >
                          {item.displayValue}
                        </Typography>
                        {item.subtitle ? (
                          <Typography variant="caption" color={colors.textSecondary} numberOfLines={1}>
                            {item.subtitle}
                          </Typography>
                        ) : null}
                      </View>
                      {isActive ? (
                        <Ionicons name="checkmark" size={18} color={colors.primary} />
                      ) : null}
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
  errorText: { paddingHorizontal: Spacing.xs },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.base,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.base,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: BorderRadius.md,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    fontSize: 15,
  },
  empty: {
    paddingVertical: Spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1 },
  rowTextWrap: { flex: 1 },
  rowThumb: { width: 36, height: 36, borderRadius: 18, marginRight: 10 },
});
