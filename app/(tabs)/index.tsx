import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  Pressable,
  StyleSheet,
  Dimensions,
  RefreshControl,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import { SAMPLE_PROFILES, SAMPLE_STORIES } from '@/services/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.base * 2;

// ─── Story Item ───────────────────────────────────────────────────────────────
function StoryItem({ story, onPress }: { story: typeof SAMPLE_STORIES[0]; onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={story.isOwn ? 'Add your story' : `View ${story.name}'s story`}
      style={styles.storyItem}
    >
      <View style={styles.storyRingOuter}>
        {story.isOwn ? (
          <View style={[styles.storyAvatarWrap, { backgroundColor: colors.border }]}>
            <Ionicons name="add" size={28} color={colors.primary} />
          </View>
        ) : (
          <LinearGradient
            colors={story.isActive ? ['#F58529', '#DD2A7B', '#8134AF'] : [colors.border, colors.border]}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.storyRingGradient}
          >
            <View style={[styles.storyAvatarInner, { backgroundColor: colors.background }]}>
              <Image
                source={{ uri: story.photo ?? '' }}
                style={styles.storyAvatar}
                contentFit="cover"
              />
            </View>
          </LinearGradient>
        )}
        {story.isActive && !story.isOwn && (
          <View style={[styles.storyActiveDot, { backgroundColor: '#22C55E', borderColor: colors.background }]} />
        )}
      </View>
      <Typography
        variant="caption1"
        numberOfLines={1}
        style={[styles.storyName, { color: colors.text }]}
      >
        {story.name}
      </Typography>
    </Pressable>
  );
}

