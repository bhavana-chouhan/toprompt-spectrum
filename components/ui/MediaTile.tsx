import React from 'react';
import { Pressable, View, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Elevation, ELEVATION_LANGUAGE } from '@/constants/elevation';
import { DESIGN_DNA } from '@/constants/designDna';

// D3 — the tile's structural variant comes from the app's design DNA, never
// from screens. imageTreatment picks how artwork renders:
//   full-bleed    → media edge-to-edge, label below (classic card)
//   inset         → media padded inside the surface, label below
//   framed        → inset + hairline frame around the artwork (print-like)
//   scrim-overlay → label overlaid on the artwork over a dark scrim
// ELEVATION_LANGUAGE picks how the surface separates: flat-bordered draws a
// hairline border; everything else uses the generated Elevation tiers.
const TREATMENT = DESIGN_DNA.imageTreatment;
const FLAT = ELEVATION_LANGUAGE === 'flat-bordered';
const INSET_MEDIA = TREATMENT === 'inset' || TREATMENT === 'framed';
const OVERLAY_LABEL = TREATMENT === 'scrim-overlay';

export interface MediaTileProps {
  title: string;
  subtitle?: string;
  /**
   * Tile artwork (recipe cover, product photo, album art...). When absent the
   * tile renders a themed placeholder instead of collapsing — a grid must never
   * show a blank square, and it must never silently drop imagery the data has.
   */
  imageUrl?: string;
  /** Ionicon shown in the placeholder when imageUrl is missing. */
  placeholderIcon?: keyof typeof Ionicons.glyphMap;
  /** Small pill over the artwork (e.g. "25m", "New", a rating). */
  badge?: string | number;
  /** Optional Ionicon rendered inside the badge, before the label. */
  badgeIcon?: keyof typeof Ionicons.glyphMap;
  /** Media aspect ratio. 1 = square (default), 1.33 = landscape, 0.75 = portrait. */
  aspectRatio?: number;
  /** Explicit tile width — pass the computed column width from the grid screen. */
  width?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
}

export function MediaTile({
  title,
  subtitle,
  imageUrl,
  placeholderIcon = 'image-outline',
  badge,
  badgeIcon,
  aspectRatio = 1,
  width,
  onPress,
  onLongPress,
  style,
}: MediaTileProps) {
  const { colors, borderRadius } = useTheme();
  const radius = borderRadius.lg ?? 12;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={400}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.tile,
        // Surface separation follows the app's elevation language: a border
        // for flat-bordered (shadow would be clipped/absent anyway), the
        // generated Elevation tier otherwise.
        FLAT
          ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
          : (Elevation.sm as object),
        width ? { width } : styles.flexTile,
        {
          backgroundColor: colors.cardBackground ?? colors.surface,
          borderRadius: radius,
          shadowColor: colors.text,
          opacity: pressed && onPress ? 0.85 : 1,
        },
        style,
      ]}
      disabled={!onPress && !onLongPress}
    >
      <View
        style={[
          styles.media,
          { aspectRatio },
          INSET_MEDIA
            ? [styles.mediaInset, { borderRadius: Math.max(2, radius - 4) },
               TREATMENT === 'framed'
                 ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border }
                 : null]
            : { borderTopLeftRadius: radius, borderTopRightRadius: radius },
          OVERLAY_LABEL ? { borderRadius: radius } : null,
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            contentFit="cover"
            transition={150}
          />
        ) : (
          <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
            <Ionicons name={placeholderIcon} size={32} color={colors.textSecondary} />
          </View>
        )}
        {badge !== undefined && badge !== null && badge !== '' ? (
          <View style={[styles.badge, { backgroundColor: colors.primary, borderRadius: borderRadius.sm ?? 6 }]}>
            {badgeIcon ? (
              <Ionicons name={badgeIcon} size={10} color={colors.textInverse ?? colors.background} />
            ) : null}
            <Typography variant="caption" color={colors.textInverse ?? colors.background}>
              {String(badge)}
            </Typography>
          </View>
        ) : null}
        {OVERLAY_LABEL ? (
          <View style={styles.scrim}>
            <Typography variant="subhead" numberOfLines={2} style={styles.scrimText}>{title}</Typography>
            {subtitle ? (
              <Typography variant="caption" numberOfLines={1} style={[styles.scrimText, styles.subtitle]}>
                {subtitle}
              </Typography>
            ) : null}
          </View>
        ) : null}
      </View>
      {OVERLAY_LABEL ? null : (
        <View style={styles.label}>
          <Typography variant="subhead" numberOfLines={2}>{title}</Typography>
          {subtitle ? (
            <Typography variant="caption" color={colors.textSecondary} numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Typography>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // NO overflow:'hidden' and NO shadow literals on the tile. On iOS,
  // overflow:'hidden' clips the shadow of the SAME view (tile renders flat
  // while Android still looks right), and shadows come from the generated
  // Elevation tiers so the app's elevationLanguage actually lands here.
  // Corner clipping of the artwork is handled by "media" below, which has its
  // own overflow:'hidden' — the image is still clipped and the shadow survives.
  tile: {},
  // Used when the grid does not pass an explicit width (flex columns + gap).
  flexTile: { flex: 1 },
  media: {
    width: '100%',
    overflow: 'hidden',
  },
  // inset/framed treatments: artwork floats inside the surface.
  mediaInset: {
    margin: 8,
    width: 'auto',
  },
  image: { width: '100%', height: '100%' },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  // scrim-overlay treatment: label sits on the artwork over a dark scrim so
  // white text stays readable on any image.
  scrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  scrimText: { color: '#FFFFFF' },
  label: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  subtitle: { marginTop: 2 },
});