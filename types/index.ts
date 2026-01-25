export interface UserGoal {
  id: string;
  label: string;
  selected: boolean;
}

export interface OnboardingAnswers {
  reactionSpeed: string;
  commonTriggers: string[];
  relationshipImpact: string;
  awareness: string;
  frequency: string;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  gratitude: string;
  reflection: string;
  emotion: string;
  emotionEmoji: string;
}

export interface TriggerEntry {
  id: string;
  timestamp: number;
  situation: string;
  reaction: string;
  emotion: string;
  intensity: number;
}

export interface DailyCheckIn {
  id: string;
  date: string;
  reactedCalmly: boolean;
  avoidedSnapping: boolean;
  wasKinder: boolean;
  noticedPositiveSelfTalk: boolean;
  feltRelaxed: boolean;
}

export type NotificationFrequency = 'off' | 'daily' | 'twice_daily' | 'three_times' | 'custom';

export interface NotificationSettings {
  enabled: boolean;
  frequency: NotificationFrequency;
  times: string[]; // Array of times in HH:mm format
}

export interface UserData {
  hasCompletedOnboarding: boolean;
  username: string;
  goals: UserGoal[];
  onboardingAnswers: OnboardingAnswers | null;
  triggers: TriggerEntry[];
  journalEntries: JournalEntry[];
  checkIns: DailyCheckIn[];
  currentStreak: number;
  longestStreak: number;
  notificationSettings: NotificationSettings;
}

export interface KindResponse {
  id: string;
  category: string;
  situation: string;
  response: string;
}
