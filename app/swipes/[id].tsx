import React, { useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import {
  Screen,
  AppHeader,
  Typography,
  Card,
  Button,
  EmptyState,
  LoadingSpinner,
  Avatar,
} from '@/components/ui';
import { useSwipeStore } from '@/store/useSwipeStore';
import { useUserStore } from '@/store/useUserStore';

export default function SwipeDetailScreen() {
  const { colors, fonts, spacing, borderRadius } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  const loading = useSwipeStore((s) => s.loading);
  const error = useSwipeStore((s) => s.error);
  const fetchSwipes = useSwipeStore((s) => s.fetchSwipes);
  const getSwipeById = useSwipeStore((s) => s.getSwipeById);
  const deleteSwipe = useSwipeStore((s) => s.deleteSwipe);

  const users = useUserStore((s) => s.users);

  useEffect(() => {
    fetchSwipes();
  }, []);

  const swipe = getSwipeById ? getSwipeById(id) : undefined;
  const user = swipe ? users?.find((u) => u._id === swipe.profileSwiped) : undefined;

  const isLike = swipe?.action === 'like';

  const formattedDate = swipe?.createdAt
    ? new Date(swipe.createdAt).toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const formattedUpdated = swipe?.updatedAt
    ? new Date(swipe.updatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const userName = user?.name ?? user?.title ?? null;
  const userAge = user?.age ?? null;
  const userBio = user?.bio ?? null;
  const userPhoto =
    Array.isArray(user?.photos) && user.photos.length > 0 ? user.photos[0] : null;

  function handleEdit() {
    router.push('/swipes/new?id=' + id);
  }

  function handleDelete() {
    Alert.alert(
      'Remove this swipe?',
      "This action cannot be undone. The swipe will be permanently removed from your history.",
      [
        { text: 'Keep it', style: 'cancel' },
        {
          text: 'Remove swipe',
          style: 'destructive',
          onPress: async () => {
            await deleteSwipe(id);
            router.back();
          },
        },
      ],
    );
  }

  function handleViewProfile() {
    if (user?._id) {
      router.push('/users/' + user._id);
    }
  }

  function handleSendMessage() {
    router.push('/matches');
  }

  const headerTitle = userName ?? (isLike ? 'Your Like' : 'Your Pass');

  if (loading) {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        <AppHeader title="Your Swipe" showBack onBack={() => router.back()} />
        <View style={styles.centerContainer}>
          <LoadingSpinner />
          <Typography
            variant="body"
            style={{ color: colors.textSecondary, marginTop: spacing.md }}
          >
            Just a sec…
          </Typography>
        </View>
      </Screen>
    );
  }

  if (error || !swipe || !user) {
    return (
      <Screen scroll={false} edges={['top', 'bottom']}>
        <AppHeader title="Your Swipe" showBack onBack={() => router.back()} />
        <EmptyState
          title={
            !swipe && !loading
              ? "This swipe has vanished"
              : "Something went sideways"
          }
          description={
            !swipe && !loading
              ? "We couldn't find this swipe in your history. It may have been removed."
              : "Something went wrong loading this swipe. Pull back and try again."
          }
          icon="heart-dislike-outline"
          action={{ title: 'Go back', onPress: () => router.back() }}
        />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader
        title={headerTitle}
        showBack
        onBack={() => router.back()}
        rightElement={
          <View
            style={[
              styles.actionBadge,
              { backgroundColor: isLike ? colors.success : colors.error },
            ]}
          >
            <Ionicons
              name={isLike ? 'heart' : 'close'}
              size={14}
              color={colors.textInverse}
            />
          </View>
        }
      />

  {/* SECTION: detail-hero — Instagram full-bleed card */}
      <View style={styles.heroSection}>
        {userPhoto ? (
          <Image
            source={{ uri: userPhoto }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.primaryLight ?? colors.border, alignItems: 'center', justifyContent: 'center' }]}>
            <Ionicons name="person" size={64} color={colors.textMuted} />
          </View>
        )}

        {/* Gradient overlay bottom-to-top */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.3)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Story-ring avatar top-left */}
        <View style={styles.storyRingWrapper}>
          {userPhoto ? (
            <Image source={{ uri: userPhoto }} style={styles.storyAvatar} contentFit="cover" />
          ) : (
            <View style={[styles.storyAvatar, { backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }]}>
              <Typography variant="headline" style={{ color: colors.textInverse, fontWeight: '700' }}>
                {(userName ?? '?').charAt(0).toUpperCase()}
              </Typography>
            </View>
          )}
        </View>

        {/* Name + age bottom-left */}
        <View style={styles.heroCardInfo}>
          <Typography
            style={[styles.heroCardName, { fontFamily: fonts.heading, color: colors.textInverse }]}
            numberOfLines={1}
          >
            {userName ?? 'Unknown'}{userAge !== null ? `, ${userAge}` : ''}
          </Typography>
          <View
            style={[
              styles.swipeDecisionBadge,
              { backgroundColor: isLike ? colors.success : colors.error },
            ]}
          >
            <Ionicons name={isLike ? 'heart' : 'close-circle'} size={14} color={colors.textInverse} />
            <Typography
              variant="caption1"
              style={{ color: colors.textInverse, fontFamily: fonts.body, marginLeft: spacing.xs, fontWeight: '600' }}
            >
              {isLike ? 'Liked' : 'Passed'}
            </Typography>
          </View>
        </View>

        {/* Action buttons bottom-right */}
        <View style={styles.heroActionButtons}>
          <Pressable
            onPress={handleViewProfile}
            accessibilityRole="button"
            accessibilityLabel="Pass"
            style={[styles.heroActionBtn, { backgroundColor: 'rgba(255,255,255,0.25)' }]}
          >
            <Ionicons name="person-outline" size={24} color={colors.textInverse} />
          </Pressable>
          {isLike && (
            <Pressable
              onPress={handleSendMessage}
              accessibilityRole="button"
              accessibilityLabel="Message"
              style={[styles.heroActionBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="chatbubble-outline" size={24} color={colors.textInverse} />
            </Pressable>
          )}
        </View>
      </View>

      {/* SECTION: detail-meta */}
      <View style={[styles.section, { paddingHorizontal: spacing.base }]}>
        <Typography
          variant="headline"
          style={{ color: colors.text, fontFamily: fonts.heading, marginBottom: spacing.sm }}
        >
          {'Swipe Info'}
        </Typography>

        <Card padded elevation="sm">
          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.metaContent}>
              <Typography variant="caption1" style={{ color: colors.textMuted }}>
                {'Label'}
              </Typography>
              <Typography variant="body" style={{ color: colors.text, fontFamily: fonts.body }}>
                {swipe.title || 'No label'}
              </Typography>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.metaContent}>
              <Typography variant="caption1" style={{ color: colors.textMuted }}>
                {'Swiped on'}
              </Typography>
              <Typography variant="body" style={{ color: colors.text, fontFamily: fonts.body }}>
                {formattedDate}
              </Typography>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          <View style={styles.metaRow}>
            <View style={styles.metaIcon}>
              <Ionicons name="create-outline" size={18} color={colors.primary} />
            </View>
            <View style={styles.metaContent}>
              <Typography variant="caption1" style={{ color: colors.textMuted }}>
                {'Last updated'}
              </Typography>
              <Typography variant="body" style={{ color: colors.text, fontFamily: fonts.body }}>
                {formattedUpdated}
              </Typography>
            </View>
          </View>
        </Card>
      </View>

      {/* SECTION: detail-body */}
      {userBio ? (
        <View style={[styles.section, { paddingHorizontal: spacing.base }]}>
          <Typography
            variant="headline"
            style={{ color: colors.text, fontFamily: fonts.heading, marginBottom: spacing.sm }}
          >
            {'About'}
          </Typography>
          <Card padded>
            <View style={styles.bioRow}>
              <Ionicons name="person-circle-outline" size={20} color={colors.secondary} />
              <Typography
                variant="body"
                style={{
                  color: colors.text,
                  fontFamily: fonts.body,
                  flex: 1,
                  marginLeft: spacing.sm,
                  lineHeight: 22,
                }}
              >
                {userBio}
              </Typography>
            </View>
          </Card>
        </View>
      ) : null}

      {/* SECTION: detail-actions */}
      <View
        style={[
          styles.actionsSection,
          { paddingHorizontal: spacing.base, paddingBottom: spacing['2xl'] },
        ]}
      >
        <Typography
          variant="headline"
          style={{ color: colors.text, fontFamily: fonts.heading, marginBottom: spacing.sm }}
        >
          {'Connect'}
        </Typography>

        {isLike && (
          <>
            <Button
              title="Send a message"
              onPress={handleSendMessage}
              variant="primary"
              fullWidth
              size="lg"
            />
            <View style={{ height: spacing.sm }} />
          </>
        )}

        <Button
          title="View full profile"
          onPress={handleViewProfile}
          variant="outline"
          fullWidth
          size="lg"
        />

        <View style={[styles.dangerDivider, { backgroundColor: colors.divider }]} />

        <Typography
          variant="headline"
          style={{
            color: colors.text,
            fontFamily: fonts.heading,
            marginBottom: spacing.sm,
          }}
        >
          {'Manage'}
        </Typography>

        <Button
          title="Edit swipe label"
          onPress={handleEdit}
          variant="outline"
          fullWidth
          size="lg"
        />

        <View style={{ height: spacing.sm }} />

        <Button
          title="Remove this swipe"
          onPress={handleDelete}
          variant="danger"
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  actionBadge: {
    width: 28,
    height: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSection: {
    width: '100%',
    height: 320,
    position: 'relative',
    marginBottom: Spacing.base,
    overflow: 'hidden',
    borderRadius: 0,
  },
  storyRingWrapper: {
    position: 'absolute',
    top: Spacing.base,
    left: Spacing.base,
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  heroCardInfo: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: 120,
  },
  heroCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  swipeDecisionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: 9999,
  },
  heroActionButtons: {
    position: 'absolute',
    bottom: Spacing.xl,
    right: Spacing.base,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  heroActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: Spacing.base,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
  },
  metaIcon: {
    width: 32,
    alignItems: 'center',
    paddingTop: 2,
  },
  metaContent: {
    flex: 1,
    gap: Spacing.xs,
  },
  divider: {
    height: 1,
  },
  dangerDivider: {
    height: 1,
    marginVertical: Spacing.lg,
  },
  bioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  actionsSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.base,
  },
});