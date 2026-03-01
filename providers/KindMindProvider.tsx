import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useMemo } from 'react';
import type { UserData, UserGoal, TriggerEntry, DailyCheckIn, OnboardingAnswers, JournalEntry, DailyIntention, Milestone } from '@/types';
import { DEFAULT_MILESTONES } from '@/constants/personalization';
import { useAuth } from '@/providers/AuthProvider';

const getStorageKey = (userId: string) => `kindmind_data_${userId}`;

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateAccurateStreak = (checkIns: DailyCheckIn[]): number => {
  if (checkIns.length === 0) return 0;
  
  const sortedDates = checkIns
    .map(c => c.date)
    .sort((a, b) => b.localeCompare(a));
  
  const today = formatLocalDate(new Date());
  const yesterday = formatLocalDate(new Date(Date.now() - 86400000));
  
  const mostRecentDate = sortedDates[0];
  
  if (mostRecentDate !== today && mostRecentDate !== yesterday) {
    return 0;
  }
  
  let streak = 0;
  let currentDate = mostRecentDate === today ? new Date() : new Date(Date.now() - 86400000);
  
  const dateSet = new Set(sortedDates);
  
  while (dateSet.has(formatLocalDate(currentDate))) {
    streak++;
    currentDate = new Date(currentDate.getTime() - 86400000);
  }
  
  return streak;
};

const defaultGoals: UserGoal[] = [
  { id: '1', label: 'I want to be calmer', selected: false },
  { id: '2', label: 'I want to stop snapping at people', selected: false },
  { id: '3', label: 'I want to understand my triggers', selected: false },
  { id: '4', label: 'I want to improve my relationships', selected: false },
  { id: '5', label: 'I want to pause before reacting', selected: false },
];

const initialData: UserData = {
  hasCompletedOnboarding: false,
  username: '',
  goals: defaultGoals,
  onboardingAnswers: null,
  triggers: [],
  journalEntries: [],
  checkIns: [],
  currentStreak: 0,
  longestStreak: 0,
  dailyIntention: null,
  milestones: DEFAULT_MILESTONES,
  preferredName: '',
};

