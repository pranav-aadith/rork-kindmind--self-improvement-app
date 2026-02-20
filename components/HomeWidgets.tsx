import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import {
  Flame,
  Wind,
  TrendingUp,
  TrendingDown,
  Minus,
  Smile,
  Frown,
  Meh,
  Heart,
  BookOpen,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import type { WidgetType, JournalEntry, DailyCheckIn } from '@/types';

const EMOTION_SCORES: Record<string, number> = {
  'Happy': 90, 'Grateful': 85, 'Loved': 85, 'Hopeful': 80, 'Strong': 75,
  'Calm': 70, 'Thoughtful': 60, 'Tired': 40, 'Sad': 30, 'Anxious': 25,
  'Frustrated': 20, 'Hurt': 15,
};

const JOURNAL_PROMPTS = [
  "What made you smile today?",
  "What are you grateful for right now?",
  "Write about a moment of calm today.",
  "What challenged you and how did you handle it?",
  "Describe a kindness you witnessed or gave.",
  "What would you tell your past self?",
  "What small win can you celebrate today?",
];

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface WidgetProps {
  journalEntries: JournalEntry[];
  checkIns: DailyCheckIn[];
  currentStreak: number;
  onOpenJournal: () => void;
  onOpenMeditation: () => void;
}

function MoodWidget({ journalEntries }: Pick<WidgetProps, 'journalEntries'>) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const moodData = useMemo(() => {
    const recent = journalEntries.slice(0, 5);
    if (recent.length === 0) return { emoji: '😌', label: 'No data yet', score: 50, color: Colors.light.textTertiary };

    const avg = recent.reduce((sum, j) => sum + (EMOTION_SCORES[j.emotion] || 50), 0) / recent.length;
    const latest = recent[0];

    if (avg >= 70) return { emoji: latest.emotionEmoji || '😊', label: latest.emotion, score: avg, color: '#4CAF80' };
    if (avg >= 45) return { emoji: latest.emotionEmoji || '😐', label: latest.emotion, score: avg, color: Colors.light.warning };
    return { emoji: latest.emotionEmoji || '😔', label: latest.emotion, score: avg, color: Colors.light.error };
  }, [journalEntries]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const MoodIcon = moodData.score >= 70 ? Smile : moodData.score >= 45 ? Meh : Frown;

  return (
    <TouchableOpacity
      style={[styles.widgetCard, styles.moodWidget]}
      onPress={() => router.push('/progress' as never)}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.moodRing, { borderColor: moodData.color, transform: [{ scale: pulseAnim }] }]}>
        <Text style={styles.moodEmoji}>{moodData.emoji}</Text>
      </Animated.View>
      <View style={styles.moodInfo}>
        <Text style={styles.widgetLabel}>Current Mood</Text>
        <Text style={styles.moodText}>{moodData.label}</Text>
        <View style={[styles.moodIndicator, { backgroundColor: moodData.color + '20' }]}>
          <MoodIcon size={11} color={moodData.color} />
          <Text style={[styles.moodIndicatorText, { color: moodData.color }]}>
            {Math.round(moodData.score)}%
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StreakWidget({ currentStreak }: Pick<WidgetProps, 'currentStreak'>) {
  const flameAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (currentStreak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(flameAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(flameAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 0.95, duration: 1200, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [currentStreak, flameAnim, scaleAnim]);

  const flameColor = currentStreak >= 7 ? '#FF6B35' : currentStreak >= 3 ? '#FFA726' : Colors.light.warning;

  return (
    <TouchableOpacity
      style={[styles.widgetCard, styles.streakWidget]}
      onPress={() => router.push('/progress' as never)}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.streakFlame, { backgroundColor: flameColor + '18', transform: [{ scale: scaleAnim }] }]}>
        <Animated.View style={{ opacity: flameAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }}>
          <Flame size={26} color={flameColor} />
        </Animated.View>
      </Animated.View>
      <Text style={styles.streakCount}>{currentStreak}</Text>
      <Text style={styles.widgetLabel}>Day Streak</Text>
      {currentStreak >= 3 && (
        <View style={[styles.streakBadge, { backgroundColor: flameColor + '20' }]}>
          <Text style={[styles.streakBadgeText, { color: flameColor }]}>
            {currentStreak >= 30 ? '🏆 Legend' : currentStreak >= 14 ? '⭐ On Fire' : currentStreak >= 7 ? '🔥 Hot' : '✨ Nice'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function BreathingWidget() {
  const breathAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0.6, duration: 4000, useNativeDriver: true }),
      ])
    ).start();
  }, [breathAnim]);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    router.push('/pause' as never);
  }, []);

  return (
    <TouchableOpacity
      style={[styles.widgetCard, styles.breathingWidget]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Animated.View style={[styles.breathCircle, { transform: [{ scale: breathAnim }] }]}>
        <Wind size={22} color="#FFF" />
      </Animated.View>
      <Text style={styles.breathLabel}>Breathe</Text>
      <Text style={styles.breathSub}>Tap to start</Text>
    </TouchableOpacity>
  );
}

