import { Flame, Target, ChevronLeft, ChevronRight, BookOpen, Calendar, Bell, Sparkles, BarChart3, Lock, Check, Camera, User, MessageCircle, RefreshCw, Heart } from 'lucide-react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line } from 'react-native-svg';
import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { generateText } from '@rork-ai/toolkit-sdk';
import { useKindMind } from '@/providers/KindMindProvider';
import Colors from '@/constants/colors';
import { router } from 'expo-router';

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
  const koraAnim = useRef(new Animated.Value(0)).current;

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

    Animated.sequence([
      Animated.delay(550),
      Animated.spring(koraAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, []);

  const [koraSuggestion, setKoraSuggestion] = useState<string | null>(null);
  const [koraLoading, setKoraLoading] = useState(false);

  const fetchKoraSuggestion = useCallback(async (trendPercent: number) => {
    if (trendPercent >= 0) {
      setKoraSuggestion(null);
      return;
    }
    setKoraLoading(true);
    try {
      const recentEmotions = data.journalEntries.slice(0, 5).map(j => j.emotion).join(', ');
      const recentCheckIns = data.checkIns.slice(0, 3);
      const calmDays = recentCheckIns.filter(c => c.reactedCalmly).length;
      const prompt = `You are Kora, a warm and empathetic AI wellness coach inside the KindMind app. The user's overall wellbeing trend is ${trendPercent}% (declining). Their recent emotions: ${recentEmotions || 'none recorded'}. Calm days recently: ${calmDays}/${recentCheckIns.length}. Current streak: ${data.currentStreak} days. Success rate: ${successRate}%. Give a brief, caring 2-3 sentence personalized suggestion to help improve their wellbeing. Include one specific actionable tip like trying a breathing exercise, journaling about gratitude, or doing a mindful pause. Be warm but concise. Don't use bullet points or markdown. Don't mention the percentage.`;
      const result = await generateText(prompt);
      setKoraSuggestion(result);
    } catch (error) {
      console.error('[Progress] Kora suggestion error:', error);
      setKoraSuggestion('It seems like things have been a bit challenging recently. Try a short breathing exercise or write down something you\'re grateful for — small steps can make a big difference.');
    } finally {
      setKoraLoading(false);
    }
  }, [data.journalEntries, data.checkIns, data.currentStreak, successRate]);

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

  const emotionalTrendsData = React.useMemo(() => {
    const now = new Date();
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const dayData: { day: string; score: number; emotion: string; emoji: string }[] = [];
    
    const emotionScores: Record<string, number> = {
      'Happy': 90, 'Grateful': 85, 'Loved': 85, 'Hopeful': 80, 'Strong': 75,
      'Calm': 70, 'Thoughtful': 60, 'Tired': 40, 'Sad': 30, 'Anxious': 25,
      'Frustrated': 20, 'Hurt': 15,
    };

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateKey = formatLocalDate(date);
      const dayName = days[date.getDay()];
      
      const dayJournals = data.journalEntries.filter(j => {
        const jDate = new Date(j.timestamp);
        return formatLocalDate(jDate) === dateKey;
      });
      
      const dayCheckIn = data.checkIns.find(c => c.date === dateKey);
      
      let score = 50;
      let emotion = '';
      let emoji = '';
      
      if (dayJournals.length > 0) {
        const avgEmotionScore = dayJournals.reduce((sum, j) => sum + (emotionScores[j.emotion] || 50), 0) / dayJournals.length;
        score = avgEmotionScore;
        emotion = dayJournals[dayJournals.length - 1].emotion;
        emoji = dayJournals[dayJournals.length - 1].emotionEmoji;
      } else if (dayCheckIn) {
        const checkInScore = [dayCheckIn.reactedCalmly, dayCheckIn.avoidedSnapping, dayCheckIn.wasKinder, dayCheckIn.noticedPositiveSelfTalk, dayCheckIn.feltRelaxed].filter(Boolean).length;
        score = 30 + (checkInScore / 5) * 50;
        emotion = checkInScore >= 4 ? 'Calm' : checkInScore >= 2 ? 'Neutral' : 'Stressed';
      }
      
      dayData.push({ day: dayName, score, emotion, emoji });
    }
    
    const validScores = dayData.filter(d => d.emotion !== '');
    const avgScore = validScores.length > 0 
      ? validScores.reduce((sum, d) => sum + d.score, 0) / validScores.length 
      : 50;
    
    const emotionCounts: Record<string, { count: number; emoji: string; score: number }> = {};
    dayData.forEach(d => {
      if (d.emotion) {
        if (!emotionCounts[d.emotion]) {
          emotionCounts[d.emotion] = { count: 0, emoji: d.emoji, score: d.score };
        }
        emotionCounts[d.emotion].count++;
      }
    });
    
    const dominantEmotion = Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b.count - a.count)[0];
    
    const peakDay = dayData.reduce((max, d) => d.score > max.score ? d : max, dayData[0]);
    
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
    
    return {
      dayData,
      avgScore,
      dominantEmotion: dominantEmotion ? { 
        emotion: dominantEmotion[0], 
        emoji: dominantEmotion[1].emoji,
        count: dominantEmotion[1].count 
      } : null,
      peakDay,
      trendPercent,
    };
  }, [data.journalEntries, data.checkIns]);

  const handleRefreshKora = useCallback(() => {
    fetchKoraSuggestion(emotionalTrendsData.trendPercent);
  }, [fetchKoraSuggestion, emotionalTrendsData.trendPercent]);

  useEffect(() => {
    if (emotionalTrendsData.trendPercent < 0) {
      fetchKoraSuggestion(emotionalTrendsData.trendPercent);
    } else {
      setKoraSuggestion(null);
    }
  }, [emotionalTrendsData.trendPercent]);

  const achievements = [
    { id: 1, threshold: 5, title: 'Emotion Naming Guide', description: 'Learn to identify and name your emotions', icon: BookOpen, color: '#6366F1' },
    { id: 2, threshold: 7, title: 'Weekly Reflection Summary', description: 'Access your weekly emotional insights', icon: Calendar, color: '#8B5CF6' },
    { id: 3, threshold: 10, title: 'Custom Reminder Message', description: 'Set personalized check-in reminders', icon: Bell, color: '#EC4899' },
    { id: 4, threshold: 20, title: 'Personal Intention Space', description: 'Create your mindfulness intentions', icon: Sparkles, color: '#F59E0B' },
    { id: 5, threshold: 30, title: 'Monthly Reflection View', description: 'Deep dive into monthly patterns', icon: BarChart3, color: '#10B981' },
  ];
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const [isTakingScreenshot, setIsTakingScreenshot] = React.useState(false);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek, year, month };
  };

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

  const generatePdfHtml = React.useCallback(() => {
    const now = new Date();
    const exportDate = now.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const getCheckInScore = (checkIn: typeof data.checkIns[0]) => {
      return [checkIn.reactedCalmly, checkIn.avoidedSnapping, checkIn.wasKinder, checkIn.noticedPositiveSelfTalk, checkIn.feltRelaxed].filter(Boolean).length;
    };

    const sortedCheckIns = [...data.checkIns].sort((a, b) => b.date.localeCompare(a.date));

    const calendarHtml = (() => {
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

      const dateKey = (day: number) => formatLocalDate(new Date(year, month, day));
      const getCheckInColor = (score: number) => {
        if (score >= 4) return '#4CAF50';
        if (score === 3) return '#FF9800';
        return '#F44336';
      };

      return `
        <div style="margin: 20px 0;">
          <h3 style="color: #8DC8C4; font-size: 18px; margin-bottom: 10px;">
            ${currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              ${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => 
                `<th style="text-align: center; padding: 8px; color: #93A4C7; font-size: 12px;">${d}</th>`
              ).join('')}
            </tr>
            ${weeks.map(w => `
              <tr>
                ${w.map(day => {
                  if (!day) return '<td style="padding: 8px;"></td>';
                  const checkInData = checkInsByDate[dateKey(day)];
                  const isToday = formatLocalDate(new Date()) === dateKey(day);
                  return `
                    <td style="text-align: center; padding: 8px;">
                      <div style="
                        display: inline-block;
                        width: 32px;
                        height: 32px;
                        line-height: 32px;
                        border-radius: 50%;
                        background-color: ${isToday ? '#8DC8C420' : 'transparent'};
                        color: ${isToday ? '#8DC8C4' : '#EAF0FF'};
                        font-weight: ${isToday ? 'bold' : 'normal'};
                        position: relative;
                      ">
                        ${day}
                        ${checkInData ? `
                          <div style="
                            position: absolute;
                            bottom: 2px;
                            left: 50%;
                            transform: translateX(-50%);
                            width: 6px;
                            height: 6px;
                            border-radius: 50%;
                            background-color: ${checkInData.color};
                          "></div>
                        ` : ''}
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </table>
        </div>
      `;
    })();

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              background: linear-gradient(135deg, #0F1B2E 0%, #0B1220 100%);
              color: #EAF0FF;
              padding: 30px;
              line-height: 1.6;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 40px;
              padding-bottom: 30px;
              border-bottom: 2px solid #1E3A5F;
            }
            h1 {
              font-size: 32px;
              font-weight: 700;
              color: #EAF0FF;
              margin-bottom: 10px;
            }
            .date {
              font-size: 16px;
              color: #93A4C7;
            }
            .section {
              margin-bottom: 35px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: 600;
              color: #6DE0C7;
              margin-bottom: 15px;
              padding-bottom: 8px;
              border-bottom: 1px solid #1E3A5F;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 20px;
            }
            .stat-card {
              background: #1E3A5F20;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
            }
            .stat-number {
              font-size: 36px;
              font-weight: 700;
              color: #8DC8C4;
              margin-bottom: 8px;
            }
            .stat-label {
              font-size: 14px;
              color: #93A4C7;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #1E3A5F40;
            }
            .info-row:last-child {
              border-bottom: none;
            }
            .info-label {
              color: #93A4C7;
              font-size: 14px;
            }
            .info-value {
              color: #EAF0FF;
              font-weight: 600;
              font-size: 14px;
            }
            .insight-box {
              background: linear-gradient(135deg, #8DC8C420 0%, #6DE0C720 100%);
              border-left: 4px solid #8DC8C4;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              font-style: italic;
              color: #EAF0FF;
            }
            .emotion-list {
              list-style: none;
            }
            .emotion-item {
              background: #1E3A5F20;
              padding: 15px;
              margin-bottom: 10px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .emotion-name {
              font-size: 16px;
              font-weight: 600;
            }
            .emotion-count {
              color: #8DC8C4;
              font-weight: 600;
            }
            .check-in-item {
              background: #1E3A5F20;
              padding: 12px;
              margin-bottom: 8px;
              border-radius: 6px;
              font-size: 13px;
            }
            .check-in-date {
              color: #8DC8C4;
              font-weight: 600;
              margin-right: 10px;
            }
            .check-in-score {
              color: #EAF0FF;
            }
            .check-in-tags {
              color: #93A4C7;
              font-size: 12px;
              margin-top: 4px;
            }
            .journal-entry {
              background: #1E3A5F20;
              padding: 15px;
              margin-bottom: 12px;
              border-radius: 8px;
              page-break-inside: avoid;
            }
            .journal-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
            }
            .journal-emotion {
              font-size: 16px;
              font-weight: 600;
              color: #8DC8C4;
            }
            .journal-date {
              color: #93A4C7;
              font-size: 13px;
            }
            .journal-text {
              color: #EAF0FF;
              font-size: 14px;
              line-height: 1.6;
              margin-top: 8px;
            }
            .journal-label {
              color: #6DE0C7;
              font-size: 12px;
              font-weight: 600;
              margin-top: 10px;
              margin-bottom: 4px;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 30px;
              border-top: 2px solid #1E3A5F;
              color: #93A4C7;
              font-size: 14px;
            }
            .achievement-item {
              background: #1E3A5F20;
              padding: 12px 15px;
              margin-bottom: 8px;
              border-radius: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .achievement-name {
              color: #EAF0FF;
              font-size: 14px;
            }
            .achievement-status {
              font-size: 12px;
              font-weight: 600;
              padding: 4px 10px;
              border-radius: 4px;
            }
            .unlocked {
              background: #10B98140;
              color: #10B981;
            }
            .locked {
              background: #F4433640;
              color: #F44336;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🌱 KindMind Progress Report</h1>
              <p class="date">${exportDate}</p>
            </div>

            <div class="section">
              <h2 class="section-title">📊 Overview</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${data.currentStreak}</div>
                  <div class="stat-label">Current Streak</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${data.longestStreak}</div>
                  <div class="stat-label">Longest Streak</div>
                </div>
              </div>
              <div class="info-row">
                <span class="info-label">Total Check-ins</span>
                <span class="info-value">${data.checkIns.length}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-ins (Last 30 Days)</span>
                <span class="info-value">${checkInsLast30Days}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Success Rate</span>
                <span class="info-value">${successRate}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Total Journal Entries</span>
                <span class="info-value">${data.journalEntries.length}</span>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">📈 This Week's Analytics</h2>
              <div class="info-row">
                <span class="info-label">Journal Entries</span>
                <span class="info-value">${weeklyAnalytics.thisWeekJournals}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Check-ins</span>
                <span class="info-value">${weeklyAnalytics.thisWeekCheckIns}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Calm Days</span>
                <span class="info-value">${weeklyAnalytics.calmDays}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Positive Mood Ratio</span>
                <span class="info-value">${weeklyAnalytics.positiveRatio}%</span>
              </div>
              ${weeklyAnalytics.topEmotion ? `
                <div class="info-row">
                  <span class="info-label">Top Feeling This Week</span>
                  <span class="info-value">${weeklyAnalytics.topEmotion.emoji} ${weeklyAnalytics.topEmotion.emotion} (${weeklyAnalytics.topEmotion.count}x)</span>
                </div>
              ` : ''}
              <div class="insight-box">
                <strong>💡 Weekly Insight:</strong><br>
                ${weeklyAnalytics.weeklyInsight}
              </div>
            </div>

            ${topJournalEmotions.length > 0 ? `
              <div class="section">
                <h2 class="section-title">💭 Top Emotions (All Time)</h2>
                <ul class="emotion-list">
                  ${topJournalEmotions.map((item, index) => `
                    <li class="emotion-item">
                      <span class="emotion-name">${index + 1}. ${item.emoji} ${item.emotion}</span>
                      <span class="emotion-count">${item.count} ${item.count === 1 ? 'entry' : 'entries'}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}

            <div class="section">
              <h2 class="section-title">🧩 Achievements Progress</h2>
              ${achievements.map(achievement => {
                const isUnlocked = checkInsLast30Days >= achievement.threshold;
                return `
                  <div class="achievement-item">
                    <span class="achievement-name">${isUnlocked ? '✓' : '🔒'} ${achievement.title}</span>
                    <span class="achievement-status ${isUnlocked ? 'unlocked' : 'locked'}">
                      ${isUnlocked ? 'Unlocked!' : `${checkInsLast30Days}/${achievement.threshold}`}
                    </span>
                  </div>
                `;
              }).join('')}
            </div>

            <div class="section">
              <h2 class="section-title">📅 Check-In Calendar</h2>
              ${calendarHtml}
            </div>

            ${sortedCheckIns.length > 0 ? `
              <div class="section">
                <h2 class="section-title">📋 Recent Check-Ins</h2>
                ${sortedCheckIns.slice(0, 15).map(checkIn => {
                  const score = getCheckInScore(checkIn);
                  const dateFormatted = new Date(checkIn.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  const achievements = [];
                  if (checkIn.reactedCalmly) achievements.push('Calm');
                  if (checkIn.avoidedSnapping) achievements.push('Patient');
                  if (checkIn.wasKinder) achievements.push('Kind');
                  if (checkIn.noticedPositiveSelfTalk) achievements.push('Positive');
                  if (checkIn.feltRelaxed) achievements.push('Relaxed');
                  
                  return `
                    <div class="check-in-item">
                      <span class="check-in-date">${dateFormatted}</span>
                      <span class="check-in-score">Score: ${score}/5</span>
                      ${achievements.length > 0 ? `
                        <div class="check-in-tags">${achievements.join(' • ')}</div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            ${data.journalEntries.length > 0 ? `
              <div class="section">
                <h2 class="section-title">📝 Recent Journal Entries</h2>
                ${data.journalEntries.slice(0, 15).map(entry => {
                  const dateFormatted = new Date(entry.timestamp).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  });
                  return `
                    <div class="journal-entry">
                      <div class="journal-header">
                        <span class="journal-emotion">${entry.emotionEmoji} ${entry.emotion}</span>
                        <span class="journal-date">${dateFormatted}</span>
                      </div>
                      ${entry.gratitude ? `
                        <div class="journal-label">🌸 Grateful for</div>
                        <div class="journal-text">${entry.gratitude}</div>
                      ` : ''}
                      ${entry.reflection ? `
                        <div class="journal-label">✨ Reflection</div>
                        <div class="journal-text">${entry.reflection}</div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
            ` : ''}

            <div class="footer">
              <p>Thank you for using KindMind! 🌱</p>
              <p style="margin-top: 8px; font-size: 12px;">Generated on ${exportDate}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }, [data, weeklyAnalytics, topJournalEmotions, checkInsLast30Days, successRate, currentMonth, checkInsByDate, achievements]);

  const handleScreenshot = React.useCallback(async () => {
    setIsTakingScreenshot(true);
    try {
      console.log('[Progress] Generating PDF report');
      const html = generatePdfHtml();
      
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      
      console.log('[Progress] PDF generated at:', uri);
      
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `kindmind-progress-${formatLocalDate(new Date())}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        Alert.alert('Success', 'Your PDF has been downloaded!');
      } else {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share KindMind Progress Report',
            UTI: 'com.adobe.pdf',
          });
          console.log('[Progress] PDF shared successfully');
        } else {
          Alert.alert('Success', 'Your PDF report is ready!');
        }
      }
    } catch (error) {
      console.error('[Progress] PDF generation error:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    } finally {
      setIsTakingScreenshot(false);
    }
  }, [generatePdfHtml]);

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



  return (
    <SafeAreaView style={styles.safeArea}>
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
              <Text style={styles.screenshotButtonText}>{isTakingScreenshot ? 'Generating...' : 'Export PDF'}</Text>
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

        <Animated.View style={[styles.emotionalTrendsCard, { opacity: analyticsAnim, transform: [{ translateY: analyticsAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] }]}>
          <View style={styles.trendsHeader}>
            <View>
              <Text style={styles.trendsOverview}>OVERVIEW</Text>
              <Text style={styles.trendsTitle}>Emotional Trends</Text>
            </View>
            <View style={styles.trendsProfileIcon}>
              <User size={16} color={Colors.light.textSecondary} />
            </View>
          </View>
          
          <View style={styles.dominantEmotionRow}>
            <Text style={styles.dominantEmotionText}>
              Overall Wellbeing
            </Text>
            {emotionalTrendsData.trendPercent !== 0 && (
              <View style={[
                styles.trendBadge,
                emotionalTrendsData.trendPercent > 0 ? styles.trendBadgePositive : styles.trendBadgeNegative
              ]}>
                <Text style={[
                  styles.trendBadgeText,
                  emotionalTrendsData.trendPercent > 0 ? styles.trendTextPositive : styles.trendTextNegative
                ]}>
                  {emotionalTrendsData.trendPercent > 0 ? '+' : ''}{emotionalTrendsData.trendPercent}%
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.trendsSubtitle}>Wellbeing score over the last 7 days</Text>
          
          <View style={styles.graphContainer}>
            <Svg width="100%" height={140} viewBox="0 0 320 140">
              <Defs>
                <LinearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={Colors.light.secondary} stopOpacity="0.6" />
                  <Stop offset="1" stopColor={Colors.light.secondary} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              
              {(() => {
                const points = emotionalTrendsData.dayData.map((d, i) => ({
                  x: 20 + (i * 46),
                  y: 110 - (d.score / 100) * 90,
                }));
                
                const getControlPoints = (p0: {x: number, y: number}, p1: {x: number, y: number}, p2: {x: number, y: number}) => {
                  const smoothing = 0.2;
                  const dx = p2.x - p0.x;
                  const dy = p2.y - p0.y;
                  return {
                    cp1x: p1.x - dx * smoothing,
                    cp1y: p1.y - dy * smoothing,
                    cp2x: p1.x + dx * smoothing,
                    cp2y: p1.y + dy * smoothing,
                  };
                };
                
                let pathD = `M ${points[0].x} ${points[0].y}`;
                
                for (let i = 1; i < points.length; i++) {
                  const p0 = points[i - 2] || points[i - 1];
                  const p1 = points[i - 1];
                  const p2 = points[i];
                  const p3 = points[i + 1] || points[i];
                  
                  const cp1 = getControlPoints(p0, p1, p2);
                  const cp2 = getControlPoints(p1, p2, p3);
                  
                  pathD += ` C ${cp1.cp2x} ${cp1.cp2y}, ${cp2.cp1x} ${cp2.cp1y}, ${p2.x} ${p2.y}`;
                }
                
                const peakIndex = emotionalTrendsData.dayData.findIndex(d => d === emotionalTrendsData.peakDay);
                const peakPoint = points[peakIndex];
                const hasPeakEmotion = emotionalTrendsData.peakDay.emotion !== '';
                
                return (
                  <>
                    <Path
                      d={pathD}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                    />
                    
                    {points.map((p, i) => (
                      <Circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r={4}
                        fill={Colors.light.card}
                        stroke={Colors.light.secondary}
                        strokeWidth={2}
                      />
                    ))}
                    
                    {hasPeakEmotion && peakPoint && (
                      <>
                        <Line
                          x1={peakPoint.x}
                          y1={peakPoint.y + 8}
                          x2={peakPoint.x}
                          y2={peakPoint.y + 25}
                          stroke={Colors.light.textSecondary}
                          strokeWidth={1}
                          strokeDasharray="2,2"
                        />
                      </>
                    )}
                  </>
                );
              })()}
            </Svg>
            
            {(() => {
              const peakIndex = emotionalTrendsData.dayData.findIndex(d => d === emotionalTrendsData.peakDay);
              const hasPeakEmotion = emotionalTrendsData.peakDay.emotion !== '';
              if (!hasPeakEmotion) return null;
              
              const peakX = 20 + (peakIndex * 46);
              const peakY = 110 - (emotionalTrendsData.peakDay.score / 100) * 90;
              
              return (
                <View style={[styles.peakLabel, { left: peakX - 35, top: peakY + 28 }]}>
                  <Text style={styles.peakLabelText}>PEAK {emotionalTrendsData.peakDay.emotion?.toUpperCase() || 'JOY'}</Text>
                </View>
              );
            })()}
          </View>
          
          <View style={styles.dayLabelsContainer}>
            {emotionalTrendsData.dayData.map((d, i) => (
              <Text key={i} style={styles.dayLabel}>{d.day}</Text>
            ))}
          </View>
        </Animated.View>

        {(emotionalTrendsData.trendPercent < 0 && (koraSuggestion || koraLoading)) && (
          <Animated.View style={[styles.koraCard, { opacity: koraAnim, transform: [{ translateY: koraAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
            <View style={styles.koraHeader}>
              <View style={styles.koraIconWrap}>
                <MessageCircle size={18} color={Colors.light.card} />
              </View>
              <View style={styles.koraTitleWrap}>
                <Text style={styles.koraLabel}>Kora says</Text>
                <Text style={styles.koraSubLabel}>Wellbeing support</Text>
              </View>
              <TouchableOpacity onPress={handleRefreshKora} style={styles.koraRefreshBtn} activeOpacity={0.7}>
                <RefreshCw size={14} color={Colors.light.textSecondary} />
              </TouchableOpacity>
            </View>
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
              <TouchableOpacity style={styles.koraActionBtn} onPress={() => router.push('/responses')} activeOpacity={0.7}>
                <MessageCircle size={13} color={Colors.light.secondary} />
                <Text style={styles.koraActionText}>Talk to Kora</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

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
                {!!entry.gratitude && (
                  <View style={styles.journalSection}>
                    <Text style={styles.journalSectionLabel}>🌸 Grateful for</Text>
                    <Text style={styles.journalSectionText} numberOfLines={2}>{entry.gratitude}</Text>
                  </View>
                )}
                {!!entry.reflection && (
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
  koraCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.secondary,
  },
  koraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  koraIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  koraTitleWrap: {
    flex: 1,
  },
  koraLabel: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  koraSubLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  koraRefreshBtn: {
    padding: 6,
  },
  koraMessage: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  koraLoadingWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  koraLoadingText: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    fontStyle: 'italic' as const,
  },
  koraActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  koraActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.subtle,
    borderRadius: 10,
  },
  koraActionText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.light.secondary,
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
  emotionalTrendsCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  trendsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  trendsOverview: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.light.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  trendsTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.light.text,
  },
  trendsProfileIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dominantEmotionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 4,
  },
  dominantEmotionText: {
    fontSize: 32,
    fontWeight: '300' as const,
    color: Colors.light.text,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendBadgePositive: {
    backgroundColor: '#E8F5E9',
  },
  trendBadgeNegative: {
    backgroundColor: '#FFEBEE',
  },
  trendBadgeText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  trendTextPositive: {
    color: '#2E7D32',
  },
  trendTextNegative: {
    color: '#C62828',
  },
  trendsSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 24,
  },
  graphContainer: {
    height: 160,
    marginHorizontal: -8,
    position: 'relative',
  },
  peakLabel: {
    position: 'absolute',
    backgroundColor: Colors.light.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  peakLabelText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.light.text,
    letterSpacing: 0.5,
  },
  dayLabelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginTop: 8,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.light.textSecondary,
    width: 32,
    textAlign: 'center',
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