// ─── Feed Card ────────────────────────────────────────────────────────────────
function FeedCard({ profile }: { profile: typeof SAMPLE_PROFILES[0] }) {
  const { colors } = useTheme();
  const [liked, setLiked] = useState(false);

  return (
    <Pressable
      onPress={() => router.push('/users/' + profile._id)}
      accessibilityRole="button"
      accessibilityLabel={`View ${profile.name}'s profile`}
      style={[styles.feedCard, { backgroundColor: colors.surface }]}
    >
      {/* Photo */}
      <View style={styles.feedPhotoWrap}>
        <Image
          source={{ uri: profile.photos[0] }}
          style={styles.feedPhoto}
          contentFit="cover"
          transition={200}
        />
        {/* Compatibility badge */}
        <View style={[styles.compatBadge, { backgroundColor: colors.primary }]}>
          <Typography variant="caption1" style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>
            {profile.compatibility}% match
          </Typography>
        </View>
        {/* Online indicator */}
        {profile.isOnline && (
          <View style={[styles.onlineBadge, { backgroundColor: '#22C55E', borderColor: colors.surface }]} />
        )}
      </View>

      {/* Info row */}
      <View style={styles.feedInfo}>
        <View style={styles.feedNameRow}>
          <View style={styles.feedNameLeft}>
            <Typography variant="headline" style={{ color: colors.text, fontWeight: '700' }}>
              {profile.name}, {profile.age}
            </Typography>
            {profile.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 4 }} />
            )}
          </View>
          <View style={styles.feedDistanceRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Typography variant="caption1" style={{ color: colors.textSecondary, marginLeft: 2 }}>
              {profile.distance}
            </Typography>
          </View>
        </View>

        <Typography
          variant="subhead"
          numberOfLines={2}
          style={{ color: colors.textSecondary, marginTop: 4, lineHeight: 20 }}
        >
          {profile.bio}
        </Typography>

        {/* Interests */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsRow}>
          {profile.interests.slice(0, 4).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Typography variant="caption1" style={{ color: colors.primary, fontWeight: '600', fontSize: 11 }}>
                {tag}
              </Typography>
            </View>
          ))}
        </ScrollView>

        {/* Goal row */}
        <View style={styles.goalRow}>
          <View style={[styles.goalBadge, { backgroundColor: colors.secondary + '15' }]}>
            <Ionicons name="heart-outline" size={12} color={colors.secondary} />
            <Typography variant="caption1" style={{ color: colors.secondary, marginLeft: 4, fontWeight: '600', fontSize: 11 }}>
              {profile.relationshipGoal}
            </Typography>
          </View>
          <Typography variant="caption1" style={{ color: colors.textSecondary, fontSize: 11 }}>
            {profile.lastActive}
          </Typography>
        </View>

        {/* Action row */}
        <View style={[styles.feedActions, { borderTopColor: colors.border }]}>
          <Pressable
            onPress={() => setLiked((v) => !v)}
            accessibilityRole="button"
            accessibilityLabel={liked ? 'Unlike' : 'Like'}
            style={styles.feedActionBtn}
          >
            <Ionicons
              name={liked ? 'heart' : 'heart-outline'}
              size={22}
              color={liked ? '#EF4444' : colors.textSecondary}
            />
            <Typography variant="caption1" style={{ color: colors.textSecondary, marginLeft: 4 }}>
              Like
            </Typography>
          </Pressable>
          <Pressable
            onPress={() => router.push('/matches')}
            accessibilityRole="button"
            accessibilityLabel="Message"
            style={styles.feedActionBtn}
          >
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            <Typography variant="caption1" style={{ color: colors.textSecondary, marginLeft: 4 }}>
              Message
            </Typography>
          </Pressable>
          <Pressable
            onPress={() => router.push('/swipes/new')}
            accessibilityRole="button"
            accessibilityLabel="Discover"
            style={[styles.feedActionBtnPrimary, { backgroundColor: colors.primary }]}>
            <Ionicons name="flash" size={16} color="#fff" />
            <Typography variant="caption1" style={{ color: '#fff', marginLeft: 4, fontWeight: '700' }}>
              Discover
            </Typography>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const ListHeader = (
    <View>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.sm,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <View style={[styles.logoWrap, { backgroundColor: colors.primary }]}>
              <Ionicons name="people" size={18} color="#fff" />
            </View>
            <View>
              <Typography
                variant="title2"
                style={{ color: colors.text, fontWeight: '800', letterSpacing: -0.5 }}
              >
                Spectrum
              </Typography>
              <View style={styles.locationRow}>
                <Ionicons name="location" size={11} color={colors.primary} />
                <Typography variant="caption1" style={{ color: colors.textSecondary, marginLeft: 2, fontSize: 11 }}>
                  New York, NY
                </Typography>
              </View>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable
              onPress={() => router.push('/matches')}
              accessibilityRole="button"
              accessibilityLabel="Messages"
              style={[styles.headerIconBtn, { backgroundColor: colors.background }]}
            >
              <Ionicons name="chatbubbles-outline" size={22} color={colors.text} />
              <View style={[styles.notifDot, { backgroundColor: '#EF4444' }]} />
            </Pressable>
            <Pressable
              onPress={() => router.push('/(tabs)/profile')}
              accessibilityRole="button"
              accessibilityLabel="Profile"
              style={[styles.headerIconBtn, { backgroundColor: colors.background }]}
            >
              <Ionicons name="person-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.textSecondary} />
          <TextInput
            placeholder="Search people, interests..."
            placeholderTextColor={colors.textSecondary}
            style={[styles.searchInput, { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            style={[styles.filterBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="options-outline" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ── Stories ── */}
      <View style={[styles.storiesSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesContent}>
          {SAMPLE_STORIES.map((story) => (
            <StoryItem
              key={story.id}
              story={story}
              onPress={() => {
                if (!story.isOwn && story.userId) {
                  router.push('/users/' + story.userId);
                }
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* ── Section Header ── */}
      <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
        <Typography variant="headline" style={{ color: colors.text, fontWeight: '700' }}>
          Discover People
        </Typography>
        <Pressable
          onPress={() => router.push('/swipes/new')}
          accessibilityRole="button"
          accessibilityLabel="See all"
        >
          <Typography variant="subhead" style={{ color: colors.primary, fontWeight: '600' }}>
            Swipe Mode →
          </Typography>
        </Pressable>
      </View>
    </View>
  );

  const filteredProfiles = searchQuery.trim()
    ? SAMPLE_PROFILES.filter((p) => {
        const q = searchQuery.toLowerCase();
        return (
          (p.name ?? '').toLowerCase().includes(q) ||
          (p.bio ?? '').toLowerCase().includes(q) ||
          (p.interests ?? []).some((i: string) => i.toLowerCase().includes(q)) ||
          (p.relationshipGoal ?? '').toLowerCase().includes(q) ||
          (p.distance ?? '').toLowerCase().includes(q)
        );
      })
    : SAMPLE_PROFILES;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredProfiles}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <FeedCard profile={item} />}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storiesSection: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.md,
  },
  storiesContent: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  storyItem: {
    alignItems: 'center',
    width: 68,
  },
  storyRingOuter: {
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  storyRingGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatarInner: {
    width: 59,
    height: 59,
    borderRadius: 29.5,
    padding: 1.5,
  },
  storyAvatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 28,
  },
  storyActiveDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  storyName: {
    fontSize: 11,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing['5xl'],
  },
  // Feed card
  feedCard: {
    marginHorizontal: Spacing.base,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  feedPhotoWrap: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  feedPhoto: {
    width: '100%',
    height: '100%',
  },
  compatBadge: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
  },
  feedInfo: {
    padding: Spacing.base,
  },
  feedNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feedNameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedDistanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsRow: {
    marginTop: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: Spacing.xs,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  feedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  feedActionBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    marginLeft: 'auto',
  },
});
