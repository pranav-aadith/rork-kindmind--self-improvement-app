import { router } from 'expo-router';
import { Heart, BookOpen, Flower, BarChart3, Timer, ChevronRight, LayoutGrid, Sparkles, Check, Trophy, Target } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import { getDailyQuote } from '@/constants/quotes';
import { getPersonalizedTip, getSmartInsight, INTENTIONS } from '@/constants/personalization';
import MeditationModal from '@/components/MeditationModal';
import JournalModal from '@/components/JournalModal';
import WidgetModal from '@/components/WidgetModal';

export default function HomeScreen() {
  const {
    data,
    hasCheckedInToday,
    addJournalEntry,
    setDailyIntention,
    completeDailyIntention,
    checkAndUpdateMilestones,
    todaysIntention,
    unlockedMilestones,
    nextMilestone,
    displayName,
  } = useKindMind();

  const dailyQuote = getDailyQuote();
  const personalizedTip = useMemo(() => getPersonalizedTip(data.onboardingAnswers), [data.onboardingAnswers]);
  const smartInsight = useMemo(() => getSmartInsight({
    checkIns: data.checkIns,
    triggers: data.triggers,
    journalEntries: data.journalEntries,
    currentStreak: data.currentStreak,
  }), [data.checkIns, data.triggers, data.journalEntries, data.currentStreak]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const tipAnim = useRef(new Animated.Value(0)).current;
  const intentionAnim = useRef(new Animated.Value(0)).current;
  const insightAnim = useRef(new Animated.Value(0)).current;

  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showIntentionPicker, setShowIntentionPicker] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [celebratedMilestone, setCelebratedMilestone] = useState<{ title: string; description: string } | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(150),
      Animated.timing(tipAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(250),
      Animated.timing(quoteAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(350),
      Animated.timing(intentionAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(450),
      Animated.timing(statsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(500),
      Animated.timing(insightAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.stagger(150, [
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(card1Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      ]),
      Animated.spring(card2Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
      Animated.spring(card3Anim, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const milestone = checkAndUpdateMilestones();
    if (milestone) {
      setCelebratedMilestone({ title: milestone.title, description: milestone.description });
      setShowMilestoneModal(true);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }, [data.checkIns.length, data.triggers.length, data.journalEntries.length, data.currentStreak]);

  const handleSaveJournal = useCallback((entry: { gratitude: string; reflection: string; emotion: string; emotionEmoji: string }) => {
    addJournalEntry(entry);
  }, [addJournalEntry]);

  const handleSelectIntention = useCallback((intention: string) => {
    setDailyIntention(intention);
    setShowIntentionPicker(false);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [setDailyIntention]);

  const handleCompleteIntention = useCallback(() => {
    completeDailyIntention();
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [completeDailyIntention]);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const handleTipAction = useCallback(() => {
    if (personalizedTip.action === 'pause') {
      router.push('/pause');
    } else if (personalizedTip.action === 'meditation') {
      setShowMeditationModal(true);
    } else if (personalizedTip.action === 'journal') {
      setShowJournalModal(true);
    }
  }, [personalizedTip.action]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>{getTimeOfDay()}</Text>
          <Text style={styles.username}>{displayName}</Text>
        </Animated.View>

        <Animated.View style={[styles.tipCard, { opacity: tipAnim, transform: [{ translateY: tipAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>
          <View style={styles.tipHeader}>
            <View style={styles.tipEmojiWrap}>
              <Text style={styles.tipEmoji}>{personalizedTip.emoji}</Text>
            </View>
            <View style={styles.tipBadge}>
              <Sparkles size={10} color={Colors.light.card} />
              <Text style={styles.tipBadgeText}>For You</Text>
            </View>
          </View>
          <Text style={styles.tipTitle}>{personalizedTip.title}</Text>
          <Text style={styles.tipMessage}>{personalizedTip.message}</Text>
          {personalizedTip.action && (
            <TouchableOpacity style={styles.tipActionBtn} onPress={handleTipAction} activeOpacity={0.7}>
              <Text style={styles.tipActionText}>
                {personalizedTip.action === 'pause' ? 'Start Breathing' : personalizedTip.action === 'meditation' ? 'Meditate Now' : 'Write Now'}
              </Text>
              <ChevronRight size={14} color={Colors.light.secondary} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {!hasCheckedInToday && (
          <TouchableOpacity style={styles.checkInBanner} onPress={() => router.push('/checkin')} activeOpacity={0.7}>
            <View style={styles.checkInLeft}>
              <View style={styles.checkInDot} />
              <View>
                <Text style={styles.bannerTitle}>Daily Check-In</Text>
                <Text style={styles.bannerText}>How was your day?</Text>
              </View>
            </View>
            <ChevronRight size={20} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        )}

        <Animated.View style={[styles.intentionSection, { opacity: intentionAnim, transform: [{ translateY: intentionAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>
          {todaysIntention ? (
            <View style={styles.intentionCard}>
              <View style={styles.intentionHeader}>
                <Target size={16} color={Colors.light.primary} />
                <Text style={styles.intentionLabel}>{"Today's Intention"}</Text>
              </View>
              <Text style={styles.intentionText}>{todaysIntention.intention}</Text>
              {!todaysIntention.completed ? (
                <TouchableOpacity style={styles.intentionCompleteBtn} onPress={handleCompleteIntention} activeOpacity={0.7}>
                  <Check size={14} color={Colors.light.card} />
                  <Text style={styles.intentionCompleteBtnText}>Mark Complete</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.intentionCompletedBadge}>
                  <Check size={12} color={Colors.light.secondary} />
                  <Text style={styles.intentionCompletedText}>Completed</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity style={styles.setIntentionCard} onPress={() => setShowIntentionPicker(true)} activeOpacity={0.7}>
              <View style={styles.intentionHeader}>
                <Target size={16} color={Colors.light.primary} />
                <Text style={styles.intentionLabel}>{"Set Today's Intention"}</Text>
              </View>
              <Text style={styles.setIntentionHint}>Choose a focus for your day</Text>
              <ChevronRight size={16} color={Colors.light.textTertiary} style={styles.intentionChevron} />
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View style={[styles.quoteCard, { opacity: quoteAnim, transform: [{ scale: quoteAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) }] }]}>
          <View style={styles.quoteAccent} />
          <View style={styles.quoteContent}>
            <Text style={styles.quoteText}>{dailyQuote}</Text>
            <View style={styles.quoteActions}>
              <TouchableOpacity style={styles.quoteActionBtn} onPress={() => setShowWidgetModal(true)} activeOpacity={0.7}>
                <LayoutGrid size={14} color={Colors.light.textSecondary} />
                <Text style={styles.quoteActionText}>Widget</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.streakRow, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.streakCard}>
            <View style={styles.streakIconWrap}>
              <Flower size={20} color={Colors.light.secondary} />
            </View>
            <View>
              <Text style={styles.streakNumber}>{data.currentStreak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
          </View>

          {nextMilestone && (
            <View style={styles.milestoneCard}>
              <View style={styles.milestoneIconWrap}>
                <Trophy size={18} color={Colors.light.accent} />
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>Next: {nextMilestone.title}</Text>
                <Text style={styles.milestoneDesc}>{nextMilestone.description}</Text>
              </View>
            </View>
          )}
        </Animated.View>

        {smartInsight && (
          <Animated.View style={[styles.insightCard, { opacity: insightAnim, transform: [{ translateY: insightAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>
            <Text style={styles.insightEmoji}>{smartInsight.emoji}</Text>
            <Text style={styles.insightText}>{smartInsight.message}</Text>
          </Animated.View>
        )}

        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.actionsGrid}>
          <Animated.View style={[styles.actionCardWrap, { opacity: card1Anim, transform: [{ scale: card1Anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: Colors.light.primary }]} onPress={() => setShowJournalModal(true)} activeOpacity={0.85}>
              <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                <BookOpen size={22} color="#FFF" />
              </View>
              <Text style={[styles.actionTitle, { color: '#FFF' }]}>Journal</Text>
              <Text style={[styles.actionDesc, { color: 'rgba(255,255,255,0.7)' }]}>Write your thoughts</Text>
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.actionRow}>
            <Animated.View style={[styles.actionCardHalf, { opacity: card2Anim, transform: [{ scale: card2Anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
              <TouchableOpacity style={[styles.actionCard, styles.actionCardSmall, { backgroundColor: Colors.light.secondary }]} onPress={() => router.push('/pause')} activeOpacity={0.85}>
                <Heart size={20} color="#FFF" />
                <Text style={[styles.actionTitleSmall, { color: '#FFF' }]}>Pause</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={[styles.actionCardHalf, { opacity: card3Anim, transform: [{ scale: card3Anim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1] }) }] }]}>
              <TouchableOpacity style={[styles.actionCard, styles.actionCardSmall, { backgroundColor: Colors.light.accent }]} onPress={() => setShowMeditationModal(true)} activeOpacity={0.85}>
                <Timer size={20} color="#FFF" />
                <Text style={[styles.actionTitleSmall, { color: '#FFF' }]}>Meditate</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {unlockedMilestones.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Achievements</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.achievementsScroll} contentContainerStyle={styles.achievementsContainer}>
              {unlockedMilestones.slice(0, 6).map(m => (
                <View key={m.id} style={styles.achievementChip}>
                  <Trophy size={14} color={Colors.light.accent} />
                  <Text style={styles.achievementText}>{m.title}</Text>
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {data.goals.filter(g => g.selected).length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            <View style={styles.goalsContainer}>
              {data.goals.filter(g => g.selected).map(goal => (
                <View key={goal.id} style={styles.goalItem}>
                  <View style={styles.goalDot} />
                  <Text style={styles.goalText}>{goal.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity style={styles.analyticsCard} onPress={() => router.push('/progress')} activeOpacity={0.7}>
          <View style={styles.analyticsLeft}>
            <BarChart3 size={20} color={Colors.light.secondary} />
            <View>
              <Text style={styles.analyticsTitle}>View Analytics</Text>
              <Text style={styles.analyticsText}>Track your emotional patterns</Text>
            </View>
          </View>
          <ChevronRight size={18} color={Colors.light.textTertiary} />
        </TouchableOpacity>

        {data.journalEntries && data.journalEntries.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              <TouchableOpacity onPress={() => router.push('/progress')}>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.entriesContainer}>
              {data.journalEntries.slice(0, 3).map(entry => (
                <View key={entry.id} style={styles.entryCard}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryEmoji}>{entry.emotionEmoji}</Text>
                    <Text style={styles.entryEmotion}>{entry.emotion}</Text>
                    <Text style={styles.entryTime}>
                      {new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  </View>
                  <Text style={styles.entryText} numberOfLines={2}>{entry.gratitude}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={showIntentionPicker} transparent animationType="slide" onRequestClose={() => setShowIntentionPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.intentionModal}>
            <View style={styles.intentionModalHandle} />
            <Text style={styles.intentionModalTitle}>Set Your Intention</Text>
            <Text style={styles.intentionModalSubtitle}>What do you want to focus on today?</Text>
            <ScrollView style={styles.intentionList} showsVerticalScrollIndicator={false}>
              {INTENTIONS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.intentionOption}
                  onPress={() => handleSelectIntention(item.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.intentionOptionEmoji}>{item.emoji}</Text>
                  <Text style={styles.intentionOptionText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.intentionCancelBtn} onPress={() => setShowIntentionPicker(false)} activeOpacity={0.7}>
              <Text style={styles.intentionCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showMilestoneModal} transparent animationType="fade" onRequestClose={() => setShowMilestoneModal(false)}>
        <View style={styles.milestoneModalOverlay}>
          <View style={styles.milestoneModalContent}>
            <View style={styles.milestoneModalIcon}>
              <Trophy size={40} color={Colors.light.accent} />
            </View>
            <Text style={styles.milestoneModalTitle}>Achievement Unlocked!</Text>
            <Text style={styles.milestoneModalName}>{celebratedMilestone?.title ?? ''}</Text>
            <Text style={styles.milestoneModalDesc}>{celebratedMilestone?.description ?? ''}</Text>
            <TouchableOpacity style={styles.milestoneModalBtn} onPress={() => setShowMilestoneModal(false)} activeOpacity={0.7}>
              <Text style={styles.milestoneModalBtnText}>Awesome!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <MeditationModal visible={showMeditationModal} onClose={() => setShowMeditationModal(false)} />
      <JournalModal visible={showJournalModal} onClose={() => setShowJournalModal(false)} onSave={handleSaveJournal} />
      <WidgetModal visible={showWidgetModal} onClose={() => setShowWidgetModal(false)} quote={dailyQuote} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 24 },
  greeting: { fontSize: 15, fontWeight: '500' as const, color: Colors.light.textSecondary, letterSpacing: 0.3, marginBottom: 4 },
  username: { fontSize: 30, fontWeight: '700' as const, color: Colors.light.text, letterSpacing: -0.5 },

  tipCard: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 18, marginBottom: 16 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  tipEmojiWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.light.subtle, justifyContent: 'center', alignItems: 'center' },
  tipEmoji: { fontSize: 22 },
  tipBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.light.secondary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  tipBadgeText: { fontSize: 10, fontWeight: '700' as const, color: Colors.light.card, letterSpacing: 0.3 },
  tipTitle: { fontSize: 17, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 6, letterSpacing: -0.2 },
  tipMessage: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 21 },
  tipActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 14, alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 12, backgroundColor: Colors.light.subtle, borderRadius: 10 },
  tipActionText: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.secondary },

  checkInBanner: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  checkInLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkInDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.secondary },
  bannerTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 1 },
  bannerText: { fontSize: 13, color: Colors.light.textSecondary },

  intentionSection: { marginBottom: 16 },
  intentionCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16 },
  intentionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  intentionLabel: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.primary, letterSpacing: 0.2 },
  intentionText: { fontSize: 16, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 12, lineHeight: 22 },
  intentionCompleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.light.primary, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' },
  intentionCompleteBtnText: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.card },
  intentionCompletedBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start' },
  intentionCompletedText: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.secondary },
  setIntentionCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: Colors.light.border, borderStyle: 'dashed' as const },
  setIntentionHint: { fontSize: 14, color: Colors.light.textTertiary, marginTop: 4 },
  intentionChevron: { position: 'absolute' as const, right: 0, top: 0 },

  quoteCard: { backgroundColor: Colors.light.card, borderRadius: 16, marginBottom: 16, flexDirection: 'row', overflow: 'hidden' },
  quoteAccent: { width: 4, backgroundColor: Colors.light.accent },
  quoteContent: { flex: 1, padding: 18 },
  quoteText: { fontSize: 15, lineHeight: 24, color: Colors.light.text, fontWeight: '400' as const, fontStyle: 'italic' as const, letterSpacing: 0.1 },
  quoteActions: { flexDirection: 'row', marginTop: 14 },
  quoteActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.light.subtle, borderRadius: 8 },
  quoteActionText: { fontSize: 12, fontWeight: '500' as const, color: Colors.light.textSecondary },

  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  streakCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, gap: 12 },
  streakIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.light.subtle, justifyContent: 'center', alignItems: 'center' },
  streakNumber: { fontSize: 24, fontWeight: '700' as const, color: Colors.light.text, letterSpacing: -0.5 },
  streakLabel: { fontSize: 12, fontWeight: '500' as const, color: Colors.light.textSecondary },
  milestoneCard: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, gap: 10 },
  milestoneIconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5EFE8', justifyContent: 'center', alignItems: 'center' },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: 12, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 2 },
  milestoneDesc: { fontSize: 11, color: Colors.light.textSecondary },

  insightCard: { backgroundColor: '#E8F4F2', borderRadius: 14, padding: 16, marginBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  insightEmoji: { fontSize: 24 },
  insightText: { flex: 1, fontSize: 14, color: Colors.light.text, lineHeight: 21, fontWeight: '500' as const },

  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 14, letterSpacing: -0.3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLink: { fontSize: 14, color: Colors.light.secondary, fontWeight: '600' as const },

  actionsGrid: { gap: 12, marginBottom: 24 },
  actionCardWrap: {},
  actionRow: { flexDirection: 'row', gap: 12 },
  actionCardHalf: { flex: 1 },
  actionCard: { borderRadius: 16, padding: 20 },
  actionCardSmall: { padding: 18, alignItems: 'flex-start' as const, gap: 12 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  actionTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 4 },
  actionTitleSmall: { fontSize: 16, fontWeight: '600' as const },
  actionDesc: { fontSize: 13, lineHeight: 19 },

  achievementsScroll: { marginBottom: 24 },
  achievementsContainer: { gap: 10 },
  achievementChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.light.card, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: Colors.light.border },
  achievementText: { fontSize: 13, fontWeight: '600' as const, color: Colors.light.text },

  goalsContainer: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 18, marginBottom: 24, gap: 14 },
  goalItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.secondary },
  goalText: { flex: 1, fontSize: 15, color: Colors.light.text, fontWeight: '500' as const },

  analyticsCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  analyticsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  analyticsTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 1 },
  analyticsText: { fontSize: 13, color: Colors.light.textSecondary },

  entriesContainer: { gap: 10, marginBottom: 24 },
  entryCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  entryEmoji: { fontSize: 18 },
  entryEmotion: { fontSize: 14, fontWeight: '600' as const, color: Colors.light.text, flex: 1 },
  entryTime: { fontSize: 12, color: Colors.light.textTertiary },
  entryText: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },

  bottomSpacer: { height: 30 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  intentionModal: { backgroundColor: Colors.light.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40, maxHeight: '70%' },
  intentionModalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.light.border, alignSelf: 'center', marginTop: 12, marginBottom: 20 },
  intentionModalTitle: { fontSize: 22, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 6 },
  intentionModalSubtitle: { fontSize: 15, color: Colors.light.textSecondary, marginBottom: 20 },
  intentionList: { marginBottom: 16 },
  intentionOption: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, marginBottom: 10 },
  intentionOptionEmoji: { fontSize: 24 },
  intentionOptionText: { fontSize: 16, fontWeight: '500' as const, color: Colors.light.text, flex: 1 },
  intentionCancelBtn: { backgroundColor: Colors.light.subtle, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  intentionCancelText: { fontSize: 16, fontWeight: '600' as const, color: Colors.light.textSecondary },

  milestoneModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 32 },
  milestoneModalContent: { backgroundColor: Colors.light.card, borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 340 },
  milestoneModalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F5EFE8', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  milestoneModalTitle: { fontSize: 14, fontWeight: '600' as const, color: Colors.light.secondary, letterSpacing: 0.5, marginBottom: 8, textTransform: 'uppercase' as const },
  milestoneModalName: { fontSize: 24, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 8, textAlign: 'center' },
  milestoneModalDesc: { fontSize: 15, color: Colors.light.textSecondary, marginBottom: 24, textAlign: 'center' },
  milestoneModalBtn: { backgroundColor: Colors.light.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40 },
  milestoneModalBtnText: { fontSize: 16, fontWeight: '700' as const, color: Colors.light.card },
});
