import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  ScrollView,
  Animated,
  PanResponder,
  Modal,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Typography } from '@/components/ui/Typography';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/spacing';
import { SAMPLE_PROFILES } from '@/services/mock-data';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - Spacing.base * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.62;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

type SwipeProfile = typeof SAMPLE_PROFILES[0];

// ─── Match Modal ──────────────────────────────────────────────────────────────
function MatchModal({
  visible,
  profile,
  onClose,
  onChat,
}: {
  visible: boolean;
  profile: SwipeProfile | null;
  onClose: () => void;
  onChat: () => void;
}) {
  const { colors } = useTheme();
  if (!profile) return null;
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.matchOverlay}>
        <LinearGradient
          colors={['rgba(37,99,235,0.95)', 'rgba(124,58,237,0.95)']}
          style={styles.matchContent}
        >
          <Typography style={styles.matchItsTxt}>It's a Match!</Typography>
          <Typography style={styles.matchSubTxt}>
            You and {profile.name} liked each other
          </Typography>

          <View style={styles.matchAvatars}>
            <View style={styles.matchAvatarWrap}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&q=80' }}
                style={styles.matchAvatar}
                contentFit="cover"
              />
            </View>
            <View style={[styles.matchHeartBadge, { backgroundColor: '#EF4444' }]}>
              <Ionicons name="heart" size={24} color="#fff" />
            </View>
            <View style={styles.matchAvatarWrap}>
              <Image
                source={{ uri: profile.photos[0] }}
                style={styles.matchAvatar}
                contentFit="cover"
              />
            </View>
          </View>

          <Pressable
            onPress={onChat}
            accessibilityRole="button"
            accessibilityLabel="Start chatting"
            style={styles.matchChatBtn}
          >
            <Typography style={{ color: colors.primary, fontWeight: '700', fontSize: 16 }}>
              Start Chatting 💬
            </Typography>
          </Pressable>

          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Keep swiping"
            style={styles.matchKeepBtn}
          >
            <Typography style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
              Keep Swiping
            </Typography>
          </Pressable>
        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── Swipe Card ───────────────────────────────────────────────────────────────
