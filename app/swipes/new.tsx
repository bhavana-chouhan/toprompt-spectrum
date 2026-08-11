import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { EnumPicker } from '@/components/ui/EnumPicker';
import { RelationPicker } from '@/components/ui/RelationPicker';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Avatar } from '@/components/ui/Avatar';

import { useSwipeStore } from '@/store/useSwipeStore';
import { useUserStore } from '@/store/useUserStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/spacing';

export default function SwipeFormScreen() {
  const { colors, fonts, spacing } = useTheme();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const swipes = useSwipeStore((s) => s.swipes);
  const addSwipe = useSwipeStore((s) => s.addSwipe);
  const updateSwipe = useSwipeStore((s) => s.updateSwipe);
  const storeLoading = useSwipeStore((s) => s.loading);

  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  const existing = isEditing ? (Array.isArray(swipes) ? swipes : []).find((x) => x._id === id) : undefined;

  const [title, setTitle] = useState('');
  const [profileSwiped, setProfileSwiped] = useState('');
  const [action, setAction] = useState<'like' | 'pass'>('like');
  const [submitting, setSubmitting] = useState(false);
  const [titleError, setTitleError] = useState('');
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? '');
      setProfileSwiped(existing.profileSwiped ?? '');
      setAction(existing.action ?? 'like');
    }
  }, [existing]);

  const resolvedUser = (Array.isArray(users) ? users : []).find((u) => u._id === profileSwiped);

  const validate = (): boolean => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Please enter a title for this swipe.');
      valid = false;
    } else {
      setTitleError('');
    }
    if (!profileSwiped) {
      setProfileError('Please select a profile to swipe on.');
      valid = false;
    } else {
      setProfileError('');
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    setSubmitting(true);
    try {
      if (isEditing && id) {
        await updateSwipe(id, { title: title.trim(), profileSwiped, action });
      } else {
        await addSwipe({ title: title.trim(), profileSwiped, action });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (_err) {
      // error handled by store
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const userOptions = (Array.isArray(users) ? users : []).map((u) => ({
    label: u.name ?? u.title ?? 'Unknown',
    value: u._id,
    subtitle: u.bio ?? undefined,
  }));

  return (
    <Screen
      scroll
      keyboardAvoiding
      padded={false}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/*  form-header  */}
      <AppHeader
        title={isEditing ? 'Edit Swipe' : 'New Swipe'}
        subtitle={isEditing ? 'Update this swipe record' : 'Record a swipe on a profile'}
        showBack
        onBack={handleCancel}
      />

      <View style={styles.container}>

        {/*  Swipe identity hero  */}
        <View style={[styles.heroRow, { marginBottom: Spacing['5xl'] }]}>
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: action === 'like' ? colors.primaryLight : colors.inputBackground,
                borderRadius: BorderRadius.lg,
              },
            ]}
          >
            <Ionicons
              name={action === 'like' ? 'heart' : 'close-circle'}
              size={32}
              color={action === 'like' ? colors.primary : colors.textMuted}
            />
          </View>
          <View style={styles.heroText}>
            <Typography variant="headline" style={{ fontFamily: fonts.heading, color: colors.text }}>
              {isEditing ? 'Edit swipe details' : 'Log a new swipe'}
            </Typography>
            <Typography variant="subhead" style={{ color: colors.textSecondary, marginTop: 2 }}>
              {action === 'like' ? 'Showing interest in a profile' : 'Passing on a profile'}
            </Typography>
          </View>
        </View>

        {/*  form-fields  */}
        <Card padded elevation="sm" style={styles.card}>
          <Typography
            variant="footnote"
            style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.body }]}
          >
            SWIPE DETAILS
          </Typography>

          <Input
            label="Swipe title"
            placeholder="e.g. Late-night discovery"
            value={title}
            onChangeText={(t) => {
              setTitle(t);
              if (titleError) setTitleError('');
            }}
            error={titleError || undefined}
            helperText={titleError ? undefined : 'A short label to identify this swipe record.'}
            icon="document-text-outline"
            style={styles.inputSpacing}
          />

          <View style={{ marginTop: Spacing.md }}>
            <RelationPicker
              label="Profile swiped"
              value={profileSwiped}
              onChange={(val: string) => {
                setProfileSwiped(val);
                if (profileError) setProfileError('');
              }}
              options={userOptions}
              placeholder="Select a profile"
              error={profileError || undefined}
            />
            {profileError ? (
              <Typography variant="caption1" style={{ color: colors.error, marginTop: Spacing.sm }}>
                {profileError}
              </Typography>
            ) : null}
          </View>

          {resolvedUser ? (
            <View
              style={[
                styles.resolvedUser,
                {
                  backgroundColor: colors.inputBackground,
                  borderRadius: BorderRadius.md,
                  marginTop: Spacing.sm,
                },
              ]}
            >
              <Avatar
                uri={resolvedUser.photos?.[0] ?? undefined}
                name={resolvedUser.name ?? resolvedUser.title}
                size={40}
              />
              <View style={styles.resolvedUserInfo}>
                <Typography variant="callout" style={{ color: colors.text, fontFamily: fonts.heading }}>
                  {resolvedUser.name ?? resolvedUser.title ?? 'Unknown'}
                </Typography>
                {resolvedUser.age != null ? (
                  <Typography variant="footnote" style={{ color: colors.textSecondary }}>
                    {`Age ${resolvedUser.age}`}
                    {resolvedUser.bio ? `  •  ${resolvedUser.bio}` : ''}
                  </Typography>
                ) : resolvedUser.bio ? (
                  <Typography variant="footnote" style={{ color: colors.textSecondary }}>
                    {resolvedUser.bio}
                  </Typography>
                ) : null}
              </View>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            </View>
          ) : null}
        </Card>

        <Card padded elevation="sm" style={styles.card}>
          <Typography
            variant="footnote"
            style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: fonts.body }]}
          >
            SWIPE DECISION
          </Typography>

          <EnumPicker
            label="Swipe action"
            options={['like', 'pass']}
            value={action}
            onChange={(val: string) => setAction(val as 'like' | 'pass')}
          />

          <View
            style={[
              styles.actionHint,
              {
                backgroundColor: action === 'like' ? colors.primaryLight : colors.inputBackground,
                borderRadius: BorderRadius.sm,
                marginTop: Spacing.sm,
              },
            ]}
          >
            <Ionicons
              name={action === 'like' ? 'heart-outline' : 'close-outline'}
              size={16}
              color={action === 'like' ? colors.primary : colors.textMuted}
            />
            <Typography
              variant="caption1"
              style={{
                color: action === 'like' ? colors.primary : colors.textMuted,
                marginLeft: Spacing.sm,
                flex: 1,
              }}
            >
              {action === 'like'
                ? "You're expressing interest in this profile."
                : "You're passing on this profile."}
            </Typography>
          </View>
        </Card>

        {/*  form-actions  */}
        <View style={[styles.actions, { marginTop: Spacing.lg }]}>
          <Button
            title={isEditing ? 'Save changes' : 'Add swipe'}
            onPress={handleSubmit}
            variant="primary"
            fullWidth
            loading={submitting}
            disabled={submitting || storeLoading}
          />
          <View style={{ height: Spacing.sm }} />
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            fullWidth
            disabled={submitting}
          />
        </View>

        <View style={{ height: Spacing['5xl'] }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroIcon: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
  },
  card: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  inputSpacing: {
    marginBottom: Spacing.sm,
  },
  resolvedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  resolvedUserInfo: {
    flex: 1,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  actions: {
    marginBottom: Spacing.base,
  },
});