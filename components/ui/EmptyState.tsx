import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, ButtonProps } from './Button';
import { Typography } from './Typography';
import { useTheme } from '@/hooks/useTheme';
import { DESIGN_DNA } from '@/constants/designDna';

// D3 — the empty-state treatment follows the app's design DNA
// (direction.emptyStateStyle), never per-screen taste:
//   icon-hero    → bare glyph (legacy look)
//   illustration → glyph inside a large tinted circle (friendly, illustrated feel)
//   photographic → glyph on a wide tinted banner (editorial, image-forward feel)
const EMPTY_STYLE = DESIGN_DNA.emptyStateStyle;

export interface EmptyStateProps {
  // P5 — accept an Ionicon NAME or a ready-made element; normalized at render.
  icon?: keyof typeof Ionicons.glyphMap | React.ReactNode;
  title: string;
  message?: string;
  /** Alias of 'message' — screens pass either; both render as the body line (P5). */
  description?: string;
  // TWO action-prop shapes accepted (whichever the LLM emits, renders an
  // action button). The nested form is canonical (mirrors ButtonProps);
  // the FLAT form is the LLM's most common idiom in mobile-ui-generator
  // recipes and was previously dropped silently — a confirmed blocker from
  // the 2026-06 E2E review where every prompt-emitted EmptyState shipped
  // with NO CTA button because of this prop-name divergence.
  //
  //   Canonical: <EmptyState action={{ title: 'Add', onPress: () => ... }} />
  //   Flat:      <EmptyState actionLabel="Add" onActionPress={() => ...} />
  //
  // Both resolve to the same Button render at the bottom of this component.
  action?: Pick<ButtonProps, 'title' | 'label' | 'onPress'>;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function EmptyState({
  icon = 'folder-open-outline',
  title,
  message,
  description,
  action,
  actionLabel,
  onActionPress,
}: EmptyStateProps) {
  const { colors, spacing } = useTheme();
  const body = message ?? description; // P5 — accept either prop name

  // Resolve action shape: nested form (action.title/onPress) wins if present,
  // otherwise fall back to the flat form (actionLabel/onActionPress). Either
  // way we end up with a single (label, onPress) pair the Button can render.
  const resolvedActionLabel: string | undefined =
    action?.title ?? action?.label ?? actionLabel;
  const resolvedActionPress: (() => void) | undefined =
    action?.onPress ?? onActionPress;
  const hasAction = !!resolvedActionLabel && !!resolvedActionPress;

  return (
    // Tighter outer padding (xl, was 2xl) — Apple Notes / iOS Mail empty
    // states aren't loose; they sit closer to center with deliberate
    // rhythm. Generous outer padding made the icon feel orphaned.
    <View style={[styles.container, { padding: spacing.xl }]}>
      {typeof icon === 'string' ? (
        EMPTY_STYLE === 'illustration' ? (
          // Tinted circle behind the glyph — '22' hex-alpha keeps it a wash of
          // the app's primary rather than a solid block.
          <View style={[styles.illustrationCircle, { backgroundColor: colors.primary + '22' }]}>
            <Ionicons name={icon} size={56} color={colors.primary} />
          </View>
        ) : EMPTY_STYLE === 'photographic' ? (
          <View style={[styles.photoBanner, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name={icon} size={56} color={colors.primary} />
          </View>
        ) : (
          <Ionicons name={icon} size={56} color={colors.textSecondary} />
        )
      ) : (
        icon
      )}
      {/* title3 = 20pt SemiBold — iOS HIG-correct empty-state title weight.
          Legacy h5 alias mapped to the same size but produced no visual
          difference; using the canonical name keeps the source readable. */}
      <Typography variant="title3" align="center" style={styles.title}>{title}</Typography>
      {body ? (
        // subhead = 15pt Regular -0.24 letter-spacing — iOS body for
        // descriptions under titles. Legacy body2 was the same size but
        // lacked the HIG letter-spacing.
        <Typography variant="subhead" color={colors.textSecondary} align="center" style={styles.message}>
          {body}
        </Typography>
      ) : null}
      {hasAction && (
        <Button
          title={resolvedActionLabel}
          onPress={resolvedActionPress as () => void}
          variant="primary"
          size="md"
          style={styles.button}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Tighter vertical rhythm — was 16/8/20, now 12/6/16. Matches Apple
  // Notes / iOS Settings empty-state spacing where elements sit closer
  // together as a single visual block.
  title: { marginTop: 12 },
  message: { marginTop: 6, lineHeight: 20 },
  button: { marginTop: 16 },
  // DNA empty-state treatments (see EMPTY_STYLE above).
  illustrationCircle: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoBanner: {
    alignSelf: 'stretch',
    paddingVertical: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});