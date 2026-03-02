import { router } from 'expo-router';
import { Heart, BookOpen, Flower, BarChart3, Timer, ChevronRight, LayoutGrid, Sparkles, Check, Trophy, Target, MessageCircle, RefreshCw, Flame, Minus } from 'lucide-react-native';
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
  ActivityIndicator,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import { getDailyQuote } from '@/constants/quotes';
import { getSmartInsight, INTENTIONS } from '@/constants/personalization';
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
  const smartInsight = useMemo(() => getSmartInsight({
    checkIns: data.checkIns,
    triggers: data.triggers,
    journalEntries: data.journalEntries,
    currentStreak: data.currentStreak,
  }), [data.checkIns, data.triggers, data.journalEntries, data.currentStreak]);

  const formatLocalDate = useCallback((date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const wellbeingData = useMemo(() => {
    const now = new Date();
    const emotionScores: Record<string, number> = {
      'Happy': 90, 'Grateful': 85, 'Loved': 85, 'Hopeful': 80, 'Strong': 75,
      'Calm': 70, 'Thoughtful': 60, 'Tired': 40, 'Sad': 30, 'Anxious': 25,
      'Frustrated': 20, 'Hurt': 15,
    };

    const dayScores: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = formatLocalDate(date);

      const dayJournals = data.journalEntries.filter(j => {
        const jDate = new Date(j.timestamp);
        return formatLocalDate(jDate) === dateKey;
      });

      const dayCheckIn = data.checkIns.find(c => c.date === dateKey);

      let score = 50;
      if (dayJournals.length > 0) {
        score = dayJournals.reduce((sum, j) => sum + (emotionScores[j.emotion] || 50), 0) / dayJournals.length;
      } else if (dayCheckIn) {
        const checkInScore = [dayCheckIn.reactedCalmly, dayCheckIn.avoidedSnapping, dayCheckIn.wasKinder, dayCheckIn.noticedPositiveSelfTalk, dayCheckIn.feltRelaxed].filter(Boolean).length;
        score = 30 + (checkInScore / 5) * 50;
      }
      dayScores.push(score);
    }

    const validScores = dayScores;
    const avgScore = validScores.reduce((s, v) => s + v, 0) / validScores.length;

    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(now.getDate() - 13);
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(now.getDate() - 7);

    const lastWeekJournals = data.journalEntries.filter(j => {
      const jDate = new Date(j.timestamp);
      return jDate >= lastWeekStart && jDate < lastWeekEnd;
    });

    const lastWeekAvg = lastWeekJournals.length > 0
      ? lastWeekJournals.reduce((sum, j) => sum + (emotionScores[j.emotion] || 50), 0) / lastWeekJournals.length
      : 50;

    const trend = avgScore - lastWeekAvg;
    const trendPercent = lastWeekAvg !== 0 ? Math.round((trend / lastWeekAvg) * 100) : 0;

    return { avgScore, trendPercent };
  }, [data.journalEntries, data.checkIns, formatLocalDate]);

  const [koraSuggestion, setKoraSuggestion] = useState<string | null>(null);
  const [koraLoading, setKoraLoading] = useState(false);
  const [koraKey, setKoraKey] = useState(0);

  const fetchKoraSuggestion = useCallback(async () => {
    if (wellbeingData.trendPercent >= 0) {
      setKoraSuggestion(null);
      return;
    }
    setKoraLoading(true);
    try {
      const recentEmotions = data.journalEntries.slice(0, 5).map(j => j.emotion).join(', ');
      const recentCheckIns = data.checkIns.slice(0, 3);
      const calmDays = recentCheckIns.filter(c => c.reactedCalmly).length;
      const prompt = `You are Kora, a warm and empathetic AI wellness coach inside the KindMind app. The user's overall wellbeing trend is ${wellbeingData.trendPercent}% (negative means declining). Their recent emotions: ${recentEmotions || 'none recorded'}. Calm days recently: ${calmDays}/${recentCheckIns.length}. Current streak: ${data.currentStreak} days.

Give a personalized, caring response in exactly 4-5 sentences. Structure it like this:
1. First, acknowledge how they might be feeling based on their recent emotions (1 sentence).
2. Then give ONE specific mental wellness tip they can use right now — for example: "Try the 5-4-3-2-1 grounding technique: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste" or "Practice reframing one negative thought today — instead of 'I can't handle this,' try 'This is hard, but I've gotten through hard things before'" or "Spend 2 minutes doing a body scan: close your eyes and slowly notice tension from your head down to your toes, releasing each area as you go" (1-2 sentences).
3. Finally, suggest using ONE specific KindMind feature with a real reason why it helps — for example: "The Pause breathing exercise uses a 4-7-8 pattern that activates your parasympathetic nervous system and naturally lowers stress" or "A 5-minute guided meditation can reduce cortisol levels and help reset your emotional baseline" or "Journaling about one thing you're grateful for rewires your brain to notice positives over time" or "Talking to me (Kora) can help you process what you're feeling without judgment" (1-2 sentences).

Be warm, specific, and genuinely helpful. Don't use bullet points or markdown. Don't mention the percentage. Vary your suggestions — don't always recommend the same thing.`;
      const result = await generateText(prompt);
      setKoraSuggestion(result);
    } catch (error) {
      console.error('[Home] Kora suggestion error:', error);
      setKoraSuggestion('It sounds like things have felt heavy recently, and that\'s completely okay — your feelings are valid. Try the 5-4-3-2-1 grounding technique right now: notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This simple exercise pulls your mind into the present moment and interrupts anxious thought loops. When you\'re ready, try the Pause breathing exercise — the 4-7-8 breathing pattern activates your body\'s natural calming response, slowing your heart rate and easing tension in just a few rounds.');
    } finally {
      setKoraLoading(false);
    }
  }, [wellbeingData.trendPercent, data.journalEntries, data.checkIns, data.currentStreak]);

  useEffect(() => {
    if (wellbeingData.trendPercent < 0) {
      fetchKoraSuggestion();
    } else {
      setKoraSuggestion(null);
    }
  }, [wellbeingData.trendPercent, koraKey, fetchKoraSuggestion]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const card1Anim = useRef(new Animated.Value(0)).current;
  const card2Anim = useRef(new Animated.Value(0)).current;
  const card3Anim = useRef(new Animated.Value(0)).current;
  const koraAnim = useRef(new Animated.Value(0)).current;
  const intentionAnim = useRef(new Animated.Value(0)).current;
  const insightAnim = useRef(new Animated.Value(0)).current;

  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [showIntentionPicker, setShowIntentionPicker] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [celebratedMilestone, setCelebratedMilestone] = useState<{ title: string; description: string } | null>(null);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);
  const [selectedDayDetail, setSelectedDayDetail] = useState<{ label: string; date: string; status: 'completed' | 'missed' | 'today-pending' | 'today-completed'; completedTime?: string } | null>(null);

  const dimAnim = useRef(new Animated.Value(0)).current;
  const warmthTintAnim = useRef(new Animated.Value(0)).current;
  const emberScaleAnim = useRef(new Animated.Value(0)).current;
  const emberOpacityAnim = useRef(new Animated.Value(0)).current;
  const sparkScaleAnim = useRef(new Animated.Value(0)).current;
  const flameRiseAnim = useRef(new Animated.Value(26)).current;
  const streakOpacityAnim = useRef(new Animated.Value(0)).current;
  const flameMergeScaleAnim = useRef(new Animated.Value(1)).current;
  const flameMergeYAnim = useRef(new Animated.Value(0)).current;
  const haloScaleAnim = useRef(new Animated.Value(0.75)).current;
  const haloOpacityAnim = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(Math.max(data.currentStreak - 1, 0))).current;
  const affirmationAnim = useRef(new Animated.Value(0)).current;
  const flameFlickerAnim = useRef(new Animated.Value(1)).current;
  const barGlowAnim = useRef(new Animated.Value(0)).current;
  const todayPulseAnim = useRef(new Animated.Value(1)).current;
  const todayFlameFlickerAnim = useRef(new Animated.Value(1)).current;
  const todayShimmerAnim = useRef(new Animated.Value(-36)).current;
  const particleRiseAnims = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const particleOpacityAnims = useRef<Animated.Value[]>([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  const flameFlickerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const todayFlameFlickerLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const previousCheckInRef = useRef<boolean>(hasCheckedInToday);
  const previousStreakRef = useRef<number>(data.currentStreak);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.delay(150),
      Animated.timing(koraAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
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
  }, [data.checkIns.length, data.triggers.length, data.journalEntries.length, data.currentStreak, checkAndUpdateMilestones]);

  const weekDays = useMemo(() => {
    const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - today.getDay());

    return labels.map((label, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const dateKey = formatLocalDate(date);
      const checkIn = data.checkIns.find(c => c.date === dateKey);
      const isToday = dateKey === formatLocalDate(today);
      const status: 'completed' | 'missed' | 'today-pending' | 'today-completed' = isToday
        ? checkIn ? 'today-completed' : 'today-pending'
        : checkIn ? 'completed' : 'missed';

      return {
        label,
        dateKey,
        status,
        checkIn,
      };
    });
  }, [data.checkIns, formatLocalDate]);

  const handleDayPress = useCallback((item: typeof weekDays[number]) => {
    const completedTime = item.checkIn
      ? new Date(Number(item.checkIn.id)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
      : undefined;

    console.log('[Home] Weekly streak day pressed:', { day: item.label, status: item.status, date: item.dateKey });
    setSelectedDayDetail({
      label: item.label,
      date: item.dateKey,
      status: item.status,
      completedTime,
    });
  }, []);

  useEffect(() => {
    const shouldCelebrate = !previousCheckInRef.current && hasCheckedInToday && data.currentStreak > previousStreakRef.current;
    if (!shouldCelebrate) {
      previousCheckInRef.current = hasCheckedInToday;
      previousStreakRef.current = data.currentStreak;
      return;
    }

    console.log('[Home] Starting calm flame streak celebration', { previous: previousStreakRef.current, current: data.currentStreak });
    setShowStreakCelebration(true);
    countAnim.setValue(Math.max(data.currentStreak - 1, 0));
    dimAnim.setValue(0);
    warmthTintAnim.setValue(0);
    emberScaleAnim.setValue(0);
    emberOpacityAnim.setValue(0);
    sparkScaleAnim.setValue(0);
    flameRiseAnim.setValue(26);
    streakOpacityAnim.setValue(0);
    flameMergeScaleAnim.setValue(1);
    flameMergeYAnim.setValue(0);
    haloScaleAnim.setValue(0.75);
    haloOpacityAnim.setValue(0);
    affirmationAnim.setValue(0);
    particleRiseAnims.forEach((anim) => anim.setValue(0));
    particleOpacityAnims.forEach((anim) => anim.setValue(0));

    flameFlickerLoopRef.current?.stop();
    flameFlickerAnim.setValue(1);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(dimAnim, { toValue: 0.42, duration: 200, useNativeDriver: true }),
        Animated.timing(warmthTintAnim, { toValue: 0.15, duration: 260, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(emberOpacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(emberScaleAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(sparkScaleAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(streakOpacityAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(flameRiseAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
        Animated.timing(countAnim, { toValue: data.currentStreak + 0.18, duration: 860, useNativeDriver: false }),
      ]),
      Animated.spring(countAnim, { toValue: data.currentStreak, friction: 7, tension: 65, useNativeDriver: false }),
      Animated.parallel([
        Animated.timing(haloOpacityAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(haloScaleAnim, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(affirmationAnim, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(warmthTintAnim, { toValue: 0.24, duration: 360, useNativeDriver: true }),
      ]),
      Animated.delay(120),
      Animated.parallel([
        Animated.timing(flameMergeScaleAnim, { toValue: 0.18, duration: 420, useNativeDriver: true }),
        Animated.timing(flameMergeYAnim, { toValue: -220, duration: 420, useNativeDriver: true }),
        Animated.timing(streakOpacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dimAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
        Animated.timing(haloOpacityAnim, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(affirmationAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(warmthTintAnim, { toValue: 0, duration: 360, useNativeDriver: true }),
      ]),
    ]).start(() => {
      flameFlickerLoopRef.current?.stop();
      setShowStreakCelebration(false);
    });

    flameFlickerLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(flameFlickerAnim, { toValue: 0.9, duration: 380, useNativeDriver: true }),
        Animated.timing(flameFlickerAnim, { toValue: 1.04, duration: 360, useNativeDriver: true }),
        Animated.timing(flameFlickerAnim, { toValue: 0.96, duration: 340, useNativeDriver: true }),
        Animated.timing(flameFlickerAnim, { toValue: 1, duration: 360, useNativeDriver: true }),
      ]),
    );
    flameFlickerLoopRef.current.start();

    particleRiseAnims.forEach((riseAnim, index) => {
      Animated.sequence([
        Animated.delay(index * 120 + 850),
        Animated.parallel([
          Animated.timing(particleOpacityAnims[index], { toValue: 0.85, duration: 180, useNativeDriver: true }),
          Animated.timing(riseAnim, { toValue: 1, duration: 720, useNativeDriver: true }),
        ]),
        Animated.timing(particleOpacityAnims[index], { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });

    Animated.sequence([
      Animated.timing(todayPulseAnim, { toValue: 1.12, duration: 260, useNativeDriver: true }),
      Animated.timing(todayPulseAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.timing(todayPulseAnim, { toValue: 1.04, duration: 220, useNativeDriver: true }),
      Animated.timing(todayPulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    if (data.currentStreak > 0 && data.currentStreak % 7 === 0) {
      Animated.sequence([
        Animated.timing(barGlowAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(barGlowAnim, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]).start();
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    previousCheckInRef.current = hasCheckedInToday;
    previousStreakRef.current = data.currentStreak;
  }, [
    hasCheckedInToday,
    data.currentStreak,
    countAnim,
    dimAnim,
    warmthTintAnim,
    emberScaleAnim,
    emberOpacityAnim,
    sparkScaleAnim,
    flameRiseAnim,
    streakOpacityAnim,
    flameMergeScaleAnim,
    flameMergeYAnim,
    haloScaleAnim,
    haloOpacityAnim,
    affirmationAnim,
    flameFlickerAnim,
    todayPulseAnim,
    barGlowAnim,
    particleRiseAnims,
    particleOpacityAnims,
  ]);

  useEffect(() => {
    if (hasCheckedInToday) {
      return;
    }

    todayShimmerAnim.setValue(-36);
    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(todayShimmerAnim, { toValue: 36, duration: 900, useNativeDriver: true }),
        Animated.delay(1200),
      ]),
    );
    shimmerLoop.start();

    return () => {
      shimmerLoop.stop();
    };
  }, [hasCheckedInToday, todayShimmerAnim]);

  useEffect(() => {
    todayFlameFlickerLoopRef.current?.stop();
    if (!hasCheckedInToday) {
      todayFlameFlickerAnim.setValue(1);
      return;
    }

    todayFlameFlickerLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(todayFlameFlickerAnim, { toValue: 0.92, duration: 500, useNativeDriver: true }),
        Animated.timing(todayFlameFlickerAnim, { toValue: 1.05, duration: 480, useNativeDriver: true }),
        Animated.timing(todayFlameFlickerAnim, { toValue: 0.96, duration: 420, useNativeDriver: true }),
        Animated.timing(todayFlameFlickerAnim, { toValue: 1, duration: 440, useNativeDriver: true }),
      ]),
    );
    todayFlameFlickerLoopRef.current.start();

    return () => {
      todayFlameFlickerLoopRef.current?.stop();
    };
  }, [hasCheckedInToday, todayFlameFlickerAnim]);

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

  const handleRefreshKora = useCallback(() => {
    setKoraKey(prev => prev + 1);
    fetchKoraSuggestion();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [fetchKoraSuggestion]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.greeting}>{getTimeOfDay()}</Text>
          <Text style={styles.username}>{displayName}</Text>
        </Animated.View>

        <View style={styles.weekStreakContainer} testID="weekly-streak-bar">
          <Animated.View style={[styles.weekStreakGlowOverlay, { opacity: barGlowAnim }]} />
          <View style={styles.weekStreakHeader}>
            <Text style={styles.weekStreakTitle}>Weekly Rhythm</Text>
            <View style={styles.weekStreakCountPill}>
              <Flame size={12} color={Colors.light.card} />
              <Text style={styles.weekStreakCountText}>{data.currentStreak} streak</Text>
            </View>
          </View>
          <View style={styles.weekDaysRow}>
            {weekDays.map((item) => {
              const isToday = item.status === 'today-completed' || item.status === 'today-pending';
              const isCompleted = item.status === 'completed' || item.status === 'today-completed';
              const circleStyles = [
                styles.weekDayCircle,
                item.status === 'missed' && styles.weekDayCircleMissed,
                item.status === 'today-pending' && styles.weekDayCirclePending,
                isCompleted && styles.weekDayCircleCompleted,
                item.status === 'today-completed' && styles.weekDayCircleTodayCompleted,
              ];

              return (
                <Pressable key={item.label} onPress={() => handleDayPress(item)} style={styles.weekDayWrap} testID={`week-day-${item.label.toLowerCase()}`}>
                  <Animated.View style={[circleStyles, isToday ? { transform: [{ scale: todayPulseAnim }] } : undefined]}>
                    {item.status === 'today-pending' && (
                      <Animated.View style={[styles.weekDayShimmer, { transform: [{ translateX: todayShimmerAnim }] }]} />
                    )}
                    {(item.status === 'completed' || item.status === 'today-completed') && (
                      item.status === 'today-completed' ? (
                        <Animated.View style={{ opacity: todayFlameFlickerAnim, transform: [{ scale: todayFlameFlickerAnim }] }}>
                          <Flame size={12} color={Colors.light.card} />
                        </Animated.View>
                      ) : (
                        <Flame size={12} color={Colors.light.card} />
                      )
                    )}
                    {item.status === 'missed' && <Minus size={12} color={Colors.light.textTertiary} />}
                  </Animated.View>
                  <Text style={[styles.weekDayLabel, isToday && styles.weekDayLabelToday]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {(wellbeingData.trendPercent < 0 && (koraSuggestion || koraLoading)) && (
          <Animated.View style={[styles.koraCard, { opacity: koraAnim, transform: [{ translateY: koraAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }]}>
            <View style={styles.koraHeader}>
              <View style={styles.koraIconWrap}>
                <MessageCircle size={18} color={Colors.light.card} />
              </View>
              <View style={styles.koraBadge}>
                <Sparkles size={10} color={Colors.light.card} />
                <Text style={styles.koraBadgeText}>Kora</Text>
              </View>
              <TouchableOpacity onPress={handleRefreshKora} style={styles.koraRefreshBtn} activeOpacity={0.7}>
                <RefreshCw size={14} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.koraTitle}>Your wellbeing could use a boost</Text>
            {koraLoading ? (
              <View style={styles.koraLoadingWrap}>
                <ActivityIndicator size="small" color={Colors.light.secondary} />
                <Text style={styles.koraLoadingText}>Kora is thinking...</Text>
              </View>
            ) : (
              <Text style={styles.koraMessage}>{koraSuggestion}</Text>
            )}
            <View style={styles.koraActions}>
              <TouchableOpacity style={styles.koraActionBtn} onPress={() => router.push('/pause')} activeOpacity={0.7}>
                <Heart size={13} color={Colors.light.secondary} />
                <Text style={styles.koraActionText}>Breathe</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.koraActionBtn} onPress={() => setShowJournalModal(true)} activeOpacity={0.7}>
                <BookOpen size={13} color={Colors.light.secondary} />
                <Text style={styles.koraActionText}>Journal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.koraActionBtn} onPress={() => router.push('/responses')} activeOpacity={0.7}>
                <MessageCircle size={13} color={Colors.light.secondary} />
                <Text style={styles.koraActionText}>Talk to Kora</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

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

      {showStreakCelebration && (
        <View style={styles.celebrationOverlay} pointerEvents="none" testID="streak-celebration-overlay">
          <Animated.View style={[styles.celebrationDim, { opacity: dimAnim }]} />
          <Animated.View style={[styles.celebrationWarmTint, { opacity: warmthTintAnim }]} />
          <Animated.View style={[styles.celebrationCore, { transform: [{ translateY: flameMergeYAnim }, { scale: flameMergeScaleAnim }] }]}> 
            <Animated.View style={[styles.emberGlow, { opacity: emberOpacityAnim, transform: [{ scale: emberScaleAnim }] }]} />
            <Animated.View style={[styles.sparkCore, { transform: [{ scale: sparkScaleAnim }] }]} />
            <Animated.View style={[styles.haloRing, { opacity: haloOpacityAnim, transform: [{ scale: haloScaleAnim }] }]} />
            {particleRiseAnims.map((particleAnim, index) => (
              <Animated.View
                key={`particle-${index}`}
                style={[
                  styles.glowParticle,
                  index === 0 ? styles.glowParticleLeft : index === 1 ? styles.glowParticleCenter : styles.glowParticleRight,
                  {
                    opacity: particleOpacityAnims[index],
                    transform: [
                      { translateY: particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -48] }) },
                      { scale: particleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) },
                    ],
                  },
                ]}
              />
            ))}
            <Animated.View
              style={[
                styles.celebrationContent,
                {
                  opacity: streakOpacityAnim,
                  transform: [{ translateY: flameRiseAnim }],
                },
              ]}
            >
              <Animated.View style={{ transform: [{ scale: flameFlickerAnim }] }}>
                <Flame size={42} color={Colors.light.accent} />
              </Animated.View>
              <Animated.Text style={styles.celebrationCount}>{countAnim.interpolate({ inputRange: [0, 200], outputRange: ['0', '200'] })}</Animated.Text>
              <Animated.View style={{ opacity: affirmationAnim, transform: [{ translateY: affirmationAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }}>
                <Text style={styles.celebrationTitle}>{`${data.currentStreak} Day Streak`}</Text>
                <Text style={styles.celebrationSubtitle}>Keep your flame alive.</Text>
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </View>
      )}

      <Modal visible={selectedDayDetail !== null} transparent animationType="fade" onRequestClose={() => setSelectedDayDetail(null)}>
        <Pressable style={styles.dayDetailOverlay} onPress={() => setSelectedDayDetail(null)} testID="day-detail-overlay">
          <Pressable style={styles.dayDetailCard} onPress={() => {}} testID="day-detail-card">
            <Text style={styles.dayDetailTitle}>{selectedDayDetail?.label ?? ''}</Text>
            <Text style={styles.dayDetailDate}>{selectedDayDetail?.date ?? ''}</Text>
            <Text style={styles.dayDetailStatus}>
              {selectedDayDetail?.status === 'today-completed' || selectedDayDetail?.status === 'completed'
                ? `Completed${selectedDayDetail?.completedTime ? ` at ${selectedDayDetail.completedTime}` : ''}`
                : selectedDayDetail?.status === 'today-pending'
                  ? 'Not completed yet'
                  : 'Missed day'}
            </Text>
          </Pressable>
        </Pressable>
      </Modal>

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

  koraCard: { backgroundColor: Colors.light.card, borderRadius: 16, padding: 18, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: Colors.light.secondary },
  koraHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  koraIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.light.secondary, justifyContent: 'center', alignItems: 'center' },
  koraBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.light.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  koraBadgeText: { fontSize: 10, fontWeight: '700' as const, color: Colors.light.card, letterSpacing: 0.3 },
  koraRefreshBtn: { marginLeft: 'auto' as const, padding: 6 },
  koraTitle: { fontSize: 16, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 8, letterSpacing: -0.2 },
  koraMessage: { fontSize: 14, color: Colors.light.textSecondary, lineHeight: 22 },
  koraLoadingWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  koraLoadingText: { fontSize: 13, color: Colors.light.textTertiary, fontStyle: 'italic' as const },
  koraActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  koraActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 7, paddingHorizontal: 12, backgroundColor: Colors.light.subtle, borderRadius: 10 },
  koraActionText: { fontSize: 12, fontWeight: '600' as const, color: Colors.light.secondary },

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

  weekStreakContainer: { backgroundColor: Colors.light.card, borderRadius: 18, padding: 14, marginBottom: 16, overflow: 'hidden' },
  weekStreakGlowOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFD8A8' },
  weekStreakHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  weekStreakTitle: { fontSize: 14, fontWeight: '700' as const, color: Colors.light.text, letterSpacing: 0.2 },
  weekStreakCountPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: Colors.light.secondary },
  weekStreakCountText: { fontSize: 11, fontWeight: '700' as const, color: Colors.light.card },
  weekDaysRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDayWrap: { alignItems: 'center', gap: 5 },
  weekDayCircle: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#EAE7E1', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  weekDayCircleCompleted: { backgroundColor: Colors.light.primary, shadowColor: Colors.light.primary, shadowOpacity: 0.25, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  weekDayCircleTodayCompleted: { borderWidth: 2, borderColor: Colors.light.accent },
  weekDayCirclePending: { borderWidth: 1.5, borderColor: Colors.light.secondary, backgroundColor: Colors.light.card },
  weekDayCircleMissed: { backgroundColor: '#E9E5E0' },
  weekDayShimmer: { position: 'absolute' as const, width: 14, height: 40, backgroundColor: 'rgba(255,179,102,0.35)', transform: [{ rotate: '20deg' }] },
  weekDayLabel: { fontSize: 11, color: Colors.light.textSecondary, fontWeight: '500' as const },
  weekDayLabelToday: { color: Colors.light.text, fontWeight: '700' as const },

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

  celebrationOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 200 },
  celebrationDim: { ...StyleSheet.absoluteFillObject, backgroundColor: '#0B120F' },
  celebrationWarmTint: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFB86A' },
  celebrationCore: { width: 230, height: 230, borderRadius: 115, justifyContent: 'center', alignItems: 'center' },
  emberGlow: { position: 'absolute' as const, width: 148, height: 148, borderRadius: 74, backgroundColor: '#FFB567', opacity: 0.45 },
  sparkCore: { position: 'absolute' as const, width: 14, height: 14, borderRadius: 7, backgroundColor: '#FFE1B0', bottom: 88 },
  haloRing: { position: 'absolute' as const, width: 196, height: 196, borderRadius: 98, borderWidth: 2, borderColor: 'rgba(255,211,160,0.8)' },
  glowParticle: { position: 'absolute' as const, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFD9A6' },
  glowParticleLeft: { left: 90, bottom: 90 },
  glowParticleCenter: { left: 111, bottom: 80 },
  glowParticleRight: { left: 132, bottom: 92 },
  celebrationContent: { alignItems: 'center', gap: 6 },
  celebrationCount: { fontSize: 56, fontWeight: '800' as const, color: '#FFF4E2', letterSpacing: -1.2 },
  celebrationTitle: { fontSize: 22, fontWeight: '700' as const, color: '#FFF4E2', textAlign: 'center' as const },
  celebrationSubtitle: { fontSize: 14, color: 'rgba(255,244,226,0.88)', textAlign: 'center' as const, marginTop: 4 },

  dayDetailOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.28)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  dayDetailCard: { width: '100%', maxWidth: 300, backgroundColor: Colors.light.card, borderRadius: 18, padding: 18 },
  dayDetailTitle: { fontSize: 18, fontWeight: '700' as const, color: Colors.light.text, marginBottom: 4 },
  dayDetailDate: { fontSize: 13, color: Colors.light.textSecondary, marginBottom: 8 },
  dayDetailStatus: { fontSize: 14, color: Colors.light.text, lineHeight: 20 },

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
