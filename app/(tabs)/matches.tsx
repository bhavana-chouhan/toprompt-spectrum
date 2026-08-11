import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  SectionList,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Typography } from '@/components/ui/Typography';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import { SAMPLE_MATCHES } from '@/services/mock-data';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── New Match Card (horizontal scroll) ───────────────────────────────────────
function NewMatchCard({ match }: { match: typeof SAMPLE_MATCHES[0] }) {
  const { colors } = useTheme();
  const profile = match.matchedUser;
  return (
    <Pressable
      onPress={() => router.push('/matches/' + match._id)}
      accessibilityRole="button"
      accessibilityLabel={`Chat with ${profile.name}`}
      style={styles.newMatchCard}
    >
      <View style={styles.newMatchPhotoWrap}>
        <Image
          source={{ uri: profile.photos[0] }}
          style={styles.newMatchPhoto}
          contentFit="cover"
          transition={200}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={StyleSheet.absoluteFill}
        />
        {/* Pulsing gradient badge for unread (project memory) */}
        {match.unreadCount > 0 && (
          <LinearGradient
            colors={['#2563EB', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newMatchBadge}
          >
            <Typography style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
              {match.unreadCount}
            </Typography>
          </LinearGradient>
        )}
        {profile.isOnline && (
          <View style={[styles.newMatchOnline, { backgroundColor: '#22C55E', borderColor: '#fff' }]} />
        )}
        <View style={styles.newMatchNameWrap}>
          <Typography style={{ color: '#fff', fontWeight: '700', fontSize: 13 }} numberOfLines={1}>
            {profile.name.split(' ')[0]}
          </Typography>
          <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }}>
            {profile.age}
          </Typography>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Conversation Row ─────────────────────────────────────────────────────────
function ConversationRow({ match }: { match: typeof SAMPLE_MATCHES[0] }) {
  const { colors } = useTheme();
  const profile = match.matchedUser;
  const hasUnread = match.unreadCount > 0;

  return (
    <Pressable
      onPress={() => router.push('/matches/' + match._id)}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${profile.name}`}
      style={({ pressed }) => [
        styles.convRow,
        { backgroundColor: pressed ? colors.background : colors.surface },
      ]}
    >
      {/* Avatar with story-ring for new matches */}
      <View style={styles.convAvatarWrap}>
        {match.isNew ? (
          <LinearGradient
            colors={['#F58529', '#DD2A7B', '#8134AF']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={styles.convAvatarRing}
          >
            <View style={[styles.convAvatarInner, { backgroundColor: colors.surface }]}>
              <Image
                source={{ uri: profile.photos[0] }}
                style={styles.convAvatar}
                contentFit="cover"
              />
            </View>
          </LinearGradient>
        ) : (
          <Image
            source={{ uri: profile.photos[0] }}
            style={[styles.convAvatar, styles.convAvatarNoRing]}
            contentFit="cover"
          />
        )}
        {profile.isOnline && (
          <View style={[styles.convOnlineDot, { backgroundColor: '#22C55E', borderColor: colors.surface }]} />
        )}
      </View>

      {/* Text content */}
      <View style={styles.convContent}>
        <View style={styles.convTopRow}>
          <Typography
            variant="body"
            numberOfLines={1}
            style={[
              styles.convName,
              { color: colors.text, fontWeight: hasUnread ? '700' : '500' },
            ]}
          >
            {profile.name}
          </Typography>
          <Typography
            variant="caption1"
            style={{ color: colors.textSecondary, fontSize: 11 }}
          >
            {timeAgo(match.lastMessageTime)}
          </Typography>
        </View>
        <View style={styles.convBottomRow}>
          <Typography
            variant="subhead"
            numberOfLines={1}
            style={[
              styles.convPreview,
              { color: hasUnread ? colors.text : colors.textSecondary, fontWeight: hasUnread ? '500' : '400' },
            ]}
          >
            {match.lastMessage}
          </Typography>
          {hasUnread && (
            <LinearGradient
              colors={['#2563EB', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.unreadPill}
            >
              <Typography style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {match.unreadCount}
              </Typography>
            </LinearGradient>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MatchesScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const newMatches = SAMPLE_MATCHES.filter((m) => m.isNew);
  const allConversations = SAMPLE_MATCHES;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
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
        <View style={styles.headerRow}>
          <Typography variant="title1" style={{ color: colors.text, fontWeight: '800' }}>
            Messages
          </Typography>
          <Pressable
            onPress={() => router.push('/matches/new')}
            accessibilityRole="button"
            accessibilityLabel="New match"
            style={[styles.headerAddBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="create-outline" size={18} color="#fff" />
          </Pressable>
        </View>
      </View>

      {/* ── New Matches horizontal scroll ── */}
      {newMatches.length > 0 && (
        <View style={[styles.newMatchesSection, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.sectionLabelRow}>
            <Typography variant="headline" style={{ color: colors.text, fontWeight: '700' }}>
              New Matches
            </Typography>
            <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
              <Typography style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
                {newMatches.length}
              </Typography>
            </View>
          </View>
          <FlatList
            data={newMatches}
            keyExtractor={(m) => m._id}
            renderItem={({ item }) => <NewMatchCard match={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.newMatchesList}
          />
        </View>
      )}

      {/* ── Conversations label ── */}
      <View style={[styles.sectionLabelRow, { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, backgroundColor: colors.background }]}>
        <Typography variant="headline" style={{ color: colors.text, fontWeight: '700' }}>
          Conversations
        </Typography>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={allConversations}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ConversationRow match={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <EmptyState
            title="No matches yet"
            description="Start swiping to find your connections!"
            icon="heart-outline"
            action={{ title: 'Discover People', onPress: () => router.push('/swipes/new') }}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.border, marginLeft: 80 }]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMatchesSection: {
    paddingBottom: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  newBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newMatchesList: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.md,
  },
  newMatchCard: {
    width: 100,
  },
  newMatchPhotoWrap: {
    width: 100,
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  newMatchPhoto: {
    width: '100%',
    height: '100%',
  },
  newMatchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMatchOnline: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  newMatchNameWrap: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
  },
  // Conversation rows
  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  convAvatarWrap: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  convAvatarRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 1.5,
  },
  convAvatar: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
  },
  convAvatarNoRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  convOnlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  convContent: {
    flex: 1,
  },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  convName: {
    fontSize: 15,
    flex: 1,
    marginRight: Spacing.sm,
  },
  convBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  convPreview: {
    fontSize: 13,
    flex: 1,
    marginRight: Spacing.sm,
  },
  unreadPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
  },
  listContent: {
    paddingBottom: Spacing['5xl'],
    flexGrow: 1,
  },
});
