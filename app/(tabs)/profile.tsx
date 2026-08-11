import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  FlatList,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { SignOutListItem } from '@/components/auth/SignOutListItem';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/store/useAuthStore';
import { useMatchStore } from '@/store/useMatchStore';
import { useSwipeStore } from '@/store/useSwipeStore';
import { Spacing } from '@/constants/spacing';
import { SAMPLE_PROFILES } from '@/services/mock-data';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_CELL = (SCREEN_WIDTH - Spacing.base * 2 - Spacing.xs * 2) / 3;

const INTERESTS = ['Photography', 'Travel', 'Coffee', 'Hiking', 'Art', 'Music', 'Cooking'];
const PROFILE_PHOTOS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
  'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=400&q=80',
];

const SETTINGS_ITEMS = [
  { icon: 'person-outline', label: 'Edit Profile', onPress: () => router.push('/users/new') },
  { icon: 'notifications-outline', label: 'Notifications', onPress: () => {} },
  { icon: 'shield-checkmark-outline', label: 'Privacy & Safety', onPress: () => {} },
  { icon: 'settings-outline', label: 'Account Settings', onPress: () => {} },
  { icon: 'help-circle-outline', label: 'Help & Support', onPress: () => {} },
];

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const matchs = useMatchStore((s) => s.matchs);
  const swipes = useSwipeStore((s) => s.swipes);
  const [activeTab, setActiveTab] = useState<'photos' | 'about'>('photos');

  const matchCount = (Array.isArray(matchs) ? matchs : []).length || 5;
  const swipeCount = (Array.isArray(swipes) ? swipes : []).length || 48;
  const likeCount = (Array.isArray(swipes) ? swipes : []).filter((s) => s.action === 'like').length || 31;

  const handleMatchesPress = () => router.push('/matches');
  const handleLikesPress = () => router.push('/swipes');

  const displayName = user?.name || 'Alex Johnson';
  const bio = (user as any)?.bio || 'Living life one adventure at a time ✈️ | Coffee addict | Dog lover | Looking for my person';
  const age = (user as any)?.age || 28;
  const location = 'New York, NY';
  const completionPct = 82;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Spacing['5xl'] }}
    >
      {/* ── Hero ── */}
      <View style={styles.hero}>
        <Image
          source={{ uri: PROFILE_PHOTOS[0] }}
          style={styles.heroBg}
          contentFit="cover"
          blurRadius={2}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)']}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.heroContent, { paddingTop: insets.top + Spacing.sm }]}>
          {/* Top bar */}
          <View style={styles.heroTopBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Settings"
              style={styles.heroIconBtn}
            >
              <Ionicons name="settings-outline" size={22} color="#fff" />
            </Pressable>
            <Pressable
              onPress={() => router.push('/users/new')}
              accessibilityRole="button"
              accessibilityLabel="Edit profile"
              style={styles.heroIconBtn}
            >
              <Ionicons name="create-outline" size={22} color="#fff" />
            </Pressable>
          </View>

          {/* Avatar */}
          <View style={styles.avatarWrap}>
            <Image
              source={{ uri: PROFILE_PHOTOS[0] }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={12} color="#fff" />
            </View>
          </View>

          {/* Name + info */}
          <Typography style={styles.heroName}>
            {displayName}, {age}
          </Typography>
          <View style={styles.heroLocationRow}>
            <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
            <Typography style={styles.heroLocation}>{location}</Typography>
          </View>

          {/* Completion bar */}
          <View style={[styles.completionWrap, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <View style={[styles.completionBar, { backgroundColor: colors.primary, width: `${completionPct}%` as any }]} />
            <Typography style={styles.completionTxt}>{completionPct}% complete</Typography>
          </View>
        </View>
      </View>

      {/* ── Stats ── */}
      <View style={[styles.statsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={handleMatchesPress}
          accessibilityRole="button"
          accessibilityLabel={`${matchCount} matches, tap to view`}
          style={styles.statItem}
        >
          <Typography style={[styles.statNum, { color: colors.primary }]}>{matchCount}</Typography>
          <Typography style={[styles.statLabel, { color: colors.textSecondary }]}>Matches</Typography>
        </Pressable>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Typography style={[styles.statNum, { color: colors.secondary }]}>{swipeCount}</Typography>
          <Typography style={[styles.statLabel, { color: colors.textSecondary }]}>Swipes</Typography>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <Pressable
          onPress={handleLikesPress}
          accessibilityRole="button"
          accessibilityLabel={`${likeCount} likes, tap to view`}
          style={styles.statItem}
        >
          <Typography style={[styles.statNum, { color: '#EF4444' }]}>{likeCount}</Typography>
          <Typography style={[styles.statLabel, { color: colors.textSecondary }]}>Likes</Typography>
        </Pressable>
      </View>

      {/* ── Action Buttons ── */}
      <View style={[styles.actionBtns, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => router.push('/users/new')}
          accessibilityRole="button"
          accessibilityLabel="Edit Profile"
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="create-outline" size={16} color="#fff" />
          <Typography style={{ color: '#fff', fontWeight: '700', marginLeft: 6 }}>Edit Profile</Typography>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share Profile"
          style={[styles.actionBtn, styles.actionBtnOutline, { borderColor: colors.border }]}
        >
          <Ionicons name="share-outline" size={16} color={colors.text} />
          <Typography style={{ color: colors.text, fontWeight: '600', marginLeft: 6 }}>Share</Typography>
        </Pressable>
        <Pressable
          onPress={() => router.push('/swipes/new')}
          accessibilityRole="button"
          accessibilityLabel="Discover"
          style={[styles.actionBtnIcon, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <Ionicons name="flash" size={18} color={colors.primary} />
        </Pressable>
      </View>

      {/* ── Tabs ── */}
      <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Pressable
          onPress={() => setActiveTab('photos')}
          accessibilityRole="button"
          accessibilityLabel="Photos tab"
          style={[styles.tab, activeTab === 'photos' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Ionicons name="grid-outline" size={20} color={activeTab === 'photos' ? colors.primary : colors.textSecondary} />
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('about')}
          accessibilityRole="button"
          accessibilityLabel="About tab"
          style={[styles.tab, activeTab === 'about' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        >
          <Ionicons name="person-outline" size={20} color={activeTab === 'about' ? colors.primary : colors.textSecondary} />
        </Pressable>
      </View>

      {/* ── Photos Grid ── */}
      {activeTab === 'photos' && (
        <View style={[styles.photoGrid, { backgroundColor: colors.background }]}>
          {PROFILE_PHOTOS.map((uri, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Photo ${i + 1}`}
              style={styles.gridCell}
            >
              <Image
                source={{ uri }}
                style={styles.gridPhoto}
                contentFit="cover"
                transition={200}
              />
            </Pressable>
          ))}
        </View>
      )}

      {/* ── About ── */}
      {activeTab === 'about' && (
        <View style={[styles.aboutSection, { backgroundColor: colors.background }]}>
          {/* Bio */}
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.aboutCardHeader}>
              <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
              <Typography style={[styles.aboutCardTitle, { color: colors.text }]}>About Me</Typography>
            </View>
            <Typography style={[styles.aboutCardBody, { color: colors.textSecondary }]}>{bio}</Typography>
          </View>

          {/* Interests */}
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.aboutCardHeader}>
              <Ionicons name="heart-outline" size={18} color={colors.primary} />
              <Typography style={[styles.aboutCardTitle, { color: colors.text }]}>Interests</Typography>
            </View>
            <View style={styles.interestTags}>
              {INTERESTS.map((tag) => (
                <View key={tag} style={[styles.interestTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                  <Typography style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>{tag}</Typography>
                </View>
              ))}
            </View>
          </View>

          {/* Relationship goal */}
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.aboutCardHeader}>
              <Ionicons name="sparkles-outline" size={18} color={colors.primary} />
              <Typography style={[styles.aboutCardTitle, { color: colors.text }]}>Looking For</Typography>
            </View>
            <Typography style={[styles.aboutCardBody, { color: colors.textSecondary }]}>Long-term relationship</Typography>
          </View>

          {/* Settings */}
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {SETTINGS_ITEMS.map((item, i) => (
              <Pressable
                key={item.label}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                style={[
                  styles.settingsRow,
                  i < SETTINGS_ITEMS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                ]}
              >
                <View style={[styles.settingsIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <Typography style={[styles.settingsLabel, { color: colors.text }]}>{item.label}</Typography>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              </Pressable>
            ))}
          </View>

          {/* Sign out */}
          <View style={[styles.aboutCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <SignOutListItem />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Hero
  hero: {
    height: 340,
    position: 'relative',
    overflow: 'hidden',
  },
  heroBg: {
    ...StyleSheet.absoluteFillObject,
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: Spacing.base,
    alignItems: 'center',
  },
  heroTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.md,
  },
  heroIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#fff',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroName: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  heroLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroLocation: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginLeft: 3,
  },
  completionWrap: {
    width: '80%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  completionBar: {
    height: '100%',
    borderRadius: 3,
  },
  completionTxt: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 4,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  // Action buttons
  actionBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
  },
  actionBtnOutline: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionBtnIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  // Tabs
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  // Photo grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.base,
    gap: Spacing.xs,
  },
  gridCell: {
    width: GRID_CELL,
    height: GRID_CELL,
    borderRadius: 4,
    overflow: 'hidden',
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
  },
  // About
  aboutSection: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  aboutCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.base,
  },
  aboutCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  aboutCardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  aboutCardBody: {
    fontSize: 14,
    lineHeight: 21,
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
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
});