function SwipeCard({
  profile,
  isTop,
  onSwipeLeft,
  onSwipeRight,
  onSuperLike,
}: {
  profile: SwipeProfile;
  isTop: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSuperLike: () => void;
}) {
  const { colors } = useTheme();
  const position = useRef(new Animated.ValueXY()).current;
  const [photoIndex, setPhotoIndex] = useState(0);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-8deg', '0deg', '8deg'],
    extrapolate: 'clamp',
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD / 2],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const passOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD / 2, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => isTop,
      onMoveShouldSetPanResponder: () => isTop,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: SCREEN_WIDTH + 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onSwipeRight();
          });
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          Animated.spring(position, {
            toValue: { x: -SCREEN_WIDTH - 100, y: gesture.dy },
            useNativeDriver: false,
          }).start(() => {
            position.setValue({ x: 0, y: 0 });
            onSwipeLeft();
          });
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            friction: 5,
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  const animatedStyle = isTop
    ? {
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate },
        ],
      }
    : {};

  return (
    <Animated.View
      style={[
        styles.swipeCard,
        animatedStyle,
        !isTop && { transform: [{ scale: 0.95 }], top: 12 },
      ]}
      {...(isTop ? panResponder.panHandlers : {})}
    >
      {/* Photo */}
      <Image
        source={{ uri: profile.photos[photoIndex] }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
      />

      {/* Photo dots */}
      {profile.photos.length > 1 && (
        <View style={styles.photoDots}>
          {profile.photos.map((_, i) => (
            <Pressable
              key={i}
              onPress={() => setPhotoIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={`Photo ${i + 1}`}
              style={[
                styles.photoDot,
                { backgroundColor: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.5)' },
              ]}
            />
          ))}
        </View>
      )}

      {/* Like / Pass overlays */}
      <Animated.View style={[styles.swipeLabel, styles.swipeLabelLike, { opacity: likeOpacity }]}>
        <Typography style={styles.swipeLabelText}>LIKE ❤️</Typography>
      </Animated.View>
      <Animated.View style={[styles.swipeLabel, styles.swipeLabelPass, { opacity: passOpacity }]}>
        <Typography style={styles.swipeLabelText}>PASS ✕</Typography>
      </Animated.View>

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', 'transparent', 'rgba(0,0,0,0.75)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Profile info */}
      <View style={styles.cardInfo}>
        <View style={styles.cardNameRow}>
          <Typography style={styles.cardName}>
            {profile.name}, {profile.age}
          </Typography>
          {profile.isVerified && (
            <Ionicons name="checkmark-circle" size={20} color="#60A5FA" style={{ marginLeft: 6 }} />
          )}
        </View>
        <View style={styles.cardLocationRow}>
          <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.85)" />
          <Typography style={styles.cardLocation}>{profile.distance}</Typography>
        </View>
        <Typography style={styles.cardBio} numberOfLines={2}>
          {profile.bio}
        </Typography>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
          {profile.interests.slice(0, 4).map((tag) => (
            <View key={tag} style={styles.cardTag}>
              <Typography style={styles.cardTagText}>{tag}</Typography>
            </View>
          ))}
        </ScrollView>
      </View>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function DiscoverScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [profiles, setProfiles] = useState(SAMPLE_PROFILES);
  const [matchedProfile, setMatchedProfile] = useState<SwipeProfile | null>(null);
  const [showMatch, setShowMatch] = useState(false);
  const [undoStack, setUndoStack] = useState<SwipeProfile[]>([]);

  const currentProfile = profiles[0] ?? null;
  const nextProfile = profiles[1] ?? null;

  const handleSwipeRight = useCallback(() => {
    if (!currentProfile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUndoStack((prev) => [currentProfile, ...prev.slice(0, 4)]);
    setProfiles((prev) => prev.slice(1));
    // 30% chance of match for demo
    if (Math.random() < 0.3) {
      setTimeout(() => {
        setMatchedProfile(currentProfile);
        setShowMatch(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 400);
    }
  }, [currentProfile]);

  const handleSwipeLeft = useCallback(() => {
    if (!currentProfile) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUndoStack((prev) => [currentProfile, ...prev.slice(0, 4)]);
    setProfiles((prev) => prev.slice(1));
  }, [currentProfile]);

  const handleSuperLike = useCallback(() => {
    if (!currentProfile) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setUndoStack((prev) => [currentProfile, ...prev.slice(0, 4)]);
    setProfiles((prev) => prev.slice(1));
  }, [currentProfile]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const [last, ...rest] = undoStack;
    setProfiles((prev) => [last, ...prev]);
    setUndoStack(rest);
  }, [undoStack]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + Spacing.xs,
            backgroundColor: colors.surface,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter"
            style={[styles.headerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Typography style={[styles.headerTitle, { color: colors.text }]}>Discover</Typography>
            <View style={styles.headerLocationRow}>
              <Ionicons name="location" size={11} color={colors.primary} />
              <Typography style={{ color: colors.textSecondary, fontSize: 11, marginLeft: 2 }}>
                New York, NY
              </Typography>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/swipes')}
            accessibilityRole="button"
            accessibilityLabel="Swipe history"
            style={[styles.headerBtn, { backgroundColor: colors.background, borderColor: colors.border }]}
          >
            <Ionicons name="time-outline" size={20} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Card Stack ── */}
      <View style={styles.cardStack}>
        {profiles.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface }]}>
            <Ionicons name="heart-outline" size={64} color={colors.primary} />
            <Typography variant="title2" style={{ color: colors.text, marginTop: Spacing.md, fontWeight: '700' }}>
              You're all caught up!
            </Typography>
            <Typography variant="subhead" style={{ color: colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' }}>
              Check back later for new profiles
            </Typography>
            <Pressable
              onPress={() => setProfiles(SAMPLE_PROFILES)}
              accessibilityRole="button"
              accessibilityLabel="Reload profiles"
              style={[styles.reloadBtn, { backgroundColor: colors.primary }]}
            >
              <Typography style={{ color: '#fff', fontWeight: '700' }}>Reload Profiles</Typography>
            </Pressable>
          </View>
        ) : (
          <>
            {nextProfile && (
              <SwipeCard
                key={nextProfile._id + '_next'}
                profile={nextProfile}
                isTop={false}
                onSwipeLeft={() => {}}
                onSwipeRight={() => {}}
                onSuperLike={() => {}}
              />
            )}
            {currentProfile && (
              <SwipeCard
                key={currentProfile._id}
                profile={currentProfile}
                isTop
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
                onSuperLike={handleSuperLike}
              />
            )}
          </>
        )}

        {/* Deck counter */}
        {profiles.length > 0 && (
          <View style={[styles.deckCounter, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Typography variant="caption1" style={{ color: colors.textSecondary, fontWeight: '600' }}>
              {profiles.length} left
            </Typography>
          </View>
        )}
      </View>

      {/* ── Action Buttons ── */}
      {profiles.length > 0 && (
        <View style={styles.actions}>
          {/* Undo */}
          <Pressable
            onPress={handleUndo}
            accessibilityRole="button"
            accessibilityLabel="Undo"
            style={[
              styles.actionBtn,
              styles.actionBtnSm,
              {
                backgroundColor: colors.surface,
                borderColor: '#F59E0B',
                opacity: undoStack.length === 0 ? 0.4 : 1,
              },
            ]}
            disabled={undoStack.length === 0}
          >
            <Ionicons name="arrow-undo" size={20} color="#F59E0B" />
          </Pressable>

          {/* Pass */}
          <Pressable
            onPress={handleSwipeLeft}
            accessibilityRole="button"
            accessibilityLabel="Pass"
            style={[
              styles.actionBtn,
              styles.actionBtnMd,
              { backgroundColor: colors.surface, borderColor: '#EF4444' },
            ]}
          >
            <Ionicons name="close" size={30} color="#EF4444" />
          </Pressable>

          {/* Super Like */}
          <Pressable
            onPress={handleSuperLike}
            accessibilityRole="button"
            accessibilityLabel="Super Like"
            style={[
              styles.actionBtn,
              styles.actionBtnSm,
              { backgroundColor: colors.surface, borderColor: '#2563EB' },
            ]}
          >
            <Ionicons name="star" size={20} color="#2563EB" />
          </Pressable>

          {/* Like */}
          <Pressable
            onPress={handleSwipeRight}
            accessibilityRole="button"
            accessibilityLabel="Like"
            style={[
              styles.actionBtn,
              styles.actionBtnMd,
              { backgroundColor: colors.surface, borderColor: '#22C55E' },
            ]}
          >
            <Ionicons name="heart" size={28} color="#22C55E" />
          </Pressable>

          {/* Boost */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Boost"
            style={[
              styles.actionBtn,
              styles.actionBtnSm,
              { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
          >
            <Ionicons name="flash" size={20} color="#fff" />
          </Pressable>
        </View>
      )}

      {/* ── Match Modal ── */}
      <MatchModal
        visible={showMatch}
        profile={matchedProfile}
        onClose={() => setShowMatch(false)}
        onChat={() => {
          setShowMatch(false);
          router.push('/matches');
        }}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  cardStack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    position: 'relative',
  },
  swipeCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'absolute',
    backgroundColor: '#000',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  photoDots: {
    position: 'absolute',
    top: Spacing.md,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    zIndex: 10,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  swipeLabel: {
    position: 'absolute',
    top: 60,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    borderWidth: 3,
    zIndex: 20,
  },
  swipeLabelLike: {
    left: Spacing.xl,
    borderColor: '#22C55E',
    backgroundColor: 'rgba(34,197,94,0.15)',
    transform: [{ rotate: '-15deg' }],
  },
  swipeLabelPass: {
    right: Spacing.xl,
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239,68,68,0.15)',
    transform: [{ rotate: '15deg' }],
  },
  swipeLabelText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 1,
  },
  cardInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  cardNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
  cardLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  cardLocation: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginLeft: 3,
  },
  cardBio: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  cardTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  cardTagText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  deckCounter: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.base + Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  reloadBtn: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 9999,
  },
  actionBtnSm: {
    width: 48,
    height: 48,
  },
  actionBtnMd: {
    width: 64,
    height: 64,
  },
  // Match modal
  matchOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  matchContent: {
    width: '100%',
    borderRadius: 28,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  matchItsTxt: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    marginBottom: Spacing.sm,
  },
  matchSubTxt: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  matchAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  matchAvatarWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
  },
  matchAvatar: {
    width: '100%',
    height: '100%',
  },
  matchHeartBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: -10,
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#fff',
  },
  matchChatBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  matchKeepBtn: {
    paddingVertical: Spacing.sm,
  },
});
