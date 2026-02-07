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

  const headerAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const insightAnim = useRef(new Animated.Value(0)).current;
  const analyticsAnim = useRef(new Animated.Value(0)).current;
  const calendarAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(100, [
      Animated.spring(headerAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(statsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(insightAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(analyticsAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(calendarAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
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
    const lastWeekCheckIns = data.checkIns.filter(c => {
      const checkInDate = new Date(c.date);
      return checkInDate >= startOfLastWeek && checkInDate < startOfThisWeek;
    });

    const getCheckInScore = (checkIn: typeof data.checkIns[0]) => {
      return [checkIn.reactedCalmly, checkIn.avoidedSnapping, checkIn.wasKinder, checkIn.noticedPositiveSelfTalk, checkIn.feltRelaxed].filter(Boolean).length;
    };

    const thisWeekAvgScore = thisWeekCheckIns.length > 0
      ? thisWeekCheckIns.reduce((sum, c) => sum + getCheckInScore(c), 0) / thisWeekCheckIns.length
      : 0;
    const lastWeekAvgScore = lastWeekCheckIns.length > 0
      ? lastWeekCheckIns.reduce((sum, c) => sum + getCheckInScore(c), 0) / lastWeekCheckIns.length
      : 0;

    const calmDays = thisWeekCheckIns.filter(c => c.reactedCalmly).length;
    const kindDays = thisWeekCheckIns.filter(c => c.wasKinder).length;
    const relaxedDays = thisWeekCheckIns.filter(c => c.feltRelaxed).length;

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
    const scoreTrend = thisWeekAvgScore - lastWeekAvgScore;

    let weeklyInsight = '';
    if (thisWeekCheckIns.length === 0 && thisWeekJournals.length === 0) {
      weeklyInsight = "Start your week by journaling and doing daily check-ins. Consistent reflection helps you understand your patterns better.";
    } else if (positiveRatio >= 0.7 && thisWeekJournals.length >= 3) {
      weeklyInsight = "Your journal entries show a positive emotional trend! Keep nurturing this positive mindset.";
    } else if (scoreTrend > 0.5) {
      weeklyInsight = "Great progress! Your emotional regulation has improved compared to last week. Keep practicing those pause techniques.";
    } else if (journalTrend > 2) {
      weeklyInsight = "You're journaling more consistently! Regular reflection builds self-awareness and emotional resilience.";
    } else if (calmDays >= 4) {
      weeklyInsight = "You've had several calm days this week. Notice what's working and keep building on it.";
    } else if (thisWeekJournals.length > 0 && positiveRatio < 0.3) {
      weeklyInsight = "It seems like a challenging week emotionally. Remember to practice self-compassion and use your pause techniques.";
    } else if (thisWeekCheckIns.length > 0) {
      weeklyInsight = "You're building consistency with check-ins. Keep tracking to better understand your emotional patterns.";
    } else {
      weeklyInsight = "Each day is an opportunity for growth. Try journaling to reflect on your feelings and gratitude.";
    }

    return {
      thisWeekJournals: thisWeekJournals.length,
      lastWeekJournals: lastWeekJournals.length,
      thisWeekCheckIns: thisWeekCheckIns.length,
      avgScore: thisWeekAvgScore,
      calmDays,
      kindDays,
      relaxedDays,
      topEmotion: topEmotion ? { emotion: topEmotion[0], emoji: topEmotion[1].emoji, count: topEmotion[1].count } : null,
      positiveRatio: Math.round(positiveRatio * 100),
      journalTrend,
      scoreTrend,
      weeklyInsight,
    };
  }, [data.journalEntries, data.checkIns]);

  const achievements = [
    { id: 1, threshold: 5, title: 'Emotion Naming Guide', description: 'Learn to identify and name your emotions', icon: BookOpen, color: '#6366F1' },
    { id: 2, threshold: 7, title: 'Weekly Reflection Summary', description: 'Access your weekly emotional insights', icon: Calendar, color: '#8B5CF6' },
    { id: 3, threshold: 10, title: 'Custom Reminder Message', description: 'Set personalized check-in reminders', icon: Bell, color: '#EC4899' },
    { id: 4, threshold: 20, title: 'Personal Intention Space', description: 'Create your mindfulness intentions', icon: Sparkles, color: '#F59E0B' },
    { id: 5, threshold: 30, title: 'Monthly Reflection View', description: 'Deep dive into monthly patterns', icon: BarChart3, color: '#10B981' },
  ];
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [isTakingScreenshot, setIsTakingScreenshot] = React.useState(false);
  const [showExportView, setShowExportView] = React.useState(false);
  const exportViewRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const generateExportData = React.useCallback(() => {
    const now = new Date();
    const exportDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    let exportText = `KindMind Progress Report\n`;
    exportText += `Generated: ${exportDate}\n`;
    exportText += `${'='.repeat(50)}\n\n`;

    // Stats Summary
    exportText += `📊 OVERVIEW\n`;
    exportText += `-`.repeat(30) + `\n`;
    exportText += `Current Streak: ${data.currentStreak} days\n`;
    exportText += `Longest Streak: ${data.longestStreak} days\n`;
    exportText += `Total Check-ins: ${data.checkIns.length}\n`;
    exportText += `Check-ins (Last 30 Days): ${checkInsLast30Days}\n`;
    exportText += `Success Rate: ${successRate}%\n\n`;

    // Weekly Analytics
    exportText += `📈 THIS WEEK'S ANALYTICS\n`;
    exportText += `-`.repeat(30) + `\n`;
    exportText += `Journal Entries: ${weeklyAnalytics.thisWeekJournals}\n`;
    exportText += `Check-ins: ${weeklyAnalytics.thisWeekCheckIns}\n`;
    exportText += `Calm Days: ${weeklyAnalytics.calmDays}\n`;
    exportText += `Positive Mood: ${weeklyAnalytics.positiveRatio}%\n`;
    if (weeklyAnalytics.topEmotion) {
      exportText += `Top Feeling: ${weeklyAnalytics.topEmotion.emoji} ${weeklyAnalytics.topEmotion.emotion} (${weeklyAnalytics.topEmotion.count}x)\n`;
    }
    exportText += `\nWeekly Insight: ${weeklyAnalytics.weeklyInsight}\n\n`;

    // Top Emotions
    if (topJournalEmotions.length > 0) {
      exportText += `💭 TOP EMOTIONS (All Time)\n`;
      exportText += `-`.repeat(30) + `\n`;
      topJournalEmotions.forEach((item, index) => {
        exportText += `${index + 1}. ${item.emoji} ${item.emotion} - ${item.count} entries\n`;
      });
      exportText += `\n`;
    }

    // Check-in Calendar Data
    exportText += `📅 CHECK-IN HISTORY\n`;
    exportText += `-`.repeat(30) + `\n`;
    if (data.checkIns.length > 0) {
      const sortedCheckIns = [...data.checkIns].sort((a, b) => b.date.localeCompare(a.date));
      sortedCheckIns.forEach(checkIn => {
        const score = [checkIn.reactedCalmly, checkIn.avoidedSnapping, checkIn.wasKinder, checkIn.noticedPositiveSelfTalk, checkIn.feltRelaxed].filter(Boolean).length;
        const dateFormatted = new Date(checkIn.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        exportText += `${dateFormatted}: ${score}/5`;
        const achievements = [];
        if (checkIn.reactedCalmly) achievements.push('Calm');
        if (checkIn.avoidedSnapping) achievements.push('Patient');
        if (checkIn.wasKinder) achievements.push('Kind');
        if (checkIn.noticedPositiveSelfTalk) achievements.push('Positive');
        if (checkIn.feltRelaxed) achievements.push('Relaxed');
        if (achievements.length > 0) {
          exportText += ` (${achievements.join(', ')})`;
        }
        exportText += `\n`;
      });
    } else {
      exportText += `No check-ins recorded yet.\n`;
    }
    exportText += `\n`;

    // Journal Entries Summary
    exportText += `📝 JOURNAL ENTRIES\n`;
    exportText += `-`.repeat(30) + `\n`;
    if (data.journalEntries.length > 0) {
      data.journalEntries.slice(0, 20).forEach(entry => {
        const dateFormatted = new Date(entry.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        exportText += `\n${dateFormatted} - ${entry.emotionEmoji} ${entry.emotion}\n`;
        if (entry.gratitude) {
          exportText += `  Grateful for: ${entry.gratitude}\n`;
        }
        if (entry.reflection) {
          exportText += `  Reflection: ${entry.reflection}\n`;
        }
      });
    } else {
      exportText += `No journal entries recorded yet.\n`;
    }

    exportText += `\n${'='.repeat(50)}\n`;
    exportText += `Thank you for using KindMind! 🌱\n`;

    return exportText;
  }, [data, weeklyAnalytics, topJournalEmotions, checkInsLast30Days, successRate]);

  const escapeXml = React.useCallback((value: string) => {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }, []);

  const buildExportSvg = React.useCallback(
    (exportText: string) => {
      const maxCharsPerLine = 74;
      const fontSize = 18;
      const lineHeight = 26;
      const padding = 56;
      const width = 1080;

      const rawLines = exportText.split('\n');
      const lines: string[] = [];

      rawLines.forEach((line) => {
        if (line.length <= maxCharsPerLine) {
          lines.push(line);
          return;
        }

        let remaining = line;
        while (remaining.length > maxCharsPerLine) {
          const slice = remaining.slice(0, maxCharsPerLine);
          const lastSpace = slice.lastIndexOf(' ');
          const cutIndex = lastSpace > 20 ? lastSpace : maxCharsPerLine;
          lines.push(remaining.slice(0, cutIndex));
          remaining = remaining.slice(cutIndex).trimStart();
        }
        if (remaining.length > 0) lines.push(remaining);
      });

      const height = padding * 2 + lines.length * lineHeight;

      const bg = '#F5EFE8';
      const card = '#FFFFFF';
      const text = '#4A4545';
      const subtle = '#8A8585';
      const accent = '#8DC8C4';

      const safeTitle = `KindMind Progress • ${formatLocalDate(new Date())}`;

      const textEls = lines
        .map((l, i) => {
          const y = padding + (i + 1) * lineHeight;
          const fill = l.startsWith('📊') || l.startsWith('📈') || l.startsWith('💭') || l.startsWith('📅') || l.startsWith('📝')
            ? accent
            : l.startsWith('-') || l.startsWith('=')
              ? subtle
              : text;

          return `<text x="${padding}" y="${y}" fill="${fill}" font-family="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" font-size="${fontSize}">${escapeXml(l)}</text>`;
        })
        .join('');

      return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#183B56" stop-opacity="0.55" />
      <stop offset="1" stop-color="#0B1220" stop-opacity="0.0" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <rect x="0" y="0" width="${width}" height="${height}" fill="${bg}" />
  <rect x="0" y="0" width="${width}" height="${height}" fill="url(#g)" />

  <rect x="40" y="36" width="${width - 80}" height="${height - 72}" rx="28" fill="${card}" filter="url(#shadow)" />
  <text x="${padding}" y="${padding}" fill="${text}" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial" font-weight="700" font-size="28">${escapeXml(safeTitle)}</text>

  <g transform="translate(0, 22)">
    ${textEls}
  </g>
</svg>`;
    },
    [escapeXml]
  );

  const handleScreenshot = React.useCallback(async () => {
    setIsTakingScreenshot(true);
    try {
      console.log('[Progress] Screenshot: generating report');
      const exportText = generateExportData();
      const exportSvg = buildExportSvg(exportText);

      if (Platform.OS === 'web') {
        console.log('[Progress] Screenshot: web download png via canvas');
        const svgBlob = new Blob([exportSvg], { type: 'image/svg+xml;charset=utf-8' });
        const svgUrl = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const pngUrl = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = pngUrl;
                link.download = `kindmind-screenshot-${formatLocalDate(new Date())}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(pngUrl);
              }
              URL.revokeObjectURL(svgUrl);
              setIsTakingScreenshot(false);
              Alert.alert('Success', 'Your screenshot has been saved!');
            }, 'image/png');
          }
        };
        img.onerror = () => {
          URL.revokeObjectURL(svgUrl);
          setIsTakingScreenshot(false);
          Alert.alert('Error', 'Failed to take screenshot.');
        };
        img.src = svgUrl;
        return;
      } else {
        console.log('[Progress] Screenshot: native capture view as png');
        setShowExportView(true);
        
        requestAnimationFrame(() => {
          setTimeout(async () => {
            try {
              if (exportViewRef.current) {
                console.log('[Progress] Capturing view...');
                const uri = await captureRef(exportViewRef, {
                  format: 'png',
                  quality: 1,
                  result: 'tmpfile',
                });
                
                console.log('[Progress] Captured URI:', uri);
                setShowExportView(false);
                
                const canShare = await Sharing.isAvailableAsync();
                console.log('[Progress] Can share:', canShare);
                
                if (canShare) {
                  await Sharing.shareAsync(uri, {
                    mimeType: 'image/png',
                    dialogTitle: 'Share KindMind Progress',
                    UTI: 'public.png',
                  });
                  console.log('[Progress] Share complete');
                } else {
                  Alert.alert('Saved', 'Your progress screenshot is ready to share!');
                }
              } else {
                console.error('[Progress] Screenshot view ref is null');
                setShowExportView(false);
                Alert.alert('Error', 'Could not take screenshot. Please try again.');
              }
            } catch (captureError) {
              console.error('[Progress] Screenshot error:', captureError);
              setShowExportView(false);
              Alert.alert('Error', 'Failed to take screenshot. Please try again.');
            } finally {
              setIsTakingScreenshot(false);
            }
          }, 500);
        });
        return;
      }
    } catch (error) {
      console.error('[Progress] Screenshot error:', error);
      Alert.alert('Error', 'Failed to take screenshot. Please try again.');
      setIsTakingScreenshot(false);
    }
  }, [buildExportSvg, generateExportData]);

  const checkInsByDate = React.useMemo(() => {
    const getCheckInScore = (checkIn: typeof data.checkIns[0]) => {
      return [
        checkIn.reactedCalmly,
        checkIn.avoidedSnapping,
        checkIn.wasKinder,
        checkIn.noticedPositiveSelfTalk,
        checkIn.feltRelaxed,
      ].filter(Boolean).length;
    };

    const getCheckInColor = (score: number) => {
      if (score >= 4) return '#4CAF50';
      if (score === 3) return '#FF9800';
      return '#F44336';
    };

    const map: Record<string, { score: number; color: string }> = {};
    data.checkIns.forEach(checkIn => {
      const score = getCheckInScore(checkIn);
      map[checkIn.date] = {
        score,
        color: getCheckInColor(score),
      };
    });
    return map;
  }, [data]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      week.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }

    const dateKey = (day: number) => {
      return formatLocalDate(new Date(year, month, day));
    };

    return (
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            style={styles.monthButton}
          >
            <ChevronLeft size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
          <TouchableOpacity
            onPress={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            style={styles.monthButton}
          >
            <ChevronRight size={24} color={Colors.light.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekDays}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <Text key={i} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} style={styles.calendarWeek}>
            {week.map((day, dayIndex) => {
              const key = day ? dateKey(day) : `empty-${weekIndex}-${dayIndex}`;
              const checkInData = day ? checkInsByDate[dateKey(day)] : null;
              const isToday = day && formatLocalDate(new Date()) === dateKey(day);

              return (
                <View key={key} style={styles.calendarDay}>
                  {day && (
                    <>
                      <View style={[styles.dayCircle, isToday && styles.todayCircle]}>
                        <Text style={[styles.dayText, isToday && styles.todayText]}>{day}</Text>
                      </View>
                      {checkInData && (
                        <View style={[styles.checkInDot, { backgroundColor: checkInData.color }]} />
                      )}
                    </>
                  )}
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F44336' }]} />
            <Text style={styles.legendText}>0-2</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.legendText}>3</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.legendText}>4-5</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderExportContent = () => {
    const exportDate = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    return (
      <View style={styles.exportContainer}>
        <View style={styles.exportCard}>
          <Text style={styles.exportTitle}>KindMind Progress Report</Text>
          <Text style={styles.exportDate}>{exportDate}</Text>
          
          <View style={styles.exportSection}>
            <Text style={styles.exportSectionTitle}>📊 Overview</Text>
            <Text style={styles.exportText}>Current Streak: {data.currentStreak} days</Text>
            <Text style={styles.exportText}>Longest Streak: {data.longestStreak} days</Text>
            <Text style={styles.exportText}>Total Check-ins: {data.checkIns.length}</Text>
            <Text style={styles.exportText}>Check-ins (Last 30 Days): {checkInsLast30Days}</Text>
            <Text style={styles.exportText}>Success Rate: {successRate}%</Text>
          </View>

          <View style={styles.exportSection}>
            <Text style={styles.exportSectionTitle}>📈 This Week</Text>
            <Text style={styles.exportText}>Journal Entries: {weeklyAnalytics.thisWeekJournals}</Text>
            <Text style={styles.exportText}>Check-ins: {weeklyAnalytics.thisWeekCheckIns}</Text>
            <Text style={styles.exportText}>Calm Days: {weeklyAnalytics.calmDays}</Text>
            <Text style={styles.exportText}>Positive Mood: {weeklyAnalytics.positiveRatio}%</Text>
            {weeklyAnalytics.topEmotion && (
              <Text style={styles.exportText}>Top Feeling: {weeklyAnalytics.topEmotion.emoji} {weeklyAnalytics.topEmotion.emotion}</Text>
            )}
          </View>

          {topJournalEmotions.length > 0 && (
            <View style={styles.exportSection}>
              <Text style={styles.exportSectionTitle}>💭 Top Emotions</Text>
              {topJournalEmotions.map((item, index) => (
                <Text key={item.emotion} style={styles.exportText}>
                  {index + 1}. {item.emoji} {item.emotion} - {item.count} entries
                </Text>
              ))}
            </View>
          )}

          <View style={styles.exportSection}>
            <Text style={styles.exportSectionTitle}>✨ Weekly Insight</Text>
            <Text style={styles.exportInsight}>{weeklyAnalytics.weeklyInsight}</Text>
          </View>

          <Text style={styles.exportFooter}>Thank you for using KindMind! 🌱</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {showExportView && Platform.OS !== 'web' && (
        <View style={styles.exportOverlay}>
          <View 
            style={styles.exportViewWrapper} 
            ref={exportViewRef} 
            collapsable={false}
          >
            {renderExportContent()}
          </View>
        </View>
      )}
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Animated.View style={[styles.header, { opacity: headerAnim, transform: [{ translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }]}>
          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>Your Progress</Text>
              <Text style={styles.subtitle}>Track your emotional growth</Text>
            </View>
            <TouchableOpacity 
              style={styles.screenshotButton} 
              onPress={handleScreenshot}
              disabled={isTakingScreenshot}
            >
              <Camera size={20} color={Colors.light.card} />
              <Text style={styles.screenshotButtonText}>{isTakingScreenshot ? 'Capturing...' : 'Screenshot'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.statsGrid, { opacity: statsAnim, transform: [{ scale: statsAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] }]}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#F0E8F5' }]}>
              <Flame size={28} color={Colors.light.primary} />
            </View>
            <Text style={styles.statNumber}>{data.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: '#E3F2EF' }]}>
              <Target size={28} color={Colors.light.secondary} />
            </View>
            <Text style={styles.statNumber}>{data.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
        </Animated.View>

        <Animated.View style={[styles.weeklyInsightCard, { opacity: insightAnim, transform: [{ translateX: insightAnim.interpolate({ inputRange: [0, 1], outputRange: [-30, 0] }) }] }]}>
          <View style={styles.weeklyInsightHeader}>
            <View style={styles.weeklyInsightIcon}>
              <Sparkles size={20} color="#F59E0B" />
            </View>
            <Text style={styles.weeklyInsightTitle}>Weekly Insight</Text>
          </View>
          <Text style={styles.weeklyInsightText}>{weeklyAnalytics.weeklyInsight}</Text>
        </Animated.View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week's Analytics</Text>
          <Text style={styles.sectionSubtitle}>Your emotional wellness snapshot</Text>
        </View>

        <Animated.View style={[styles.analyticsGrid, { opacity: analyticsAnim, transform: [{ translateY: analyticsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <PenLine size={18} color="#6366F1" />
              <Text style={styles.analyticsLabel}>Journal Entries</Text>
            </View>
            <Text style={styles.analyticsValue}>{weeklyAnalytics.thisWeekJournals}</Text>
            <View style={styles.trendContainer}>
              {weeklyAnalytics.journalTrend > 0 ? (
                <TrendingUp size={14} color="#10B981" />
              ) : weeklyAnalytics.journalTrend < 0 ? (
                <TrendingDown size={14} color="#EF4444" />
              ) : (
                <Minus size={14} color={Colors.light.textSecondary} />
              )}
              <Text style={[
                styles.trendText,
                weeklyAnalytics.journalTrend > 0 ? styles.trendPositive : 
                weeklyAnalytics.journalTrend < 0 ? styles.trendNegative : styles.trendNeutral
              ]}>
                {weeklyAnalytics.journalTrend === 0 ? 'Same' : 
                  `${Math.abs(weeklyAnalytics.journalTrend)} ${weeklyAnalytics.journalTrend > 0 ? 'more' : 'fewer'}`}
              </Text>
            </View>
          </View>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <Sun size={18} color="#F59E0B" />
              <Text style={styles.analyticsLabel}>Positive Mood</Text>
            </View>
            <Text style={styles.analyticsValue}>
              {weeklyAnalytics.thisWeekJournals > 0 ? `${weeklyAnalytics.positiveRatio}%` : '—'}
            </Text>
            <Text style={styles.analyticsSubtext}>
              {weeklyAnalytics.thisWeekJournals > 0 ? 'of entries' : 'No data'}
            </Text>
          </View>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <Heart size={18} color="#EC4899" />
              <Text style={styles.analyticsLabel}>Calm Days</Text>
            </View>
            <Text style={styles.analyticsValue}>{weeklyAnalytics.calmDays}</Text>
            <Text style={styles.analyticsSubtext}>of {weeklyAnalytics.thisWeekCheckIns} check-ins</Text>
          </View>

          <View style={styles.analyticsCard}>
            <View style={styles.analyticsHeader}>
              <Smile size={18} color="#10B981" />
              <Text style={styles.analyticsLabel}>Top Feeling</Text>
            </View>
            <Text style={styles.analyticsValueSmall}>
              {weeklyAnalytics.topEmotion ? `${weeklyAnalytics.topEmotion.emoji} ${weeklyAnalytics.topEmotion.emotion}` : '—'}
            </Text>
            <Text style={styles.analyticsSubtext}>
              {weeklyAnalytics.topEmotion ? `${weeklyAnalytics.topEmotion.count}x this week` : 'No data'}
            </Text>
          </View>
        </Animated.View>

        <View style={styles.weeklyStatsRow}>
          <View style={styles.weeklyStatItem}>
            <View style={[styles.weeklyStatDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.weeklyStatLabel}>Calm days</Text>
            <Text style={styles.weeklyStatValue}>{weeklyAnalytics.calmDays} days</Text>
          </View>
          <View style={styles.weeklyStatItem}>
            <View style={[styles.weeklyStatDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.weeklyStatLabel}>Success rate</Text>
            <Text style={styles.weeklyStatValue}>{successRate}%</Text>
          </View>
        </View>

        {topJournalEmotions.length > 0 && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Emotional Journey</Text>
              <Text style={styles.sectionSubtitle}>
                Most recorded feelings from your journal
              </Text>
            </View>

            <View style={styles.emotionsContainer}>
              {topJournalEmotions.map((item, index) => (
                <View key={item.emotion} style={styles.emotionCard}>
                  <View style={[styles.emotionRank, { backgroundColor: item.color }]}>
                    <Text style={styles.emotionRankEmoji}>{item.emoji}</Text>
                  </View>
                  <View style={styles.emotionContent}>
                    <Text style={styles.emotionName}>{item.emotion}</Text>
                    <Text style={styles.emotionCount}>
                      {item.count} {item.count === 1 ? 'entry' : 'entries'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Check-In Calendar</Text>
          <Text style={styles.sectionSubtitle}>
            {data.checkIns.length} total check-ins
          </Text>
        </View>

        {renderCalendar()}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>🧩 Achievements</Text>
              <Text style={styles.sectionSubtitle}>
                Unlock tools as you grow (resets every 30 days)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.achievementsContainer}>
          {achievements.map((achievement) => {
            const isUnlocked = checkInsLast30Days >= achievement.threshold;
            const progress = Math.min(checkInsLast30Days / achievement.threshold, 1);
            const IconComponent = achievement.icon;

            return (
              <View key={achievement.id} style={[styles.achievementCard, isUnlocked && styles.achievementUnlocked]}>
                <View style={[styles.achievementIconContainer, { backgroundColor: isUnlocked ? achievement.color + '20' : Colors.light.border }]}>
                  {isUnlocked ? (
                    <IconComponent size={24} color={achievement.color} />
                  ) : (
                    <Lock size={24} color={Colors.light.textSecondary} />
                  )}
                </View>
                <View style={styles.achievementContent}>
                  <View style={styles.achievementHeader}>
                    <Text style={[styles.achievementTitle, !isUnlocked && styles.achievementTitleLocked]}>
                      {achievement.title}
                    </Text>
                    {isUnlocked && (
                      <View style={styles.unlockedBadge}>
                        <Check size={12} color="#fff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.achievementDescription}>{achievement.description}</Text>
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: isUnlocked ? achievement.color : Colors.light.primary }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {isUnlocked ? 'Unlocked!' : `${checkInsLast30Days}/${achievement.threshold}`}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Journal Entries</Text>
              <Text style={styles.sectionSubtitle}>
                {data.journalEntries.length} entries
              </Text>
            </View>
          </View>
        </View>

        {data.journalEntries.length > 0 ? (
          <View style={styles.triggersContainer}>
            {data.journalEntries.slice(0, 10).map(entry => (
              <View key={entry.id} style={styles.journalCard}>
                <View style={styles.journalHeader}>
                  <View style={styles.journalEmotionBadge}>
                    <Text style={styles.journalEmotionEmoji}>{entry.emotionEmoji}</Text>
                    <Text style={styles.journalEmotionText}>{entry.emotion}</Text>
                  </View>
                  <Text style={styles.journalTime}>
                    {new Date(entry.timestamp).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
                {entry.gratitude && (
                  <View style={styles.journalSection}>
                    <Text style={styles.journalSectionLabel}>🌸 Grateful for</Text>
                    <Text style={styles.journalSectionText} numberOfLines={2}>{entry.gratitude}</Text>
                  </View>
                )}
                {entry.reflection && (
                  <View style={styles.journalSection}>
                    <Text style={styles.journalSectionLabel}>✨ Reflection</Text>
                    <Text style={styles.journalSectionText} numberOfLines={2}>{entry.reflection}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No journal entries yet</Text>
            <Text style={styles.emptySubtext}>
              Start journaling to reflect on your feelings and gratitude
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  header: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.light.text,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  screenshotButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  screenshotButtonText: {
    color: Colors.light.card,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  emotionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  emotionCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  emotionRank: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emotionRankText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.card,
  },
  emotionRankEmoji: {
    fontSize: 20,
  },
  emotionContent: {
    flex: 1,
  },
  emotionName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  emotionCount: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  calendarContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 18,
    marginBottom: 32,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    width: 40,
    textAlign: 'center',
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  calendarDay: {
    width: 40,
    height: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayCircle: {
    backgroundColor: Colors.light.secondary + '20',
  },
  dayText: {
    fontSize: 15,
    color: Colors.light.text,
    fontWeight: '500',
  },
  todayText: {
    fontWeight: '700',
    color: Colors.light.secondary,
  },
  checkInDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 0.5,
    borderTopColor: Colors.light.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  triggersContainer: {
    gap: 12,
    marginBottom: 32,
  },
  triggerCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  triggerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  triggerEmotion: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  triggerIntensity: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  triggerSituation: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  triggerTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  journalCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
  },
  journalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  journalEmotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  journalEmotionEmoji: {
    fontSize: 16,
  },
  journalEmotionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  journalTime: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  journalSection: {
    marginBottom: 8,
  },
  journalSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  journalSectionText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  emptyState: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 36,
    alignItems: 'center',
    marginBottom: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 40,
  },
  exportOverlay: {
    position: 'absolute',
    top: -2000,
    left: 0,
    zIndex: -1,
  },
  exportViewWrapper: {
    width: 400,
    height: 700,
    backgroundColor: '#0B1220',
  },
  exportContainer: {
    backgroundColor: '#0B1220',
    padding: 20,
    width: 400,
    height: 700,
  },
  exportCard: {
    backgroundColor: '#0F1B2E',
    borderRadius: 20,
    padding: 20,
    flex: 1,
  },
  exportTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#EAF0FF',
    marginBottom: 4,
  },
  exportDate: {
    fontSize: 14,
    color: '#93A4C7',
    marginBottom: 24,
  },
  exportSection: {
    marginBottom: 20,
  },
  exportSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#6DE0C7',
    marginBottom: 8,
  },
  exportText: {
    fontSize: 14,
    color: '#EAF0FF',
    marginBottom: 4,
  },
  exportInsight: {
    fontSize: 14,
    color: '#EAF0FF',
    lineHeight: 20,
    fontStyle: 'italic' as const,
  },
  exportFooter: {
    fontSize: 14,
    color: '#93A4C7',
    textAlign: 'center' as const,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E3A5F',
  },
  weeklyInsightCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },
  weeklyInsightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  weeklyInsightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weeklyInsightTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
  },
  weeklyInsightText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 21,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  analyticsCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  analyticsLabel: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  analyticsValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  analyticsValueSmall: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  analyticsSubtext: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  trendPositive: {
    color: '#10B981',
  },
  trendNegative: {
    color: '#EF4444',
  },
  trendNeutral: {
    color: Colors.light.textSecondary,
  },
  weeklyStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 32,
  },
  weeklyStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  weeklyStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  weeklyStatLabel: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  weeklyStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  achievementsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  achievementCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  achievementUnlocked: {
    backgroundColor: Colors.light.secondary + '08',
  },
  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementContent: {
    flex: 1,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  achievementTitleLocked: {
    color: Colors.light.textSecondary,
  },
  achievementDescription: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 10,
    lineHeight: 18,
  },
  unlockedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.light.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
});
