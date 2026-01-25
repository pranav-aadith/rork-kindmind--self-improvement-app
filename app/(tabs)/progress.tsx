import { Flame, Target, ChevronLeft, ChevronRight, BookOpen, Calendar, Bell, Sparkles, BarChart3, Lock, Check, TrendingUp, TrendingDown, Minus, Heart, PenLine, Smile, Sun, Camera } from 'lucide-react-native';
import React, { useEffect, useRef, useCallback } from 'react';
import { captureRef } from 'react-native-view-shot';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function ProgressScreen() {
  const { data, checkInsLast30Days, successRate } = useKindMind();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  const emotionColors: Record<string, string> = {
    'Happy': '#FFD93D',
    'Calm': '#6BCB77',
    'Loved': '#FF6B9D',
    'Sad': '#748CAB',
    'Frustrated': '#FF6B6B',
    'Anxious': '#9B59B6',
    'Tired': '#95A5A6',
    'Thoughtful': '#3498DB',
    'Grateful': '#1ABC9C',
    'Strong': '#E67E22',
    'Hurt': '#5DADE2',
    'Hopeful': '#F39C12',
  };

  const topJournalEmotions = React.useMemo(() => {
    const emotionCounts: Record<string, { count: number; emoji: string }> = {};
    data.journalEntries.forEach(j => {
      if (!emotionCounts[j.emotion]) {
        emotionCounts[j.emotion] = { count: 0, emoji: j.emotionEmoji };
      }
      emotionCounts[j.emotion].count++;
    });
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 3)
      .map(([emotion, data]) => ({ 
        emotion, 
        count: data.count, 
        emoji: data.emoji,
        color: emotionColors[emotion] || Colors.light.primary 
      }));
  }, [data.journalEntries]);

  const weeklyAnalytics = React.useMemo(() => {
    const now = new Date();
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0, 0, 0, 0);
    
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    const thisWeekJournals = data.journalEntries.filter(j => j.timestamp >= startOfThisWeek.getTime());
    const lastWeekJournals = data.journalEntries.filter(j => 
      j.timestamp >= startOfLastWeek.getTime() && j.timestamp < startOfThisWeek.getTime()
    );

    const thisWeekCheckIns = data.checkIns.filter(c => {
      const checkInDate = new Date(c.date);
      return checkInDate >= startOfThisWeek;
    });

    const calmDays = thisWeekCheckIns.filter(c => c.reactedCalmly).length;

    const emotionCounts: Record<string, { count: number; emoji: string }> = {};
    thisWeekJournals.forEach(j => {
      if (!emotionCounts[j.emotion]) {
        emotionCounts[j.emotion] = { count: 0, emoji: j.emotionEmoji };
      }
      emotionCounts[j.emotion].count++;
    });
    const topEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b.count - a.count)[0];

    const positiveEmotions = ['Happy', 'Calm', 'Loved', 'Grateful', 'Strong', 'Hopeful'];
    const positiveCount = thisWeekJournals.filter(j => positiveEmotions.includes(j.emotion)).length;
    const positiveRatio = thisWeekJournals.length > 0 ? positiveCount / thisWeekJournals.length : 0;

    const journalTrend = thisWeekJournals.length - lastWeekJournals.length;

    let weeklyInsight = '';
    if (thisWeekCheckIns.length === 0 && thisWeekJournals.length === 0) {
      weeklyInsight = "Start your week with journaling and check-ins to understand your patterns.";
    } else if (positiveRatio >= 0.7 && thisWeekJournals.length >= 3) {
      weeklyInsight = "Your journal shows a positive trend! Keep nurturing this mindset.";
    } else if (calmDays >= 4) {
      weeklyInsight = "You've had several calm days. Notice what's working.";
    } else if (thisWeekJournals.length > 0 && positiveRatio < 0.3) {
      weeklyInsight = "A challenging week. Remember to practice self-compassion.";
    } else {
      weeklyInsight = "Each day is an opportunity for growth. Keep journaling!";
    }

    return {
      thisWeekJournals: thisWeekJournals.length,
      thisWeekCheckIns: thisWeekCheckIns.length,
      calmDays,
      topEmotion: topEmotion ? { emotion: topEmotion[0], emoji: topEmotion[1].emoji, count: topEmotion[1].count } : null,
      positiveRatio: Math.round(positiveRatio * 100),
      journalTrend,
      weeklyInsight,
    };
  }, [data.journalEntries, data.checkIns]);

  const achievements = [
    { id: 1, threshold: 5, title: 'Emotion Guide', icon: BookOpen, color: '#6366F1' },
    { id: 2, threshold: 7, title: 'Weekly Summary', icon: Calendar, color: '#8B5CF6' },
    { id: 3, threshold: 10, title: 'Custom Reminders', icon: Bell, color: '#EC4899' },
    { id: 4, threshold: 20, title: 'Intentions', icon: Sparkles, color: '#F59E0B' },
    { id: 5, threshold: 30, title: 'Monthly View', icon: BarChart3, color: '#10B981' },
  ];

  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [isTakingScreenshot, setIsTakingScreenshot] = React.useState(false);
  const [showExportView, setShowExportView] = React.useState(false);
  const exportViewRef = useRef<View>(null);

  const generateExportData = React.useCallback(() => {
    const now = new Date();
    const exportDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    let exportText = `KindMind Progress Report\n`;
    exportText += `Generated: ${exportDate}\n`;
    exportText += `${'='.repeat(50)}\n\n`;
    exportText += `📊 OVERVIEW\n`;
    exportText += `-`.repeat(30) + `\n`;
    exportText += `Current Streak: ${data.currentStreak} days\n`;
    exportText += `Longest Streak: ${data.longestStreak} days\n`;
    exportText += `Total Check-ins: ${data.checkIns.length}\n`;
    exportText += `Success Rate: ${successRate}%\n\n`;
    exportText += `📈 THIS WEEK\n`;
    exportText += `-`.repeat(30) + `\n`;
    exportText += `Journal Entries: ${weeklyAnalytics.thisWeekJournals}\n`;
    exportText += `Check-ins: ${weeklyAnalytics.thisWeekCheckIns}\n`;
    exportText += `Calm Days: ${weeklyAnalytics.calmDays}\n`;
    exportText += `\nInsight: ${weeklyAnalytics.weeklyInsight}\n`;

    return exportText;
  }, [data, weeklyAnalytics, successRate]);

  const handleScreenshot = React.useCallback(async () => {
    setIsTakingScreenshot(true);
    try {
      const exportText = generateExportData();

      if (Platform.OS === 'web') {
        const blob = new Blob([exportText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `kindmind-progress-${formatLocalDate(new Date())}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        Alert.alert('Success', 'Your progress report has been downloaded!');
      } else {
        setShowExportView(true);
        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              if (exportViewRef.current) {
                const uri = await captureRef(exportViewRef, { format: 'png', quality: 1, result: 'tmpfile' });
                setShowExportView(false);
                const canShare = await Sharing.isAvailableAsync();
                if (canShare) {
                  await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share Progress' });
                } else {
                  Alert.alert('Saved', 'Your progress screenshot is ready!');
                }
              } else {
                setShowExportView(false);
                Alert.alert('Error', 'Could not take screenshot.');
              }
            } catch {
              setShowExportView(false);
              Alert.alert('Error', 'Failed to take screenshot.');
            } finally {
              setIsTakingScreenshot(false);
            }
          }, 500);
        });
        return;
      }
    } catch {
      Alert.alert('Error', 'Failed to export.');
    }
    setIsTakingScreenshot(false);
  }, [generateExportData]);

  const checkInsByDate = React.useMemo(() => {
    const getScore = (c: typeof data.checkIns[0]) => [c.reactedCalmly, c.avoidedSnapping, c.wasKinder, c.noticedPositiveSelfTalk, c.feltRelaxed].filter(Boolean).length;
    const getColor = (s: number) => s >= 4 ? '#4CAF50' : s === 3 ? '#FF9800' : '#F44336';
    const map: Record<string, { score: number; color: string }> = {};
    data.checkIns.forEach(c => {
      const score = getScore(c);
      map[c.date] = { score, color: getColor(score) };
    });
    return map;
  }, [data]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    return { daysInMonth: lastDay.getDate(), startingDayOfWeek: firstDay.getDay(), year, month };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) week.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length > 0) { while (week.length < 7) week.push(null); weeks.push(week); }

    const dateKey = (day: number) => formatLocalDate(new Date(year, month, day));

    return (
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} style={styles.monthBtn}>
            <ChevronLeft size={20} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} style={styles.monthBtn}>
            <ChevronRight size={20} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={styles.weekDayText}>{d}</Text>)}
        </View>

        {weeks.map((w, wi) => (
          <View key={wi} style={styles.calendarWeek}>
            {w.map((day, di) => {
              const key = day ? dateKey(day) : `e-${wi}-${di}`;
              const checkInData = day ? checkInsByDate[dateKey(day)] : null;
              const isToday = day && formatLocalDate(new Date()) === dateKey(day);
              return (
                <View key={key} style={styles.calendarDay}>
                  {day && (
                    <>
                      <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                        <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                      </View>
                      {checkInData && <View style={[styles.checkInDot, { backgroundColor: checkInData.color }]} />}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.legendRow}>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#F44336' }]} /><Text style={styles.legendText}>0-2</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} /><Text style={styles.legendText}>3</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} /><Text style={styles.legendText}>4-5</Text></View>
        </View>
      </View>
    );
  };

  const renderExportContent = () => {
    const exportDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    return (
      <View style={styles.exportContainer}>
        <View style={styles.exportCard}>
          <Text style={styles.exportTitle}>KindMind Progress</Text>
          <Text style={styles.exportDate}>{exportDate}</Text>
          <View style={styles.exportSection}>
            <Text style={styles.exportLabel}>Overview</Text>
            <Text style={styles.exportText}>Streak: {data.currentStreak} days • Best: {data.longestStreak} days</Text>
            <Text style={styles.exportText}>Check-ins: {data.checkIns.length} • Success: {successRate}%</Text>
          </View>
          <View style={styles.exportSection}>
            <Text style={styles.exportLabel}>This Week</Text>
            <Text style={styles.exportText}>Journals: {weeklyAnalytics.thisWeekJournals} • Calm Days: {weeklyAnalytics.calmDays}</Text>
          </View>
          <Text style={styles.exportFooter}>KindMind 🌱</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {showExportView && Platform.OS !== 'web' && (
        <View style={styles.exportOverlay}>
          <View style={styles.exportViewWrapper} ref={exportViewRef} collapsable={false}>{renderExportContent()}</View>
        </View>
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>Progress</Text>
              <Text style={styles.subtitle}>Track your growth</Text>
            </View>
            <TouchableOpacity style={styles.screenshotBtn} onPress={handleScreenshot} disabled={isTakingScreenshot}>
              <Camera size={16} color={Colors.light.card} />
              <Text style={styles.screenshotBtnText}>{isTakingScreenshot ? '...' : 'Share'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statsRow, { opacity: fadeAnim }]}>
          <View style={styles.statCard}>
            <Flame size={20} color={Colors.light.primary} />
            <Text style={styles.statValue}>{data.currentStreak}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Target size={20} color={Colors.light.secondary} />
            <Text style={styles.statValue}>{data.longestStreak}</Text>
            <Text style={styles.statLabel}>Best</Text>
          </View>
          <View style={styles.statCard}>
            <Heart size={20} color={Colors.light.accent} />
            <Text style={styles.statValue}>{successRate}%</Text>
            <Text style={styles.statLabel}>Success</Text>
          </View>
        </Animated.View>

        <View style={styles.insightCard}>
          <View style={styles.insightHeader}>
            <Sparkles size={16} color="#F59E0B" />
            <Text style={styles.insightTitle}>Weekly Insight</Text>
          </View>
          <Text style={styles.insightText}>{weeklyAnalytics.weeklyInsight}</Text>
        </View>

        <Text style={styles.sectionLabel}>This Week</Text>
        <View style={styles.analyticsGrid}>
          <View style={styles.analyticsCard}>
            <PenLine size={16} color="#6366F1" />
            <Text style={styles.analyticsValue}>{weeklyAnalytics.thisWeekJournals}</Text>
            <Text style={styles.analyticsLabel}>Journals</Text>
            <View style={styles.trendRow}>
              {weeklyAnalytics.journalTrend > 0 ? <TrendingUp size={12} color="#10B981" /> : weeklyAnalytics.journalTrend < 0 ? <TrendingDown size={12} color="#EF4444" /> : <Minus size={12} color={Colors.light.textSecondary} />}
              <Text style={[styles.trendText, weeklyAnalytics.journalTrend > 0 ? styles.trendPos : weeklyAnalytics.journalTrend < 0 ? styles.trendNeg : styles.trendNeutral]}>
                {weeklyAnalytics.journalTrend === 0 ? 'Same' : `${Math.abs(weeklyAnalytics.journalTrend)} ${weeklyAnalytics.journalTrend > 0 ? 'more' : 'fewer'}`}
              </Text>
            </View>
          </View>
          <View style={styles.analyticsCard}>
            <Sun size={16} color="#F59E0B" />
            <Text style={styles.analyticsValue}>{weeklyAnalytics.positiveRatio}%</Text>
            <Text style={styles.analyticsLabel}>Positive</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Heart size={16} color="#EC4899" />
            <Text style={styles.analyticsValue}>{weeklyAnalytics.calmDays}</Text>
            <Text style={styles.analyticsLabel}>Calm Days</Text>
          </View>
          <View style={styles.analyticsCard}>
            <Smile size={16} color="#10B981" />
            <Text style={styles.analyticsValueSmall}>{weeklyAnalytics.topEmotion ? `${weeklyAnalytics.topEmotion.emoji}` : '—'}</Text>
            <Text style={styles.analyticsLabel}>{weeklyAnalytics.topEmotion ? weeklyAnalytics.topEmotion.emotion : 'Top Mood'}</Text>
          </View>
        </View>

        {topJournalEmotions.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Top Emotions</Text>
            <View style={styles.emotionsCard}>
              {topJournalEmotions.map((item, index) => (
                <View key={item.emotion} style={[styles.emotionRow, index < topJournalEmotions.length - 1 && styles.emotionRowBorder]}>
                  <View style={[styles.emotionBadge, { backgroundColor: item.color + '20' }]}>
                    <Text style={styles.emotionEmoji}>{item.emoji}</Text>
                  </View>
                  <Text style={styles.emotionName}>{item.emotion}</Text>
                  <Text style={styles.emotionCount}>{item.count}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Calendar</Text>
        {renderCalendar()}

        <Text style={styles.sectionLabel}>Achievements</Text>
        <View style={styles.achievementsCard}>
          {achievements.map((a, i) => {
            const unlocked = checkInsLast30Days >= a.threshold;
            const progress = Math.min(checkInsLast30Days / a.threshold, 1);
            const Icon = a.icon;
            return (
              <View key={a.id} style={[styles.achievementRow, i < achievements.length - 1 && styles.achievementRowBorder]}>
                <View style={[styles.achievementIcon, { backgroundColor: unlocked ? a.color + '20' : Colors.light.border }]}>
                  {unlocked ? <Icon size={18} color={a.color} /> : <Lock size={18} color={Colors.light.textSecondary} />}
                </View>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementTitle, !unlocked && styles.achievementTitleLocked]}>{a.title}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: unlocked ? a.color : Colors.light.primary }]} />
                  </View>
                </View>
                <Text style={styles.achievementProgress}>{unlocked ? <Check size={16} color="#10B981" /> : `${checkInsLast30Days}/${a.threshold}`}</Text>
              </View>
            );
          })}
        </View>

        {data.journalEntries.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>Recent Entries</Text>
            <View style={styles.entriesCard}>
              {data.journalEntries.slice(0, 5).map((entry, i) => (
                <View key={entry.id} style={[styles.entryRow, i < Math.min(data.journalEntries.length, 5) - 1 && styles.entryRowBorder]}>
                  <Text style={styles.entryEmoji}>{entry.emotionEmoji}</Text>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryEmotion}>{entry.emotion}</Text>
                    {entry.gratitude && <Text style={styles.entryPreview} numberOfLines={1}>{entry.gratitude}</Text>}
                  </View>
                  <Text style={styles.entryDate}>{new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12 },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  title: { fontSize: 26, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  subtitle: { fontSize: 14, color: Colors.light.textSecondary },
  screenshotBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.light.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  screenshotBtnText: { color: Colors.light.card, fontSize: 13, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: Colors.light.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: Colors.light.border },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.light.text, marginTop: 8, marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.light.textSecondary, fontWeight: '500' },
  insightCard: { backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#FDE68A' },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  insightTitle: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  insightText: { fontSize: 14, color: '#78350F', lineHeight: 20 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: Colors.light.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  analyticsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  analyticsCard: { width: '48%', backgroundColor: Colors.light.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.light.border },
  analyticsValue: { fontSize: 24, fontWeight: '700', color: Colors.light.text, marginTop: 8, marginBottom: 2 },
  analyticsValueSmall: { fontSize: 24, marginTop: 8, marginBottom: 2 },
  analyticsLabel: { fontSize: 12, color: Colors.light.textSecondary },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  trendText: { fontSize: 11, fontWeight: '500' },
  trendPos: { color: '#10B981' },
  trendNeg: { color: '#EF4444' },
  trendNeutral: { color: Colors.light.textSecondary },
  emotionsCard: { backgroundColor: Colors.light.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 20, overflow: 'hidden' },
  emotionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  emotionRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  emotionBadge: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  emotionEmoji: { fontSize: 18 },
  emotionName: { flex: 1, fontSize: 15, fontWeight: '500', color: Colors.light.text },
  emotionCount: { fontSize: 14, fontWeight: '600', color: Colors.light.textSecondary },
  calendarCard: { backgroundColor: Colors.light.card, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: Colors.light.border },
  calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  monthBtn: { padding: 6 },
  monthTitle: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  weekDays: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekDayText: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary, width: 32, textAlign: 'center' },
  calendarWeek: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 6 },
  calendarDay: { width: 32, height: 40, alignItems: 'center', justifyContent: 'flex-start' },
  dayCircle: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  todayCircle: { backgroundColor: Colors.light.primary + '20' },
  dayText: { fontSize: 13, color: Colors.light.text, fontWeight: '500' },
  todayText: { fontWeight: '700', color: Colors.light.primary },
  checkInDot: { width: 5, height: 5, borderRadius: 2.5, marginTop: 2 },
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.light.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 11, color: Colors.light.textSecondary },
  achievementsCard: { backgroundColor: Colors.light.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 20, overflow: 'hidden' },
  achievementRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  achievementRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  achievementIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  achievementInfo: { flex: 1 },
  achievementTitle: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 6 },
  achievementTitleLocked: { color: Colors.light.textSecondary },
  progressBar: { height: 4, backgroundColor: Colors.light.border, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  achievementProgress: { fontSize: 12, fontWeight: '600', color: Colors.light.textSecondary, minWidth: 40, textAlign: 'right' },
  entriesCard: { backgroundColor: Colors.light.card, borderRadius: 14, borderWidth: 1, borderColor: Colors.light.border, marginBottom: 20, overflow: 'hidden' },
  entryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14 },
  entryRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.light.border },
  entryEmoji: { fontSize: 24, marginRight: 12 },
  entryInfo: { flex: 1 },
  entryEmotion: { fontSize: 14, fontWeight: '600', color: Colors.light.text },
  entryPreview: { fontSize: 12, color: Colors.light.textSecondary, marginTop: 2 },
  entryDate: { fontSize: 11, color: Colors.light.textSecondary },
  bottomSpacer: { height: 30 },
  exportOverlay: { position: 'absolute', top: -2000, left: 0, zIndex: -1 },
  exportViewWrapper: { width: 360, height: 400, backgroundColor: '#0B1220' },
  exportContainer: { backgroundColor: '#0B1220', padding: 16, width: 360, height: 400 },
  exportCard: { backgroundColor: '#0F1B2E', borderRadius: 16, padding: 16, flex: 1 },
  exportTitle: { fontSize: 20, fontWeight: '700', color: '#EAF0FF', marginBottom: 4 },
  exportDate: { fontSize: 12, color: '#93A4C7', marginBottom: 16 },
  exportSection: { marginBottom: 14 },
  exportLabel: { fontSize: 12, fontWeight: '600', color: '#6DE0C7', marginBottom: 4 },
  exportText: { fontSize: 13, color: '#EAF0FF', marginBottom: 2 },
  exportFooter: { fontSize: 12, color: '#93A4C7', textAlign: 'center', marginTop: 'auto', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1E3A5F' },
});
