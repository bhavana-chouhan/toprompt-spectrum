import { Platform } from 'react-native';

/**
 * Platform-correct elevation tokens — GENERATED per app from the picked
 * design direction (elevationLanguage: 'soft-shadow'). iOS gets native shadow
 * (shadowColor/Offset/Opacity/Radius); Android gets the elevation prop. Use these on
 * Card, BottomSheet, FAB, and any elevated surface — NEVER hardcode shadow
 * values inline.
 *
 * Tiers:
 *   none — flat surfaces (inset-grouped lists, toolbars)
 *   sm   — list items, chips (subtle)
 *   md   — cards, sheets (default)
 *   lg   — modals, floating action buttons
 *   xl   — dialogs, bottom sheets at full height
 */
export const Elevation = {
  none: {},
  sm: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2 },
    android: { elevation: 2 },
    default: {},
  }) as object,
  md: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
    android: { elevation: 4 },
    default: {},
  }) as object,
  lg: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
    android: { elevation: 8 },
    default: {},
  }) as object,
  xl: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24 },
    android: { elevation: 16 },
    default: {},
  }) as object,
} as const;

export type ElevationTier = keyof typeof Elevation;

/**
 * The app's elevation language — components branch on this to complete the
 * look (e.g. 'flat-bordered' surfaces draw a hairline border instead of
 * relying on shadow). Part of the design DNA; do not hand-edit.
 */
export const ELEVATION_LANGUAGE = 'soft-shadow' as const;
