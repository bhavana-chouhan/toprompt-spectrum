import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { LIST_ROW_HEIGHT } from '@/constants/touchTarget';
import { Elevation, ELEVATION_LANGUAGE } from '@/constants/elevation';
import { DESIGN_DNA } from '@/constants/designDna';

// D3 — row construction follows the app's design DNA, never per-screen taste:
//   hairline → flat rows with a hairline separator (iOS Settings; legacy look)
//   inset    → rendered as hairline at this fidelity (kept distinct upstream
//              for future per-corner separator insets)
//   gap      → no separator line; rows breathe with vertical whitespace
//   card     → every row renders as an elevated card (screens no longer need
//              to pass the elevated prop — the DNA makes it the default)
// ELEVATION_LANGUAGE decides how card rows separate: flat-bordered draws a
// hairline border, everything else uses the generated Elevation tiers.
const SEPARATOR_STYLE = DESIGN_DNA.separatorStyle;
const FLAT_SURFACES = ELEVATION_LANGUAGE === 'flat-bordered';

// Maps a category/status string to an Ionicon. Domain-agnostic (finance, food,
// shopping, health, ...). Renders a leading row icon when a screen passes a
// category but no explicit icon prop — so list rows never look like a bare
// settings list.
const LIST_CATEGORY_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  food: 'restaurant', dining: 'restaurant', groceries: 'cart', restaurant: 'restaurant',
  coffee: 'cafe', transport: 'car', travel: 'airplane', fuel: 'car-sport',
  shopping: 'bag-handle', clothing: 'shirt', health: 'medkit', fitness: 'barbell',
  entertainment: 'game-controller', subscriptions: 'tv', music: 'musical-notes',
  bills: 'receipt', utilities: 'flash', rent: 'home', housing: 'home',
  income: 'trending-up', salary: 'cash', investments: 'stats-chart',
  education: 'school', work: 'briefcase', software: 'laptop', friends: 'people',
  personal: 'person', other: 'pricetag',
};

export interface ListItemProps {
  title: string;
  subtitle?: string;
  // P5 — accept an Ionicon NAME or a ready-made element; normalized at render so
  // screens can pass either shape without a type/runtime failure.
  icon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  // When no explicit icon is given, a leading category icon is derived from this
  // value (e.g. category="Food" -> restaurant). Domain-agnostic.
  category?: string;
  /**
   * Leading THUMBNAIL for entity rows (recipe cover, product photo, avatar...).
   * When set it takes the leading slot and renders a rounded image via expo-image,
   * so media-bearing lists look consistent instead of every screen hand-rolling
   * its own <Image> + layout. Falls back to icon/category when absent.
   */
  imageUrl?: string;
  /**
   * Render the row as an ELEVATED CARD (surface, rounded corners, soft shadow,
   * vertical gap) instead of a flat hairline row. Use for entity browse/feed
   * lists; leave off for settings-style grouped lists (ListGroup).
   */
  elevated?: boolean;
  /**
   * Trailing content. Accepts EITHER:
   *   • A React element (Badge, Switch, value-display View, etc.) — rendered as-is.
   *   • A string OR number — wrapped in <Typography> with the secondary color
   *     at render time. Without the coercion, an LLM emitting
   *     <ListItem rightContent="$12.99" /> would render a bare string child
   *     of <Pressable> and RN would warn "Text strings must be rendered
   *     within a <Text> component" — the same bug class fixed at the Input
   *     primitive in commit a15c4bf.
   */
  rightContent?: string | number | React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
  /** Long-press handler — standard iOS pattern for context menus / delete confirm. */
  onLongPress?: () => void;
  /** Hides the bottom hairline separator. Use on the last row of a grouped section. */
  hideSeparator?: boolean;
  style?: ViewStyle;
}

export function ListItem({
  title,
  subtitle,
  icon,
  category,
  imageUrl,
  elevated = false,
  rightContent,
  showChevron = true,
  onPress,
  onLongPress,
  hideSeparator = false,
  style,
}: ListItemProps) {
  const { colors, borderRadius } = useTheme();
  // Derive a leading icon from the category when no explicit icon was passed.
  const derivedIcon: keyof typeof Ionicons.glyphMap | null =
    !icon && category
      ? (LIST_CATEGORY_ICON[category.trim().toLowerCase()] || 'pricetag-outline')
      : null;
  // DNA default: 'card' separator style renders every row as a card even when
  // the screen didn't pass the elevated prop. An explicit prop still wins.
  const cardRow = elevated || SEPARATOR_STYLE === 'card';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.container,
        cardRow
          ? [
              styles.elevated,
              FLAT_SURFACES
                ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
                : (Elevation.sm as object),
            ]
          : null,
        // 'gap' rows separate with whitespace instead of a line.
        !cardRow && SEPARATOR_STYLE === 'gap' ? styles.gapRow : null,
        {
          backgroundColor: pressed && onPress
            ? (colors.groupedBackground ?? colors.surface)
            : (colors.cardBackground ?? colors.background),
          borderBottomColor: colors.separator ?? colors.border,
          // Card rows separate with shadow/border + gap, gap rows with
          // whitespace — the hairline is suppressed for both.
          borderBottomWidth:
            hideSeparator || cardRow || SEPARATOR_STYLE === 'gap'
              ? 0
              : StyleSheet.hairlineWidth,
          ...(cardRow
            ? { borderRadius: borderRadius.lg ?? 12, shadowColor: colors.text }
            : null),
        },
        style,
      ]}
      disabled={!onPress && !onLongPress}
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.thumb, { borderRadius: borderRadius.md }]}
          contentFit="cover"
          transition={150}
        />
      ) : icon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
          {typeof icon === 'string' ? (
            <Ionicons name={icon} size={22} color={colors.primary} />
          ) : (
            icon
          )}
        </View>
      ) : derivedIcon ? (
        <View style={[styles.iconWrap, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
          <Ionicons name={derivedIcon} size={22} color={colors.primary} />
        </View>
      ) : null}
      <View style={styles.content}>
        <Typography variant="body" numberOfLines={1}>{title}</Typography>
        {subtitle ? (
          <Typography variant="subhead" color={colors.textSecondary} numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Typography>
        ) : null}
      </View>
      {/* Coerce string/number rightContent into <Typography> so a bare-string
          child of <Pressable> never appears in the JSX tree (would crash with
          "Text strings must be rendered within a <Text> component"). React
          elements pass through unchanged. */}
      {typeof rightContent === 'string' || typeof rightContent === 'number' ? (
        <Typography variant="subhead" color={colors.textSecondary}>{String(rightContent)}</Typography>
      ) : rightContent ?? null}
      {showChevron && onPress && (
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: LIST_ROW_HEIGHT,   // iOS default list row 60pt — proper tap rhythm
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Leading media for entity rows — larger than the icon slot so cover photos
  // read as real imagery instead of a tiny glyph.
  thumb: {
    width: 56,
    height: 56,
  },
  // Elevated card row: its own surface + vertical gap. Shadow/border comes
  // from the generated Elevation tiers (or a hairline border when the app's
  // elevationLanguage is flat-bordered) — never hardcoded here, so the app's
  // DNA actually lands on list rows.
  elevated: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingVertical: 12,
  },
  // 'gap' separator style: rows separate with whitespace, no hairline.
  gapRow: {
    marginBottom: 10,
  },
  content: { flex: 1 },
  subtitle: { marginTop: 2 },
});