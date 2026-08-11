/**
 * Design DNA — GENERATED per app from the picked design direction.
 * Components branch on these axes to select their structural variant
 * (e.g. MediaTile label placement, ListItem row construction). Screens
 * must NOT branch on this file — pass props; the components own it.
 * Do not hand-edit; Phase 2 freezes it via the Phase-1 snapshot.
 */
export const DESIGN_DNA = {
  shapeLanguage: 'rounded',
  elevationLanguage: 'soft-shadow',
  separatorStyle: 'hairline',
  imageTreatment: 'inset',
  typeContrast: 'moderate',
  density: 'default',
  headerStyle: 'large-title',
  emptyStateStyle: 'illustration',
} as const;

export type DesignDnaAxes = typeof DESIGN_DNA;
