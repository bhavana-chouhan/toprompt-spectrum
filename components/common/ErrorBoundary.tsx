import React, { type ErrorInfo, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';

const FallbackPalette = {
  background: '#151718',
  surface: '#1e2022',
  border: '#2d3134',
  text: '#ECEDEE',
  textSecondary: '#9BA1A6',
  primary: '#2563eb',
} as const;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
  copied: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null, copied: false };
  private copyResetTimer: ReturnType<typeof setTimeout> | null = null;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error, copied: false };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Surface the catch to console.error. The mobile error bridge
    // (auto-injected at app/_toprompt_error_bridge.ts) special-cases this
    // exact message prefix and converts it into a [TOPROMPT_FATAL] marker
    // with the React componentStack included, which the server-side
    // detector tail picks up from CloudWatch and surfaces to the chat
    // thread as an AutoFixErrorCard.
    console.error('Mobile ErrorBoundary caught an error:', error, errorInfo);
  }

  componentWillUnmount() {
    if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
  }

  private handleReset = () => {
    this.setState({ error: null, copied: false });
  };

  // Contract (PRO2-766): the copy control must never disappear after use.
  // It flips to "Copied!" for ~2s, reverts, and stays clickable throughout.
  private handleCopy = async () => {
    const err = this.state.error;
    if (!err) return;
    const details = [
      (err.name || 'Error') + ': ' + (err.message || 'Unknown error'),
      err.stack || '',
    ].filter(Boolean).join('\n\n');
    try {
      await Clipboard.setStringAsync(details);
      this.setState({ copied: true });
      if (this.copyResetTimer) clearTimeout(this.copyResetTimer);
      this.copyResetTimer = setTimeout(() => this.setState({ copied: false }), 2000);
    } catch {
      // Clipboard unavailable — leave the button usable rather than hiding it.
    }
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.root}>
        <View style={styles.card}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error.message || 'An unexpected mobile rendering error occurred.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={this.handleReset} style={styles.button}>
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={this.handleCopy} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>
              {this.state.copied ? 'Copied!' : 'Copy error info'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: FallbackPalette.background,
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: FallbackPalette.surface,
    borderColor: FallbackPalette.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    padding: 24,
  },
  title: {
    color: FallbackPalette.text,
    fontSize: 20,
    fontWeight: '700',
  },
  message: {
    color: FallbackPalette.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  button: {
    alignItems: 'center',
    backgroundColor: FallbackPalette.primary,
    borderRadius: 9999,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    alignItems: 'center',
    borderColor: FallbackPalette.border,
    borderRadius: 9999,
    borderWidth: 1,
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: FallbackPalette.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});