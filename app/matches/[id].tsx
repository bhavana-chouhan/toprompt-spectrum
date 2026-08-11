import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import { SAMPLE_MATCHES } from '@/services/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const INTERESTS_MAP: Record<string, string[]> = {
  'Emma Wilson': ['Photography', 'Travel', 'Coffee', 'Yoga'],
  'Sophia Chen': ['Art', 'Music', 'Hiking', 'Cooking'],
  'Isabella Martinez': ['Dancing', 'Fashion', 'Reading', 'Fitness'],
  'Olivia Thompson': ['Surfing', 'Meditation', 'Painting', 'Cycling'],
  'Ava Johnson': ['Gaming', 'Movies', 'Baking', 'Running'],
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MatchDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [activePhoto, setActivePhoto] = useState(0);

  const match = SAMPLE_MATCHES.find((m) => m._id === id) ?? null;
  const profile = match?.matchedUser ?? null;

  const handleUnmatch = () => {
    Alert.alert(
      'Unmatch',
      `Are you sure you want to unmatch with ${profile?.name ?? 'this person'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  };

  if (!match || !profile) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.notFoundHeader, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <Typography variant="headline" style={{ color: colors.text, fontWeight: '700' }}>Profile</Typography>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Ionicons name="heart-dislike-outline" size={56} color={colors.textSecondary} />
          <Typography variant="title3" style={{ color: colors.text, marginTop: Spacing.md, fontWeight: '700' }}>Match not found</Typography>
          <Typography variant="body" style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
            This match may have been removed.
          </Typography>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back to matches"
            style={[styles.goBackBtn, { backgroundColor: colors.primary }]}
          >
            <Typography style={{ color: '#fff', fontWeight: '700' }}>Go Back</Typography>
          </Pressable>
        </View>
      </View>
    );
  }

  const photos: string[] = profile.photos ?? [];
  const interests = INTERESTS_MAP[profile.name] ?? ['Travel', 'Music', 'Coffee'];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Spacing['5xl'] + insets.bottom }}>

        {/* ── Photo Hero ── */}
        <View style={styles.photoHero}>
          <Image
            source={{ uri: photos[activePhoto] ?? photos[0] }}
            style={styles.heroImage}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.0)', 'rgba(0,0,0,0.65)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={[styles.heroBackBtn, { top: insets.top + Spacing.sm }]}
          >
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>

          {/* More options */}
          <Pressable
            onPress={handleUnmatch}
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={[styles.heroMoreBtn, { top: insets.top + Spacing.sm }]}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#fff" />
          </Pressable>

          {/* Photo dots */}
          {photos.length > 1 && (
            <View style={styles.photoDots}>
              {photos.map((_, i) => (
                <Pressable
                  key={i}
                  onPress={() => setActivePhoto(i)}
                  accessibilityRole="button"
                  accessibilityLabel={`Photo ${i + 1}`}
                  style={[
                    styles.photoDot,
                    { backgroundColor: i === activePhoto ? '#fff' : 'rgba(255,255,255,0.45)' },
                  ]}
                />
              ))}
            </View>
          )}

          {/* Name overlay */}
          <View style={styles.heroNameWrap}>
            <View style={styles.heroNameRow}>
              <Typography style={styles.heroName}>
                {profile.name}, {profile.age}
              </Typography>
              {profile.isVerified && (
                <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                  <Ionicons name="checkmark" size={11} color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.heroSubRow}>
              <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
              <Typography style={styles.heroLocation}>
                {profile.distance ?? '2 miles away'}
              </Typography>
              {profile.isOnline && (
                <View style={styles.onlineChip}>
                  <View style={styles.onlineDot} />
                  <Typography style={styles.onlineText}>Active now</Typography>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* ── Photo thumbnails ── */}
        {photos.length > 1 && (
          <View style={[styles.thumbRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
            {photos.map((uri, i) => (
              <Pressable
                key={i}
                onPress={() => setActivePhoto(i)}
                accessibilityRole="button"
                accessibilityLabel={`View photo ${i + 1}`}
                style={[
                  styles.thumb,
                  i === activePhoto && { borderColor: colors.primary, borderWidth: 2 },
                ]}
              >
                <Image source={{ uri }} style={styles.thumbImg} contentFit="cover" />
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Match info banner ── */}
        <View style={[styles.matchBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '30' }]}>
          <LinearGradient
            colors={['#2563EB', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.matchBannerIcon}
          >
            <Ionicons name="heart" size={16} color="#fff" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Typography style={[styles.matchBannerTitle, { color: colors.primary }]}>
              You matched with {profile.name.split(' ')[0]}!
            </Typography>
            <Typography style={[styles.matchBannerSub, { color: colors.textSecondary }]}>
              {timeAgo(match.matchedAt ?? match.createdAt ?? new Date().toISOString())}
            </Typography>
          </View>
        </View>

        {/* ── Bio ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
            <Typography style={[styles.sectionTitle, { color: colors.text }]}>About</Typography>
          </View>
          <Typography style={[styles.bioText, { color: colors.textSecondary }]}>
            {profile.bio ?? 'No bio yet.'}
          </Typography>
        </View>

        {/* ── Interests ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={18} color={colors.primary} />
            <Typography style={[styles.sectionTitle, { color: colors.text }]}>Interests</Typography>
          </View>
          <View style={styles.interestTags}>
            {interests.map((tag) => (
              <View
                key={tag}
                style={[styles.interestTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}
              >
                <Typography style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{tag}</Typography>
              </View>
            ))}
          </View>
        </View>

        {/* ── Details ── */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
            <Typography style={[styles.sectionTitle, { color: colors.text }]}>Details</Typography>
          </View>
          <View style={styles.detailsGrid}>
            <View style={[styles.detailChip, { backgroundColor: colors.background }]}>
              <Ionicons name="calendar-outline" size={15} color={colors.primary} />
              <Typography style={[styles.detailChipText, { color: colors.text }]}>{profile.age} years old</Typography>
            </View>
            <View style={[styles.detailChip, { backgroundColor: colors.background }]}>
              <Ionicons name="location-outline" size={15} color={colors.primary} />
              <Typography style={[styles.detailChipText, { color: colors.text }]}>{profile.distance ?? 'Nearby'}</Typography>
            </View>
            <View style={[styles.detailChip, { backgroundColor: colors.background }]}>
              <Ionicons name="sparkles-outline" size={15} color={colors.primary} />
              <Typography style={[styles.detailChipText, { color: colors.text }]}>{profile.relationshipGoal ?? 'Long-term'}</Typography>
            </View>
            {profile.isOnline && (
              <View style={[styles.detailChip, { backgroundColor: '#22C55E15' }]}>
                <View style={[styles.onlineDotSm, { backgroundColor: '#22C55E' }]} />
                <Typography style={[styles.detailChipText, { color: '#22C55E' }]}>Online now</Typography>
              </View>
            )}
          </View>
        </View>

        {/* ── Action Buttons ── */}
        <View style={[styles.actionsRow, { paddingHorizontal: Spacing.base }]}>
          <Pressable
            onPress={() => router.push('/matches')}
            accessibilityRole="button"
            accessibilityLabel={`Message ${profile.name}`}
            style={[styles.msgBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#fff" />
            <Typography style={{ color: '#fff', fontWeight: '700', marginLeft: 8 }}>Send Message</Typography>
          </Pressable>
          <Pressable
            onPress={handleUnmatch}
            accessibilityRole="button"
            accessibilityLabel="Unmatch"
            style={[styles.unmatchBtn, { borderColor: colors.border }]}
          >
            <Ionicons name="heart-dislike-outline" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
  },
  notFoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goBackBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 12,
  },
  // Hero
  photoHero: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBackBtn: {
    position: 'absolute',
    left: Spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroMoreBtn: {
    position: 'absolute',
    right: Spacing.base,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoDots: {
    position: 'absolute',
    top: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroNameWrap: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.base,
    right: Spacing.base,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  heroName: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroLocation: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
  onlineChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34,197,94,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#22C55E',
  },
  onlineText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  // Thumbnails
  thumbRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 0,
    borderColor: 'transparent',
  },
  thumbImg: {
    width: '100%',
    height: '100%',
  },
  // Match banner
  matchBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1,
  },
  matchBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  matchBannerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  // Sections
  section: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.base,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  bioText: {
    fontSize: 14,
    lineHeight: 22,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  interestTag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  detailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: 10,
  },
  detailChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  onlineDotSm: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    alignItems: 'center',
  },
  msgBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md + 2,
    borderRadius: 14,
  },
  unmatchBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
