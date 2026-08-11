import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Typography } from '@/components/ui/Typography';
import { RetryButton } from '@/components/ui/RetryButton';
import { useTheme } from '@/hooks/useTheme';

/**
 * Canonical error-message taxonomy. Phase 2 fetch helpers in services/api.ts
 * throw ApiError instances tagged with one of these reasons; screens hand the
 * tag to ErrorState which renders the matching human copy. Mapping is owned
 * here so screens never invent their own (inconsistent) error messages.
 */
export type ErrorReason = 'offline' | 'timeout' | 'server' | 'forbidden' | 'notFound' | 'unknown';

const REASON_COPY: Record<ErrorReason, { title: string; message: string; icon: keyof typeof Ionicons.glyphMap }> = {
  offline:   { title: "You're offline",       message: 'Reconnect to load this content.',                icon: 'cloud-offline-outline' },
  timeout:   { title: 'Taking longer than expected', message: 'The server is slow to respond. Try again in a moment.', icon: 'time-outline' },
  server:    { title: 'Something went wrong', message: 'Our servers had a hiccup. Please try again.',    icon: 'alert-circle-outline' },
  forbidden: { title: 'Access denied',        message: "You don't have permission to view this.",        icon: 'lock-closed-outline' },
  notFound:  { title: 'Not found',            message: "We couldn't find what you were looking for.",    icon: 'help-circle-outline' },
  unknown:   { title: 'Something went wrong', message: 'Try again, or come back in a moment.',           icon: 'alert-circle-outline' },
};

export interface ErrorStateProps {
  /**
   * Optional explicit reason; if omitted the component renders the
   * 'unknown' fallback (safe default that never blames the user).
   */
  reason?: ErrorReason;
  /** Override the default headline (e.g. "Couldn't load your feed"). */
  title?: string;
  /** Override the default body copy. */
  message?: string;
  /**
   * Retry callback. When provided, a RetryButton renders below the message.
   * Omit to show a non-recoverable error (rare — most errors should be
   * retryable).
   */
  onRetry?: () => void;
  /** Disable the retry button while a retry is in flight. */
  retrying?: boolean;
}

/**
 * Canonical full-screen error state. Always wired to a recovery path via
 * RetryButton when onRetry is provided. Use this in place of inline
 * <Text>Error: {err.message}</Text> patterns — never surface raw error
 * strings to users.
 */
export function ErrorState({ reason = 'unknown', title, message, onRetry, retrying = false }: ErrorStateProps) {
  const { colors, spacing } = useTheme();
  const copy = REASON_COPY[reason] ?? REASON_COPY.unknown;
  return (
    <View style={[styles.container, { padding: spacing.xl }]}>
      <Ionicons name={copy.icon} size={56} color={colors.textSecondary} />
      <Typography variant="title3" align="center" style={styles.title}>{title ?? copy.title}</Typography>
      <Typography variant="subhead" color={colors.textSecondary} align="center" style={styles.message}>
        {message ?? copy.message}
      </Typography>
      {onRetry ? (
        <View style={styles.action}>
          <RetryButton onPress={onRetry} loading={retrying} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title:   { marginTop: 12 },
  message: { marginTop: 6, lineHeight: 20 },
  action:  { marginTop: 16 },
});