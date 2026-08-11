import React, { type ReactNode } from 'react';

/**
 * HeroSlot / RowSlot — composition markers, NOT visual wrappers.
 *
 * The mobile codegen pipeline emits these around hero zones (detail/dashboard
 * screens) and list-row items so the post-generation validator can verify the
 * canonical industry-specific composition was preserved. They render their
 * children as-is — zero layout effect — so removing them only loses metadata,
 * not layout.
 *
 * IMPORTANT FOR THE LLM:
 *   - Keep <HeroSlot kind="..."> and <RowSlot variant="..."> intact.
 *   - The 'kind' / 'variant' string identifies the per-industry silhouette
 *     (numeric-hero, ring-stat-hero, activity-row, etc.) and gets read by
 *     telemetry. Editing the string mislabels the screen.
 *   - You MAY edit JSX *inside* the slot freely.
 *   - You MUST NOT replace the slot wrapper with a bare Fragment or View.
 */
export function HeroSlot({ kind, children }: { kind: string; children: ReactNode }) {
  // kind is a marker prop — referenced so eslint no-unused-vars / TS noUnusedParameters stay quiet.
  void kind;
  return <>{children}</>;
}

export function RowSlot({ variant, children }: { variant: string; children: ReactNode }) {
  void variant;
  return <>{children}</>;
}
