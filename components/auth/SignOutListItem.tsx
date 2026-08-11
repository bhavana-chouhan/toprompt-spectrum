import React from 'react';
import { Pressable, View, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/hooks/useTheme';
import { Icon } from '@/components/ui/Icon';
import { Typography } from '@/components/ui/Typography';
import { Spacing } from '@/constants/spacing';
import { LIST_ROW_HEIGHT } from '@/constants/touchTarget';
import { logout } from '@/services/auth';

/**
 * Drop-in Sign Out row for the Profile/Settings screen.
 *
 * Usage (in your settings screen, when contract.menuItems contains a sign-out
 * action). BOTH import styles work — this component is exported as a named
 * AND a default export, so the LLM can use either without crashing:
 *   import { SignOutListItem } from '@/components/auth/SignOutListItem';   // named
 *   import SignOutListItem from '@/components/auth/SignOutListItem';       // default
 *   ...
 *   <SignOutListItem />
 *
 * Why deterministic: previous prompts hardcoded a Button with title="Sign Out"
 * in their example, which the LLM sometimes copied as <Button onPress={...} />
 * without the title prop, leaving the button label empty. By baking the
 * label/icon/style/handler into a single component, the LLM cannot drop the
 * label.
 *
 * Why dual-export: the screen LLM frequently writes a DEFAULT import
 * (`import SignOutListItem from ...`) for this file. With a named-only export
 * that resolves to `undefined`, producing the "Element type is invalid …
 * got: undefined … you might have mixed up default and named imports" crash on
 * the Profile/Settings screen every generation. Exporting both styles makes
 * the import direction irrelevant.
 */
export function SignOutListItem() {
  const { colors } = useTheme();
  const onPress = async () => {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Haptics may be unavailable on web/some emulators; ignore.
    }
    await logout();
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Sign Out"
      style={({ pressed }) => [
        styles.row,
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.iconWrap}>
        <Icon name="log-out-outline" size={22} color={colors.error} />
      </View>
      <Typography variant="body" color={colors.error} style={styles.label}>
        Sign Out
      </Typography>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: LIST_ROW_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  label: {
    fontWeight: '600',
  },
});

// Dual-export: screens import this as EITHER a named or a default import.
// Keeping both prevents the "Element type is invalid … got: undefined …
// mixed up default and named imports" crash on Profile/Settings.
export default SignOutListItem;
