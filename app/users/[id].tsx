import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@/store/useUserStore';
import { useTheme } from '@/hooks/useTheme';
import { Spacing, BorderRadius } from '@/constants/spacing';
import { Elevation } from '@/constants/elevation';
import { Screen } from '@/components/ui/Screen';
import { Typography } from '@/components/ui/Typography';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AppHeader } from '@/components/ui/AppHeader';

export default function UserDetailScreen() {
  const { colors, fonts, spacing, borderRadius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const users = useUserStore((s) => s.users);
  const loading = useUserStore((s) => s.loading);
  const error = useUserStore((s) => s.error);
  const fetchUsers = useUserStore((s) => s.fetchUsers);

  useEffect(() => {
    fetchUsers();
  }, []);

  const user = (Array.isArray(users) ? users : []).find((u) => u._id === id);

  const photos = user?.photos ?? [];
  const heroPhoto = photos.length > 0 ? photos[0] : null;
  const extraPhotos = photos.length > 1 ? photos.slice(1) : [];
  const photosCount = photos.length;

  const ageLabel = user?.age != null ? String(user.age) : null;
  const bioText = user?.bio ?? null;
  const titleLabel = user?.title ?? null;
  const nameLabel = user?.name ?? 'Unknown';

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  if (loading) {
    return (
      <Screen scroll={false}>
        <AppHeader title="Profile" showBack onBack={() => router.back()} />
        <View style={styles.centered}>
          <Typography variant="body" style={{ color: colors.textSecondary, marginTop: Spacing.md }}>
            Just a sec…
          </Typography>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen scroll={false}>
        <AppHeader title="Profile" showBack onBack={() => router.back()} />
        <View style={styles.centered}>
          <Ionicons name="close-circle" size={48} color={colors.error} />
          <Typography
            variant="headline"
            style={{ color: colors.text, marginTop: Spacing.md, textAlign: 'center' }}
          >
            {"Whoops, that didn't quite work"}
          </Typography>
          <Typography
            variant="body"
            style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}
          >
            {"We couldn't load this profile. Please try again."}
          </Typography>
          <Button
            title="Try again"
            onPress={() => fetchUsers()}
            variant="primary"
            style={{ marginTop: Spacing.lg }}
          />
        </View>
      </Screen>
    );
  }

  if (!user) {
    return (
      <Screen scroll={false}>
        <AppHeader title="Profile" showBack onBack={() => router.back()} />
        <View style={styles.centered}>
          <EmptyState
            title="No profile here"
            description={"This profile doesn't exist or may have been removed. Explore more people nearby."}
            icon="person-circle-outline"
            action={{ title: 'Go back', onPress: () => router.back() }}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppHeader
        title=""
        showBack
        onBack={() => router.back()}
        rightElement={
          <Pressable
            onPress={() => router.push('/users/new?id=' + user._id)}
            style={styles.editBtn}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </Pressable>
        }
      />

      {/* SECTION 1: detail-hero */}
      <View style={styles.heroContainer}>
        {heroPhoto ? (
          <Image
            source={{ uri: heroPhoto }}
            style={styles.heroImage}
            contentFit="cover"
          />
        ) : (
          <View
            style={[
              styles.heroImageFallback,
              { backgroundColor: colors.primaryLight ?? colors.primary },
            ]}
          >
            <Ionicons name="person" size={72} color={colors.textInverse} />
          </View>
        )}

        <View style={styles.heroOverlay}>
          <View style={[styles.heroGradient, { backgroundColor: colors.text + 'CC' }]}>
            <Typography
              variant="largeTitle"
              style={[styles.heroName, { color: colors.textInverse, fontFamily: fonts.heading }]}
            >
              {nameLabel}
              {ageLabel ? `, ${ageLabel}` : ''}
            </Typography>
            {titleLabel ? (
              <Typography
                variant="subhead"
                style={{ color: colors.textInverse + 'BB', fontFamily: fonts.body }}
              >
                {titleLabel}
              </Typography>
            ) : null}
          </View>
        </View>
      </View>

      {/* SECTION 2: detail-meta */}
      <View style={[styles.metaSection, { backgroundColor: colors.surface }]}>
        <View style={styles.metaRow}>
          {ageLabel ? (
            <View style={[styles.chip, { backgroundColor: colors.primaryLight ?? colors.primary + '22' }]}>
              <Ionicons name="person-outline" size={14} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.primary }]}>{`Age ${ageLabel}`}</Text>
            </View>
          ) : null}
          {joinedDate ? (
            <View style={[styles.chip, { backgroundColor: colors.primaryLight ?? colors.primary + '22' }]}>
              <Ionicons name="calendar-outline" size={14} color={colors.primary} />
              <Text style={[styles.chipText, { color: colors.primary }]}>{`Joined ${joinedDate}`}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.statRow, { borderTopColor: colors.divider }]}>
          <View style={styles.statItem}>
            <Typography
              variant="title2"
              style={{ color: colors.primary, fontFamily: fonts.heading }}
            >
              {String(photosCount)}
            </Typography>
            <Typography variant="caption1" style={{ color: colors.textSecondary }}>
              Photos
            </Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Typography
              variant="title2"
              style={{ color: colors.secondary, fontFamily: fonts.heading }}
            >
              {ageLabel ?? '—'}
            </Typography>
            <Typography variant="caption1" style={{ color: colors.textSecondary }}>
              Age
            </Typography>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.divider }]} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={24} color={colors.success} />
            <Typography variant="caption1" style={{ color: colors.textSecondary }}>
              Verified
            </Typography>
          </View>
        </View>
      </View>

      {/* SECTION 3: detail-body */}
      <View style={[styles.bodySection, { paddingHorizontal: Spacing.base }]}>
        {bioText ? (
          <Card padded elevation style={styles.bioCard}>
            <View style={styles.bioHeader}>
              <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
              <Typography
                variant="headline"
                style={[
                  styles.bioTitle,
                  { color: colors.text, fontFamily: fonts.heading, marginLeft: Spacing.sm },
                ]}
              >
                About
              </Typography>
            </View>
            <Typography
              variant="body"
              style={{ color: colors.textSecondary, lineHeight: 22, marginTop: Spacing.sm }}
            >
              {bioText}
            </Typography>
          </Card>
        ) : (
          <Card padded elevation style={styles.bioCard}>
            <View style={styles.bioHeader}>
              <Ionicons name="person-circle-outline" size={20} color={colors.textMuted} />
              <Typography
                variant="headline"
                style={[
                  styles.bioTitle,
                  { color: colors.textMuted, fontFamily: fonts.heading, marginLeft: Spacing.sm },
                ]}
              >
                About
              </Typography>
            </View>
            <Typography variant="body" style={{ color: colors.textMuted, marginTop: Spacing.sm }}>
              No bio yet.
            </Typography>
          </Card>
        )}

        {extraPhotos.length > 0 ? (
          <View style={[styles.gallerySection, { marginTop: Spacing.lg }]}>
            <Typography
              variant="headline"
              style={{
                color: colors.text,
                fontFamily: fonts.heading,
                marginBottom: Spacing.md,
              }}
            >
              More Photos
            </Typography>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {(Array.isArray(extraPhotos) ? extraPhotos : []).map((photoUri, index) => {
                const safeUri = photoUri ?? '';
                return (
                  <View
                    key={`photo-${index}`}
                    style={[styles.galleryThumb, { marginRight: Spacing.sm }]}
                  >
                    <Image
                      source={{ uri: safeUri }}
                      style={[
                        styles.galleryImage,
                        {
                          borderRadius: BorderRadius.md,
                          backgroundColor: colors.border,
                        },
                      ]}
                      contentFit="cover"
                    />
                  </View>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* SECTION 4: detail-actions */}
      <View
        style={[
          styles.actionsSection,
          {
            paddingHorizontal: Spacing.base,
            paddingBottom: Spacing['5xl'],
            marginTop: Spacing.xl,
          },
        ]}
      >
        <View style={styles.actionRow}>
          <Pressable
            style={[
              styles.actionCircle,
              {
                backgroundColor: colors.surface,
                borderColor: colors.error,
                borderRadius: BorderRadius.xl ?? 9999,
                ...Elevation.sm,
              },
            ]}
            onPress={() =>
              router.push('/swipes/new?userId=' + user._id + '&direction=left')
            }
          >
            <Ionicons name="close" size={30} color={colors.error} />
          </Pressable>

          <Pressable
            style={[
              styles.actionCirclePrimary,
              {
                backgroundColor: colors.primary,
                borderRadius: BorderRadius.xl ?? 9999,
                ...Elevation.md,
              },
            ]}
            onPress={() =>
              router.push('/swipes/new?userId=' + user._id + '&direction=right')
            }
          >
            <Ionicons name="heart" size={34} color={colors.textInverse} />
          </Pressable>

          <Pressable
            style={[
              styles.actionCircle,
              {
                backgroundColor: colors.surface,
                borderColor: colors.accent,
                borderRadius: BorderRadius.xl ?? 9999,
                ...Elevation.sm,
              },
            ]}
            onPress={() => router.push('/matches/new?userId=' + user._id)}
          >
            <Ionicons name="star" size={26} color={colors.accent} />
          </Pressable>
        </View>

        <View style={[styles.messageRow, { marginTop: Spacing.lg }]}>
          <Button
            title="Send a message"
            onPress={() => router.push('/matches/new?userId=' + user._id)}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  heroContainer: {
    width: '100%',
    aspectRatio: 4 / 5,
    position: 'relative',
    maxHeight: 480,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageFallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  heroGradient: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.base,
  },
  heroName: {
    fontSize: 28,
    fontWeight: '700',
  },
  editBtn: {
    padding: Spacing.sm,
  },
  metaSection: {
    paddingTop: Spacing.base,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  statItem: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  bodySection: {
    marginTop: Spacing.base,
  },
  bioCard: {
    marginBottom: Spacing.sm,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioTitle: {
    fontSize: 16,
  },
  gallerySection: {
    marginBottom: Spacing.sm,
  },
  galleryThumb: {
    width: 140,
    height: 186,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
  },
  actionsSection: {
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  actionCircle: {
    width: 60,
    height: 60,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCirclePrimary: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageRow: {
    width: '100%',
  },
});