function WeeklyPulseWidget({ checkIns, journalEntries }: Pick<WidgetProps, 'checkIns' | 'journalEntries'>) {
  const barAnims = useRef(Array.from({ length: 7 }, () => new Animated.Value(0))).current;

  const weekData = useMemo(() => {
    const now = new Date();
    const days: { label: string; score: number; hasData: boolean }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = formatLocalDate(date);
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'narrow' });

      const dayJournals = journalEntries.filter(j => {
        const jDate = new Date(j.timestamp);
        return formatLocalDate(jDate) === dateKey;
      });
      const dayCheckIn = checkIns.find(c => c.date === dateKey);

      let score = 0;
      let hasData = false;

      if (dayJournals.length > 0) {
        score = dayJournals.reduce((sum, j) => sum + (EMOTION_SCORES[j.emotion] || 50), 0) / dayJournals.length;
        hasData = true;
      } else if (dayCheckIn) {
        const checkInScore = [dayCheckIn.reactedCalmly, dayCheckIn.avoidedSnapping, dayCheckIn.wasKinder, dayCheckIn.noticedPositiveSelfTalk, dayCheckIn.feltRelaxed].filter(Boolean).length;
        score = 30 + (checkInScore / 5) * 50;
        hasData = true;
      }

      days.push({ label: dayLabel, score, hasData });
    }
    return days;
  }, [checkIns, journalEntries]);

  useEffect(() => {
    Animated.stagger(80, barAnims.map((anim, i) =>
      Animated.spring(anim, { toValue: weekData[i].hasData ? weekData[i].score / 100 : 0.05, tension: 40, friction: 8, useNativeDriver: false })
    )).start();
  }, [weekData, barAnims]);

  const getBarColor = (score: number) => {
    if (score >= 70) return '#4CAF80';
    if (score >= 45) return Colors.light.warning;
    return Colors.light.error;
  };

  return (
    <TouchableOpacity
      style={[styles.widgetCard, styles.weeklyWidget]}
      onPress={() => router.push('/progress' as never)}
      activeOpacity={0.8}
    >
      <Text style={styles.widgetLabel}>Weekly Pulse</Text>
      <View style={styles.barsRow}>
        {weekData.map((day, i) => (
          <View key={i} style={styles.barColumn}>
            <View style={styles.barTrack}>
              <Animated.View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: day.hasData ? getBarColor(day.score) : Colors.light.border,
                    height: barAnims[i].interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, i === 6 && styles.barLabelToday]}>{day.label}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

function WellbeingWidget({ journalEntries, checkIns }: Pick<WidgetProps, 'journalEntries' | 'checkIns'>) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  const wellbeing = useMemo(() => {
    const now = new Date();
    const scores: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = formatLocalDate(date);

      const dayJournals = journalEntries.filter(j => formatLocalDate(new Date(j.timestamp)) === dateKey);
      const dayCheckIn = checkIns.find(c => c.date === dateKey);

      if (dayJournals.length > 0) {
        scores.push(dayJournals.reduce((sum, j) => sum + (EMOTION_SCORES[j.emotion] || 50), 0) / dayJournals.length);
      } else if (dayCheckIn) {
        const s = [dayCheckIn.reactedCalmly, dayCheckIn.avoidedSnapping, dayCheckIn.wasKinder, dayCheckIn.noticedPositiveSelfTalk, dayCheckIn.feltRelaxed].filter(Boolean).length;
        scores.push(30 + (s / 5) * 50);
      }
    }

    if (scores.length === 0) return { score: 50, trend: 0 };
    const avg = scores.reduce((s, v) => s + v, 0) / scores.length;

    const lastWeekJournals = journalEntries.filter(j => {
      const d = new Date(j.timestamp);
      const daysAgo = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo >= 7 && daysAgo < 14;
    });
    const lastAvg = lastWeekJournals.length > 0
      ? lastWeekJournals.reduce((s, j) => s + (EMOTION_SCORES[j.emotion] || 50), 0) / lastWeekJournals.length
      : 50;

    return { score: Math.round(avg), trend: Math.round(avg - lastAvg) };
  }, [journalEntries, checkIns]);

  useEffect(() => {
    Animated.timing(progressAnim, { toValue: wellbeing.score / 100, duration: 1200, useNativeDriver: false }).start();
  }, [wellbeing.score, progressAnim]);

  const scoreColor = wellbeing.score >= 70 ? '#4CAF80' : wellbeing.score >= 45 ? Colors.light.warning : Colors.light.error;
  const TrendIcon = wellbeing.trend > 0 ? TrendingUp : wellbeing.trend < 0 ? TrendingDown : Minus;

  return (
    <TouchableOpacity
      style={[styles.widgetCard, styles.wellbeingWidget]}
      onPress={() => router.push('/progress' as never)}
      activeOpacity={0.8}
    >
      <View style={styles.wellbeingTop}>
        <View>
          <Text style={styles.widgetLabel}>Wellbeing</Text>
          <View style={styles.wellbeingScoreRow}>
            <Text style={[styles.wellbeingScore, { color: scoreColor }]}>{wellbeing.score}%</Text>
            <View style={[styles.trendChip, { backgroundColor: (wellbeing.trend >= 0 ? '#4CAF80' : Colors.light.error) + '15' }]}>
              <TrendIcon size={10} color={wellbeing.trend >= 0 ? '#4CAF80' : Colors.light.error} />
              <Text style={[styles.trendText, { color: wellbeing.trend >= 0 ? '#4CAF80' : Colors.light.error }]}>
                {wellbeing.trend > 0 ? '+' : ''}{wellbeing.trend}%
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.wellbeingCircle, { borderColor: scoreColor + '30' }]}>
          <Sparkles size={18} color={scoreColor} />
        </View>
      </View>
      <View style={styles.wellbeingBar}>
        <Animated.View
          style={[
            styles.wellbeingBarFill,
            {
              backgroundColor: scoreColor,
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
            },
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

function JournalWidget({ onOpenJournal }: Pick<WidgetProps, 'onOpenJournal'>) {
  const prompt = useMemo(() => {
    const idx = new Date().getDate() % JOURNAL_PROMPTS.length;
    return JOURNAL_PROMPTS[idx];
  }, []);

  const handlePress = useCallback(() => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onOpenJournal();
  }, [onOpenJournal]);

  return (
    <TouchableOpacity
      style={[styles.widgetCard, styles.journalWidget]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.journalIcon}>
        <BookOpen size={18} color={Colors.light.primary} />
      </View>
      <Text style={styles.journalPrompt}>{prompt}</Text>
      <View style={styles.journalCta}>
        <Heart size={11} color={Colors.light.secondary} />
        <Text style={styles.journalCtaText}>Tap to write</Text>
      </View>
    </TouchableOpacity>
  );
}

interface HomeWidgetsProps {
  activeWidgetIds: WidgetType[];
  journalEntries: JournalEntry[];
  checkIns: DailyCheckIn[];
  currentStreak: number;
  onOpenJournal: () => void;
  onOpenMeditation: () => void;
}

export default function HomeWidgets({
  activeWidgetIds,
  journalEntries,
  checkIns,
  currentStreak,
  onOpenJournal,
  onOpenMeditation,
}: HomeWidgetsProps) {
  const renderWidget = useCallback((id: WidgetType) => {
    switch (id) {
      case 'mood':
        return <MoodWidget key={id} journalEntries={journalEntries} />;
      case 'streak':
        return <StreakWidget key={id} currentStreak={currentStreak} />;
      case 'breathing':
        return <BreathingWidget key={id} />;
      case 'weekly':
        return <WeeklyPulseWidget key={id} checkIns={checkIns} journalEntries={journalEntries} />;
      case 'wellbeing':
        return <WellbeingWidget key={id} journalEntries={journalEntries} checkIns={checkIns} />;
      case 'journal':
        return <JournalWidget key={id} onOpenJournal={onOpenJournal} />;
      default:
        return null;
    }
  }, [journalEntries, checkIns, currentStreak, onOpenJournal]);

  const halfWidgets: WidgetType[] = ['mood', 'streak', 'breathing'];
  const fullWidgets: WidgetType[] = ['wellbeing', 'weekly', 'journal'];

  const rows: React.ReactNode[] = [];
  const halfQueue: WidgetType[] = [];

  activeWidgetIds.forEach(id => {
    if (fullWidgets.includes(id)) {
      if (halfQueue.length > 0) {
        const batch = halfQueue.splice(0, halfQueue.length);
        for (let i = 0; i < batch.length; i += 2) {
          if (i + 1 < batch.length) {
            rows.push(
              <View key={`row-${batch[i]}-${batch[i+1]}`} style={styles.widgetRow}>
                {renderWidget(batch[i])}
                {renderWidget(batch[i + 1])}
              </View>
            );
          } else {
            rows.push(
              <View key={`row-${batch[i]}`} style={styles.widgetRow}>
                {renderWidget(batch[i])}
                <View style={styles.widgetHalf} />
              </View>
            );
          }
        }
      }
      rows.push(renderWidget(id));
    } else {
      halfQueue.push(id);
    }
  });

  if (halfQueue.length > 0) {
    for (let i = 0; i < halfQueue.length; i += 2) {
      if (i + 1 < halfQueue.length) {
        rows.push(
          <View key={`row-${halfQueue[i]}-${halfQueue[i+1]}`} style={styles.widgetRow}>
            {renderWidget(halfQueue[i])}
            {renderWidget(halfQueue[i + 1])}
          </View>
        );
      } else {
        rows.push(
          <View key={`row-${halfQueue[i]}`} style={styles.widgetRow}>
            {renderWidget(halfQueue[i])}
            <View style={styles.widgetHalf} />
          </View>
        );
      }
    }
  }

  if (rows.length === 0) return null;

  return <View style={styles.container}>{rows}</View>;
}

const styles = StyleSheet.create({
  container: { gap: 12 },

  widgetRow: { flexDirection: 'row', gap: 12 },
  widgetHalf: { flex: 1 },
  widgetCard: { backgroundColor: Colors.light.card, borderRadius: 18, padding: 16, overflow: 'hidden' },

  moodWidget: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  moodRing: { width: 56, height: 56, borderRadius: 28, borderWidth: 3, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.light.subtle },
  moodEmoji: { fontSize: 26 },
  moodInfo: { flex: 1, gap: 3 },
  moodText: { fontSize: 16, fontWeight: '700' as const, color: Colors.light.text },
  moodIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start' },
  moodIndicatorText: { fontSize: 11, fontWeight: '700' as const },

  streakWidget: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 130 },
  streakFlame: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  streakCount: { fontSize: 32, fontWeight: '800' as const, color: Colors.light.text, letterSpacing: -1 },
  streakBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3, marginTop: 2 },
  streakBadgeText: { fontSize: 10, fontWeight: '700' as const },

  breathingWidget: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 130, backgroundColor: '#E8F4F2' },
  breathCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.light.secondary, justifyContent: 'center', alignItems: 'center', marginBottom: 2 },
  breathLabel: { fontSize: 15, fontWeight: '700' as const, color: Colors.light.text },
  breathSub: { fontSize: 11, color: Colors.light.textSecondary },

  weeklyWidget: { gap: 12 },
  barsRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-end', height: 60 },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barTrack: { width: '100%', height: 50, backgroundColor: Colors.light.subtle, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: 6, minHeight: 3 },
  barLabel: { fontSize: 9, fontWeight: '600' as const, color: Colors.light.textTertiary },
  barLabelToday: { color: Colors.light.text, fontWeight: '700' as const },

  wellbeingWidget: { gap: 10 },
  wellbeingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wellbeingScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  wellbeingScore: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -1 },
  trendChip: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trendText: { fontSize: 11, fontWeight: '700' as const },
  wellbeingCircle: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  wellbeingBar: { height: 6, backgroundColor: Colors.light.subtle, borderRadius: 3, overflow: 'hidden' },
  wellbeingBarFill: { height: '100%', borderRadius: 3 },

  journalWidget: { gap: 10, borderLeftWidth: 3, borderLeftColor: Colors.light.primary },
  journalIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: Colors.light.primary + '15', justifyContent: 'center', alignItems: 'center' },
  journalPrompt: { fontSize: 15, fontWeight: '600' as const, color: Colors.light.text, lineHeight: 22 },
  journalCta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  journalCtaText: { fontSize: 12, fontWeight: '600' as const, color: Colors.light.secondary },

  widgetLabel: { fontSize: 11, fontWeight: '600' as const, color: Colors.light.textSecondary, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
});