export const [KindMindProvider, useKindMind] = createContextHook(() => {
  const { user } = useAuth();
  const [data, setData] = useState<UserData>(initialData);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      setData(initialData);
      setIsLoading(false);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const storageKey = getStorageKey(user.id);
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        const checkIns = parsed.checkIns || [];
        const accurateStreak = calculateAccurateStreak(checkIns);
        const newLongest = Math.max(accurateStreak, parsed.longestStreak || 0);
        
        const fallbackName = user?.user_metadata?.full_name || '';
        const loadedData: UserData = {
          ...initialData,
          ...parsed,
          username: parsed.username || fallbackName,
          goals: parsed.goals || defaultGoals,
          checkIns: checkIns,
          triggers: parsed.triggers || [],
          journalEntries: parsed.journalEntries || [],
          currentStreak: accurateStreak,
          longestStreak: newLongest,
          dailyIntention: parsed.dailyIntention || null,
          milestones: parsed.milestones || DEFAULT_MILESTONES,
          preferredName: parsed.preferredName || '',
        };
        
        setData(loadedData);
        
        if (accurateStreak !== parsed.currentStreak) {
          await AsyncStorage.setItem(storageKey, JSON.stringify(loadedData));
        }
      } else {
        const defaultName = user?.user_metadata?.full_name || '';
        setData({ ...initialData, username: defaultName, milestones: DEFAULT_MILESTONES });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: UserData) => {
    if (!user) return;
    
    try {
      const storageKey = getStorageKey(user.id);
      await AsyncStorage.setItem(storageKey, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const completeOnboarding = (username: string, selectedGoals: UserGoal[], answers: OnboardingAnswers, preferredName?: string) => {
    const newData: UserData = {
      ...data,
      hasCompletedOnboarding: true,
      username,
      goals: selectedGoals,
      onboardingAnswers: answers,
      preferredName: preferredName || username || '',
    };
    saveData(newData);
  };

  const addTrigger = (trigger: Omit<TriggerEntry, 'id' | 'timestamp'>) => {
    const newTrigger: TriggerEntry = {
      ...trigger,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const newData = {
      ...data,
      triggers: [newTrigger, ...data.triggers],
    };
    saveData(newData);
  };

  const addJournalEntry = (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };
    const newData = {
      ...data,
      journalEntries: [newEntry, ...data.journalEntries],
    };
    saveData(newData);
  };

  const addCheckIn = (checkIn: Omit<DailyCheckIn, 'id' | 'date'>) => {
    const today = formatLocalDate(new Date());
    const existingToday = data.checkIns.find(c => c.date === today);
    
    if (existingToday) {
      return;
    }

    const newCheckIn: DailyCheckIn = {
      ...checkIn,
      id: Date.now().toString(),
      date: today,
    };

    const updatedCheckIns = [newCheckIn, ...data.checkIns];
    const newStreak = calculateAccurateStreak(updatedCheckIns);
    const newLongest = Math.max(newStreak, data.longestStreak);

    const newData = {
      ...data,
      checkIns: updatedCheckIns,
      currentStreak: newStreak,
      longestStreak: newLongest,
    };
    saveData(newData);
  };

  const topEmotions = useMemo(() => {
    const emotionCounts: Record<string, number> = {};
    data.triggers.forEach(t => {
      emotionCounts[t.emotion] = (emotionCounts[t.emotion] || 0) + 1;
    });
    return Object.entries(emotionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([emotion, count]) => ({ emotion, count }));
  }, [data.triggers]);

  const successRate = useMemo(() => {
    if (data.checkIns.length === 0) return 0;
    const totalResponses = data.checkIns.length * 5;
    const positiveResponses = data.checkIns.reduce((sum, c) => {
      return sum + 
        (c.reactedCalmly ? 1 : 0) + 
        (c.avoidedSnapping ? 1 : 0) + 
        (c.wasKinder ? 1 : 0) + 
        (c.noticedPositiveSelfTalk ? 1 : 0) + 
        (c.feltRelaxed ? 1 : 0);
    }, 0);
    return Math.round((positiveResponses / totalResponses) * 100);
  }, [data.checkIns]);

  const checkInsLast30Days = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = formatLocalDate(thirtyDaysAgo);
    
    return data.checkIns.filter(c => c.date >= thirtyDaysAgoStr).length;
  }, [data.checkIns]);

  const hasCheckedInToday = useMemo(() => {
    const today = formatLocalDate(new Date());
    return data.checkIns.some(c => c.date === today);
  }, [data.checkIns]);

  const updateUsername = (newUsername: string) => {
    const newData = {
      ...data,
      username: newUsername,
    };
    saveData(newData);
  };

  const setDailyIntention = (intention: string) => {
    const today = formatLocalDate(new Date());
    const newIntention: DailyIntention = {
      date: today,
      intention,
      completed: false,
    };
    const newData = { ...data, dailyIntention: newIntention };
    saveData(newData);
  };

  const completeDailyIntention = () => {
    if (!data.dailyIntention) return;
    const newData = {
      ...data,
      dailyIntention: { ...data.dailyIntention, completed: true },
    };
    saveData(newData);
  };

  const checkAndUpdateMilestones = (): Milestone | null => {
    const currentMilestones = data.milestones || DEFAULT_MILESTONES;
    let newlyUnlocked: Milestone | null = null;

    const updated = currentMilestones.map(m => {
      if (m.unlockedAt) return m;

      let currentValue = 0;
      switch (m.type) {
        case 'streak': currentValue = data.currentStreak; break;
        case 'checkins': currentValue = data.checkIns.length; break;
        case 'triggers': currentValue = data.triggers.length; break;
        case 'journal': currentValue = data.journalEntries.length; break;
        default: currentValue = 0;
      }

      if (currentValue >= m.threshold) {
        const unlocked = { ...m, unlockedAt: Date.now() };
        if (!newlyUnlocked) newlyUnlocked = unlocked;
        return unlocked;
      }
      return m;
    });

    if (newlyUnlocked) {
      const newData = { ...data, milestones: updated };
      saveData(newData);
    }

    return newlyUnlocked;
  };

  const todaysIntention = useMemo(() => {
    if (!data.dailyIntention) return null;
    const today = formatLocalDate(new Date());
    if (data.dailyIntention.date !== today) return null;
    return data.dailyIntention;
  }, [data.dailyIntention]);

  const unlockedMilestones = useMemo(() => {
    return (data.milestones || []).filter(m => m.unlockedAt !== null);
  }, [data.milestones]);

  const nextMilestone = useMemo(() => {
    const locked = (data.milestones || []).filter(m => m.unlockedAt === null);
    if (locked.length === 0) return null;
    return locked[0];
  }, [data.milestones]);

  const displayName = useMemo(() => {
    return data.preferredName || data.username || 'there';
  }, [data.preferredName, data.username]);

  return {
    data,
    isLoading,
    completeOnboarding,
    addTrigger,
    addJournalEntry,
    addCheckIn,
    topEmotions,
    successRate,
    hasCheckedInToday,
    updateUsername,
    checkInsLast30Days,
    setDailyIntention,
    completeDailyIntention,
    checkAndUpdateMilestones,
    todaysIntention,
    unlockedMilestones,
    nextMilestone,
    displayName,
  };
});
