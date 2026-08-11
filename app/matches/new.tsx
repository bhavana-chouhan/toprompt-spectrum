import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RelationPicker } from '@/components/ui/RelationPicker';
import { Typography } from '@/components/ui/Typography';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DatePicker } from '@/components/ui/DatePicker';

import { useMatchStore } from '@/store/useMatchStore';
import { useUserStore } from '@/store/useUserStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';

export default function MatchFormScreen() {
  const { colors, fonts, spacing, borderRadius } = useTheme();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const addMatch = useMatchStore((s) => s.addMatch);
  const updateMatch = useMatchStore((s) => s.updateMatch);
  const getMatchById = useMatchStore((s) => s.getMatchById);
  const storeLoading = useMatchStore((s) => s.loading);

  const users = useUserStore((s) => s.users);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  const [title, setTitle] = useState('');
  const [user1, setUser1] = useState('');
  const [user2, setUser2] = useState('');
  const [createdAt, setCreatedAt] = useState(new Date());
  const [titleError, setTitleError] = useState('');
  const [user1Error, setUser1Error] = useState('');
  const [user2Error, setUser2Error] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (fetchUsers) await fetchUsers();
      setDataReady(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (isEditing && id && dataReady) {
      const existing = getMatchById(id);
      if (existing) {
        setTitle(existing.title ?? '');
        setUser1(existing.user1 ?? '');
        setUser2(existing.user2 ?? '');
        if (existing.createdAt) {
          const parsed = new Date(existing.createdAt);
          if (!isNaN(parsed.getTime())) setCreatedAt(parsed);
        }
      }
    }
  }, [isEditing, id, dataReady]);

  const userOptions = (Array.isArray(users) ? users : []).map((u) => ({
    _id: u._id,
    label: u.name ?? u.title ?? u._id,
    subtitle: u.bio ?? undefined,
  }));

  const validate = () => {
    let valid = true;
    if (!title.trim()) {
      setTitleError('Match title is required');
      valid = false;
    } else {
      setTitleError('');
    }
    if (!user1) {
      setUser1Error('First person is required');
      valid = false;
    } else {
      setUser1Error('');
    }
    if (!user2) {
      setUser2Error('Second person is required');
      valid = false;
    } else {
      setUser2Error('');
    }
    if (user1 && user2 && user1 === user2) {
      setUser2Error('Please select two different people');
      valid = false;
    }
    return valid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        user1,
        user2,
        createdAt: createdAt.toISOString(),
      };
      if (isEditing && id) {
        await updateMatch(id, payload);
      } else {
        await addMatch(payload);
      }
      router.back();
    } catch {
      // error handled by store
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!dataReady || (isEditing && storeLoading)) {
    return (
      <Screen scroll={false} padded={false}>
        <AppHeader
          title={isEditing ? 'Edit Match' : 'New Match'}
          showBack
          onBack={handleCancel}
        />
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="lg" />
          <Typography
            variant="callout"
            style={{ color: colors.textSecondary, marginTop: spacing.md, fontFamily: fonts.body }}
          >
            {'Just a sec\u2026'}
          </Typography>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      keyboardAvoiding
      padded={false}
      edges={['top', 'bottom', 'left', 'right']}
    >
      {/* form-header */}
      <AppHeader
        title={isEditing ? 'Edit Match' : 'New Match'}
        subtitle={isEditing ? 'Update this connection' : 'Connect two people'}
        showBack
        onBack={handleCancel}
        large
      />

      {/* hero subheading */}
      <View
        style={[
          styles.heroStrip,
          {
            backgroundColor: colors.surface,
            borderLeftColor: colors.accent,
            marginHorizontal: spacing.base,
            borderRadius: borderRadius.md,
          },
        ]}
      >
        <Ionicons name="heart" size={22} color={colors.accent} style={styles.heroIcon} />
        <Typography
          variant="callout"
          style={{ fontFamily: fonts.body, color: colors.textSecondary, flex: 1 }}
        >
          {isEditing
            ? 'Update the name or people involved in this match.'
            : 'Start by naming your match and choosing the two people to connect.'}
        </Typography>
      </View>

      {/* form-fields */}
      <View style={styles.formBody}>
        {/* Match Details card */}
        <Card padded elevated style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={18} color={colors.accent} />
            <Typography
              variant="headline"
              style={{
                fontFamily: fonts.heading,
                color: colors.primary,
                marginLeft: spacing.sm,
              }}
            >
              {'Match Details'}
            </Typography>
          </View>

          <View style={styles.inputSpacing}>
            <Input
              label="Match Title"
              value={title}
              onChangeText={(t) => {
                setTitle(t);
                if (t.trim()) setTitleError('');
              }}
              placeholder="Give this match a name"
              error={titleError || undefined}
              helperText={titleError ? undefined : 'A short label for this connection'}
              icon="heart-outline"
            />
          </View>

          <View style={styles.inputSpacing}>
            <DatePicker
              label="Match Date"
              value={createdAt}
              onChange={setCreatedAt}
            />
          </View>
        </Card>

        {/* People card */}
        <Card padded elevated style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people-outline" size={18} color={colors.accent} />
            <Typography
              variant="headline"
              style={{
                fontFamily: fonts.heading,
                color: colors.primary,
                marginLeft: spacing.sm,
              }}
            >
              {'People in This Match'}
            </Typography>
          </View>

          <View style={styles.inputSpacing}>
            <RelationPicker
              label="First Person"
              options={userOptions}
              value={user1}
              onChange={(val) => {
                setUser1(val);
                if (val) setUser1Error('');
              }}
              placeholder="Select the first person"
              error={user1Error || undefined}
            />
          </View>

          <View
            style={[
              styles.connectorRow,
              { backgroundColor: colors.primaryLight ?? colors.border, borderRadius: borderRadius.sm },
            ]}
          >
            <Ionicons name="swap-vertical-outline" size={16} color={colors.primary} />
            <Typography
              variant="caption1"
              style={{ fontFamily: fonts.body, color: colors.primary, marginLeft: spacing.sm }}
            >
              {'matched with'}
            </Typography>
          </View>

          <View style={styles.inputSpacing}>
            <RelationPicker
              label="Second Person"
              options={userOptions}
              value={user2}
              onChange={(val) => {
                setUser2(val);
                if (val) setUser2Error('');
              }}
              placeholder="Select the second person"
              error={user2Error || undefined}
            />
          </View>
        </Card>
      </View>

      {/* form-actions */}
      <View
        style={[
          styles.actions,
          {
            paddingHorizontal: spacing.base,
            paddingTop: spacing.md,
            paddingBottom: spacing.xl,
            borderTopColor: colors.divider,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Button
          title={isEditing ? 'Save changes' : 'Add match'}
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting}
          variant="primary"
          fullWidth
        />
        <View style={styles.cancelGap} />
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="ghost"
          fullWidth
          disabled={submitting}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing['4xl'],
  },
  heroStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heroIcon: {
    marginRight: Spacing.sm,
  },
  formBody: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.md,
  },
  card: {
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  inputSpacing: {
    marginBottom: Spacing.md,
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelGap: {
    height: Spacing.sm,
  },
});