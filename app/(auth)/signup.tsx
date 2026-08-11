import { useState, useRef } from 'react';
import { Pressable, StyleSheet, View, TextInput as RNTextInput } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Typography } from '@/components/ui/Typography';
import { signup } from '@/services/auth';
import { Spacing, SCREEN_PADDING } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

/**
 * GENERATED DETERMINISTICALLY by generate-mobile-auth-screens.ts (Fix 3).
 *
 * Same rule as login.tsx: this screen NEVER calls router.replace after
 * successful signup. The signup() helper flips useAuthStore.status, the
 * root layout redirects.
 */
export default function SignupScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const emailRef = useRef<RNTextInput>(null);
  const passwordRef = useRef<RNTextInput>(null);
  const confirmRef = useRef<RNTextInput>(null);

  const validate = (): boolean => {
    let valid = true;
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmError('');
    setServerError(null);

    if (!name.trim()) {
      setNameError('Name is required');
      valid = false;
    }
    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address');
      valid = false;
    }
    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      valid = false;
    }

    if (!valid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const result = await signup(name.trim(), email.trim(), password);
      if (!result.success) {
        setServerError(result.error || 'Unable to create your account right now.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
      // Success: useAuthStore.status flipped inside signup(). Root layout
      // handles the redirect via segment effect. DO NOT navigate here.
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      setServerError((err instanceof Error ? err.message : null) || 'Something went wrong.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen scroll keyboardAvoiding padded={false}>
      <View style={styles.wrapper}>
        <LinearGradient
          colors={[
            colors.primary,
            colors.secondary ?? colors.primary,
            (colors as { accent?: string }).accent ?? colors.secondary ?? colors.primary,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.hero, styles.heroCompact, { paddingTop: insets.top + Spacing.xl }]}
        >
          <View style={styles.heroDecorOuter} pointerEvents="none">
            <View style={[styles.heroDecorRing, { borderColor: 'rgba(255,255,255,0.10)' }]} />
            <View style={[styles.heroDecorRingInner, { borderColor: 'rgba(255,255,255,0.18)' }]} />
          </View>
          <View style={styles.heroDecorOuterLeft} pointerEvents="none">
            <View style={[styles.heroDecorRingSmall, { borderColor: 'rgba(255,255,255,0.08)' }]} />
          </View>
          <View style={styles.brandIconCluster}>
            <View style={styles.iconGlow} pointerEvents="none" />
            <View style={[styles.brandIconWrap, { backgroundColor: 'rgba(255,255,255,0.20)' }]}>
              <Ionicons name="people-outline" size={36} color={colors.background ?? '#fff'} />
            </View>
          </View>
          <Typography
            variant="largeTitle"
            color={colors.background ?? '#fff'}
            align="center"
            style={styles.heroTitle}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
          >
            Spectrum
          </Typography>
          <Typography variant="subhead" color="rgba(255,255,255,0.85)" align="center" style={styles.heroSubhead}>
            Find your people
          </Typography>
        </LinearGradient>

        <View style={styles.formArea}>
          <Card elevation="lg" style={styles.formCard}>
            <View style={styles.form}>
              <Input
                label="Full name"
                placeholder="Your name"
                value={name}
                onChangeText={(v) => {
                  setName(v);
                  if (nameError) setNameError('');
                  if (serverError) setServerError(null);
                }}
                error={nameError}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
                icon={<Ionicons name="person-outline" size={20} color={colors.textSecondary} />}
                onSubmitEditing={() => emailRef.current?.focus()}
              />
              <Input
                ref={emailRef}
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError('');
                  if (serverError) setServerError(null);
                }}
                error={emailError}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                returnKeyType="next"
                icon={<Ionicons name="mail-outline" size={20} color={colors.textSecondary} />}
                onSubmitEditing={() => passwordRef.current?.focus()}
              />
              <Input
                ref={passwordRef}
                label="Password"
                placeholder="Min. 6 characters"
                value={password}
                onChangeText={(v) => {
                  setPassword(v);
                  if (passwordError) setPasswordError('');
                  if (serverError) setServerError(null);
                }}
                error={passwordError}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="next"
                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                onSubmitEditing={() => confirmRef.current?.focus()}
              />
              <Input
                ref={confirmRef}
                label="Confirm password"
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (confirmError) setConfirmError('');
                  if (serverError) setServerError(null);
                }}
                error={confirmError}
                secureTextEntry
                autoComplete="new-password"
                returnKeyType="done"
                icon={<Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />}
                onSubmitEditing={handleSubmit}
              />
              {serverError ? (
                <Typography variant="caption1" color={colors.error ?? '#cf222e'} align="center">
                  {serverError}
                </Typography>
              ) : null}
              <Button
                title="Create account"
                onPress={handleSubmit}
                loading={submitting}
                variant="primary"
                size="lg"
                fullWidth
              />
            </View>
          </Card>

          <View style={styles.footerRow}>
            <Typography variant="subhead" color={colors.textSecondary}>
              {"Already have an account? "}
            </Typography>
            <Pressable
              onPress={() => router.push('/(auth)/login')}
              hitSlop={Spacing.sm}
              style={({ pressed }) => [pressed && { opacity: 0.7 }]}
            >
              <Typography variant="subhead" color={colors.primary}>
                Sign in
              </Typography>
            </Pressable>
          </View>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  hero: {
    paddingBottom: 44,
    paddingHorizontal: Spacing.xl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    gap: Spacing.sm,
    alignItems: 'center',
    overflow: 'hidden',
    minHeight: 220,
    justifyContent: 'center',
  },
  heroCompact: {
    minHeight: 220,
    paddingBottom: 44,
  },
  heroDecorOuter: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 240,
    height: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDecorOuterLeft: {
    position: 'absolute',
    bottom: -40,
    left: -50,
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDecorRing: {
    width: 240,
    height: 240,
    borderRadius: 120,
    borderWidth: 1,
    position: 'absolute',
  },
  heroDecorRingInner: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    position: 'absolute',
  },
  heroDecorRingSmall: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    position: 'absolute',
  },
  brandIconCluster: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    width: 96,
    height: 96,
  },
  iconGlow: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  brandIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  heroTitle: {
    fontWeight: '700',
    zIndex: 1,
    // PRO2-446: the app name must stay on ONE line on every device.
    // React Native honours the OS font-scale setting, and Samsung One UI
    // ships a larger default display size than stock Android or iOS — at
    // largeTitle (34-40pt) even a 6-character name wrapped mid-word there
    // ("Verif" / "y") while rendering fine on iOS and Motorola.
    // numberOfLines={1} + adjustsFontSizeToFit (set on the element) shrink
    // the text to fit instead of wrapping; this width cap gives it room to
    // shrink into rather than fighting the hero's padding.
    alignSelf: 'stretch',
    paddingHorizontal: Spacing.md,
  },
  heroSubhead: {
    marginTop: 2,
    zIndex: 1,
  },
  heroCaption: {
    marginTop: 4,
    zIndex: 1,
  },
  formArea: {
    gap: Spacing.md,
    paddingHorizontal: SCREEN_PADDING,
    paddingBottom: Spacing.xl,
    marginTop: -36,
  },
  formCard: {
    padding: Spacing.lg,
  },
  form: {
    gap: Spacing.base,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginTop: -Spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
});
