import { router } from 'expo-router';
import { Heart, BookOpen, Flower, BarChart3, Timer, ChevronRight, LayoutGrid } from 'lucide-react-native';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import { getDailyQuote } from '@/constants/quotes';
import MeditationModal from '@/components/MeditationModal';
import JournalModal from '@/components/JournalModal';
import WidgetModal from '@/components/WidgetModal';

export default function HomeScreen() {
  const { data, hasCheckedInToday, addJournalEntry } = useKindMind();
  const dailyQuote = getDailyQuote();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;

  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(200),
      Animated.timing(quoteAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(400),
      Animated.timing(statsAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
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

  const handleSaveJournal = useCallback((entry: { gratitude: string; reflection: string; emotion: string; emotionEmoji: string }) => {
    addJournalEntry(entry);
  }, [addJournalEntry]);

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>{getTimeOfDay()}</Text>
          <Text style={styles.username}>{data.username || 'there'}</Text>
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

        <Animated.View style={[styles.streakCard, { opacity: statsAnim, transform: [{ translateY: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.streakIconWrap}>
            <Flower size={22} color={Colors.light.secondary} />
          </View>
          <View style={styles.streakInfo}>
            <Text style={styles.streakNumber}>{data.currentStreak}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        </Animated.View>

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
  header: { paddingTop: 20, paddingBottom: 28 },
  greeting: { fontSize: 15, fontWeight: '500' as const, color: Colors.light.textSecondary, letterSpacing: 0.3, marginBottom: 4 },
  username: { fontSize: 30, fontWeight: '700' as const, color: Colors.light.text, letterSpacing: -0.5 },
  quoteCard: { backgroundColor: Colors.light.card, borderRadius: 16, marginBottom: 20, flexDirection: 'row', overflow: 'hidden' },
  quoteAccent: { width: 4, backgroundColor: Colors.light.accent },
  quoteContent: { flex: 1, padding: 18 },
  quoteText: { fontSize: 15, lineHeight: 24, color: Colors.light.text, fontWeight: '400' as const, fontStyle: 'italic' as const, letterSpacing: 0.1 },
  quoteActions: { flexDirection: 'row', marginTop: 14 },
  quoteActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 5, paddingHorizontal: 10, backgroundColor: Colors.light.subtle, borderRadius: 8 },
  quoteActionText: { fontSize: 12, fontWeight: '500' as const, color: Colors.light.textSecondary },
  checkInBanner: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  checkInLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  checkInDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.light.secondary },
  bannerTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 1 },
  bannerText: { fontSize: 13, color: Colors.light.textSecondary },
  streakCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.card, borderRadius: 14, padding: 18, marginBottom: 28, gap: 14 },
  streakIconWrap: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.light.subtle, justifyContent: 'center', alignItems: 'center' },
  streakInfo: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  streakNumber: { fontSize: 28, fontWeight: '700' as const, color: Colors.light.text, letterSpacing: -0.5 },
  streakLabel: { fontSize: 14, fontWeight: '500' as const, color: Colors.light.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 14, letterSpacing: -0.3 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLink: { fontSize: 14, color: Colors.light.secondary, fontWeight: '600' as const },
  actionsGrid: { gap: 12, marginBottom: 28 },
  actionCardWrap: {},
  actionRow: { flexDirection: 'row', gap: 12 },
  actionCardHalf: { flex: 1 },
  actionCard: { borderRadius: 16, padding: 20 },
  actionCardSmall: { padding: 18, alignItems: 'flex-start', gap: 12 },
  actionIconWrap: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  actionTitle: { fontSize: 18, fontWeight: '700' as const, marginBottom: 4 },
  actionTitleSmall: { fontSize: 16, fontWeight: '600' as const },
  actionDesc: { fontSize: 13, lineHeight: 19 },
  goalsContainer: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 18, marginBottom: 28, gap: 14 },
  goalItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  goalDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.light.secondary },
  goalText: { flex: 1, fontSize: 15, color: Colors.light.text, fontWeight: '500' as const },
  analyticsCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  analyticsLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  analyticsTitle: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.text, marginBottom: 1 },
  analyticsText: { fontSize: 13, color: Colors.light.textSecondary },
  entriesContainer: { gap: 10, marginBottom: 28 },
  entryCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 16 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  entryEmoji: { fontSize: 18 },
  entryEmotion: { fontSize: 14, fontWeight: '600' as const, color: Colors.light.text, flex: 1 },
  entryTime: { fontSize: 12, color: Colors.light.textTertiary },
  entryText: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 20 },
  bottomSpacer: { height: 30 },
});
