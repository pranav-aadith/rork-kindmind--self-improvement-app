import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Platform } from 'react-native';
import type { UserData, UserGoal, TriggerEntry, DailyCheckIn, OnboardingAnswers, JournalEntry, NotificationSettings, NotificationFrequency } from '@/types';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const STORAGE_KEY = 'kindmind_data';

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

const defaultNotificationSettings: NotificationSettings = {
  enabled: false,
  frequency: 'off',
  times: ['09:00'],
};

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
  notificationSettings: defaultNotificationSettings,
};

const REMINDER_MESSAGES = [
  { title: 'Time for a check-in 🌟', body: 'How are you feeling? Take a moment to reflect.' },
  { title: 'KindMind Reminder 💭', body: 'A quick check-in can make a big difference.' },
  { title: 'Pause & Reflect ✨', body: 'Your emotional wellness matters. Check in now.' },
  { title: 'Mindful Moment 🧘', body: 'Take a breath and check in with yourself.' },
  { title: 'Self-Care Check 💚', body: "How's your day going? Log your feelings." },
];

const getTimesForFrequency = (frequency: NotificationFrequency): string[] => {
  switch (frequency) {
    case 'daily':
      return ['09:00'];
    case 'twice_daily':
      return ['09:00', '20:00'];
    case 'three_times':
      return ['09:00', '14:00', '20:00'];
    default:
      return [];
  }
};

export const [KindMindProvider, useKindMind] = createContextHook(() => {
  const [data, setData] = useState<UserData>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<boolean>(false);

  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'web') {
        console.log('Notifications not fully supported on web');
        return false;
      }
      
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      const granted = finalStatus === 'granted';
      setNotificationPermission(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  const scheduleNotifications = useCallback(async (settings: NotificationSettings) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      if (!settings.enabled || settings.frequency === 'off' || settings.times.length === 0) {
        console.log('Notifications disabled or no times set');
        return;
      }

      if (Platform.OS === 'web') {
        console.log('Scheduled notifications not supported on web');
        return;
      }

      for (const timeStr of settings.times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const randomMessage = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
        
        await Notifications.scheduleNotificationAsync({
          content: {
            title: randomMessage.title,
            body: randomMessage.body,
            sound: true,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
          },
        });
        
        console.log(`Scheduled notification for ${timeStr}`);
      }
    } catch (error) {
      console.error('Error scheduling notifications:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const loadData = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const checkIns = parsed.checkIns || [];
        const accurateStreak = calculateAccurateStreak(checkIns);
        const newLongest = Math.max(accurateStreak, parsed.longestStreak || 0);
        
        const loadedData: UserData = {
          ...initialData,
          ...parsed,
          username: parsed.username || '',
          goals: parsed.goals || defaultGoals,
          checkIns: checkIns,
          triggers: parsed.triggers || [],
          journalEntries: parsed.journalEntries || [],
          currentStreak: accurateStreak,
          longestStreak: newLongest,
          notificationSettings: parsed.notificationSettings || defaultNotificationSettings,
        };
        
        setData(loadedData);
        
        if (loadedData.notificationSettings.enabled) {
          scheduleNotifications(loadedData.notificationSettings);
        }
        
        if (accurateStreak !== parsed.currentStreak) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loadedData));
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async (newData: UserData) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setData(newData);
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  const completeOnboarding = (username: string, selectedGoals: UserGoal[], answers: OnboardingAnswers) => {
    const newData = {
      ...data,
      hasCompletedOnboarding: true,
      username,
      goals: selectedGoals,
      onboardingAnswers: answers,
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

  const logout = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(STORAGE_KEY);
      setData(initialData);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const updateNotificationSettings = async (frequency: NotificationFrequency, customTimes?: string[]) => {
    const hasPermission = await requestNotificationPermission();
    
    if (!hasPermission && frequency !== 'off') {
      console.log('Notification permission not granted');
      return false;
    }

    const times = customTimes || getTimesForFrequency(frequency);
    const newSettings: NotificationSettings = {
      enabled: frequency !== 'off',
      frequency,
      times,
    };

    const newData = {
      ...data,
      notificationSettings: newSettings,
    };

    await saveData(newData);
    await scheduleNotifications(newSettings);
    return true;
  };

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
    logout,
    checkInsLast30Days,
    updateNotificationSettings,
    notificationPermission,
    requestNotificationPermission,
  };
});
