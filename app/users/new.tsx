import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Typography } from '@/components/ui/Typography';
import { ImageField } from '@/components/ui/ImageField';
import { Card } from '@/components/ui/Card';
import { useUserStore } from '@/store/useUserStore';

export default function UserFormScreen() {
  const { colors, fonts, spacing, borderRadius } = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = Boolean(id);

  const getUserById = useUserStore((s) => s.getUserById);
  const addUser = useUserStore((s) => s.addUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const loading = useUserStore((s) => s.loading);

  const existing = id ? getUserById(id) : undefined;

  const [title, setTitle] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [age, setAge] = useState('');
  const [primaryPhoto, setPrimaryPhoto] = useState('');
  const [secondaryPhoto, setSecondaryPhoto] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (existing) {
      setTitle(existing.title ?? '');
      setName(existing.name ?? '');
      setBio(existing.bio ?? '');
      setAge(existing.age !== undefined ? String(existing.age) : '');
      setPrimaryPhoto(existing.photos?.[0] ?? '');
      setSecondaryPhoto(existing.photos?.[1] ?? '');
    }
  }, [existing]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required.';
    if (!title.trim()) newErrors.title = 'Title is required.';
    if (age && (isNaN(Number(age)) || Number(age) < 18 || Number(age) > 120)) {
      newErrors.age = 'Enter a valid age (18-120).';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const photos: string[] = [];
      if (primaryPhoto) photos.push(primaryPhoto);
      if (secondaryPhoto) photos.push(secondaryPhoto);

      const payload = {
        title: title.trim(),
        name: name.trim(),
        bio: bio.trim() || undefined,
        age: age ? Number(age) : undefined,
        photos,
      };

      if (isEditing && id) {
        await updateUser(id, payload);
      } else {
        await addUser(payload);
      }
      router.back();
    } catch {
      setErrors({ submit: 'Whoops, that didn\'t quite work. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Screen scroll keyboardAvoiding padded={false} edges={['top', 'bottom']}>
      {/* form-header */}
      <AppHeader
        title={isEditing ? 'Edit Profile' : 'New Profile'}
        subtitle={isEditing ? 'Update your details' : 'Tell the world who you are'}
        showBack
        onBack={handleCancel}
        large
      />

      <View style={styles.container}>
        {/* form-fields */}
        <Card padded elevated style={styles.section}>
          <Typography variant="headline" style={[styles.sectionHeading, { color: colors.text, fontFamily: fonts.heading }]}>
            Basic Info
          </Typography>

          <View style={styles.fieldGroup}>
            <Input
              label="Display Name"
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              autoCapitalize="words"
              error={errors.name}
              icon="person-outline"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Input
              label="Headline"
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Adventurer, Foodie, Dog Lover"
              autoCapitalize="sentences"
              error={errors.title}
              icon="create-outline"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Input
              label="About Me"
              value={bio}
              onChangeText={setBio}
              placeholder="Write a short bio that shows off your personality..."
              multiline
              numberOfLines={4}
              autoCapitalize="sentences"
              icon="document-text-outline"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Input
              label="Age"
              value={age}
              onChangeText={setAge}
              placeholder="e.g. 28"
              keyboardType="number-pad"
              error={errors.age}
              icon="calendar-outline"
            />
          </View>
        </Card>

        <Card padded elevated style={styles.section}>
          <Typography variant="headline" style={[styles.sectionHeading, { color: colors.text, fontFamily: fonts.heading }]}>
            Photos
          </Typography>

          <Typography variant="subhead" style={[styles.photoHint, { color: colors.textSecondary, fontFamily: fonts.body }]}>
            Add up to two photos. Your first photo is your main profile picture.
          </Typography>

          <View style={styles.photoRow}>
            <View style={styles.photoSlot}>
              <ImageField
                label="Main photo"
                value={primaryPhoto}
                onChange={setPrimaryPhoto}
              />
            </View>
            <View style={styles.photoSlot}>
              <ImageField
                label="Second photo"
                value={secondaryPhoto}
                onChange={setSecondaryPhoto}
              />
            </View>
          </View>
        </Card>

        {errors.submit ? (
          <View style={[styles.errorBanner, { backgroundColor: colors.error + '18', borderColor: colors.error, borderRadius: borderRadius.md }]}>
            <Ionicons name="close-circle-outline" size={18} color={colors.error} />
            <Typography variant="footnote" style={[styles.errorText, { color: colors.error, fontFamily: fonts.body }]}>
              {errors.submit}
            </Typography>
          </View>
        ) : null}

        {/* form-actions */}
        <View style={styles.actions}>
          <Button
            title={isEditing ? 'Save changes' : 'Create profile'}
            onPress={handleSubmit}
            loading={submitting || loading}
            disabled={submitting || loading}
            variant="primary"
            fullWidth
          />
          <View style={styles.cancelGap} />
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="ghost"
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.md,
  },
  section: {
    marginBottom: Spacing.sm,
  },
  sectionHeading: {
    marginBottom: Spacing.base,
  },
  fieldGroup: {
    marginBottom: Spacing.md,
  },
  photoHint: {
    marginBottom: Spacing.base,
  },
  photoRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  photoSlot: {
    flex: 1,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  errorText: {
    flex: 1,
  },
  actions: {
    marginTop: Spacing.sm,
    paddingBottom: Spacing.xl,
  },
  cancelGap: {
    height: Spacing.sm,
  },
});