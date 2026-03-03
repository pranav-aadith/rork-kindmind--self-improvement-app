export interface Level {
  level: number;
  name: string;
  emoji: string;
  minXP: number;
  maxXP: number;
  color: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Seedling', emoji: '🌱', minXP: 0, maxXP: 100, color: '#7CB98A' },
  { level: 2, name: 'Sprout', emoji: '🌿', minXP: 100, maxXP: 250, color: '#6BBF8B' },
  { level: 3, name: 'Bloom', emoji: '🌸', minXP: 250, maxXP: 500, color: '#E8A5C4' },
  { level: 4, name: 'Grower', emoji: '🌺', minXP: 500, maxXP: 850, color: '#E07A90' },
  { level: 5, name: 'Thriver', emoji: '🌻', minXP: 850, maxXP: 1300, color: '#F5C548' },
  { level: 6, name: 'Flourisher', emoji: '✨', minXP: 1300, maxXP: 1900, color: '#B5A8D6' },
  { level: 7, name: 'Sage', emoji: '🔮', minXP: 1900, maxXP: 2700, color: '#9B7EC8' },
  { level: 8, name: 'Guardian', emoji: '🏆', minXP: 2700, maxXP: 3800, color: '#F0A500' },
  { level: 9, name: 'Master', emoji: '💎', minXP: 3800, maxXP: 5300, color: '#5BC4D4' },
  { level: 10, name: 'Enlightened', emoji: '⭐', minXP: 5300, maxXP: 999999, color: '#FFD700' },
];

export function getLevelInfo(xp: number): {
  current: Level;
  progressPercent: number;
  xpInLevel: number;
  xpForNextLevel: number;
} {
  const current = LEVELS.find(l => xp >= l.minXP && xp < l.maxXP) ?? LEVELS[LEVELS.length - 1];
  const xpInLevel = xp - current.minXP;
  const xpForNextLevel = current.maxXP - current.minXP;
  const progressPercent = Math.min((xpInLevel / xpForNextLevel) * 100, 100);
  return { current, progressPercent, xpInLevel, xpForNextLevel };
}

export const XP_REWARDS = {
  CHECK_IN: 30,
  JOURNAL: 25,
  TRIGGER: 20,
  MEDITATION: 20,
  PAUSE: 15,
  INTENTION_SET: 10,
  INTENTION_COMPLETE: 15,
  STREAK_7: 50,
  STREAK_14: 100,
  STREAK_30: 200,
};

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  color: string;
  bgColor: string;
  type: 'streak' | 'checkins' | 'triggers' | 'journal' | 'meditation' | 'xp' | 'level';
  threshold: number;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_checkin',
    title: 'First Step',
    description: 'Complete your first check-in',
    emoji: '👣',
    color: '#8DC8C4',
    bgColor: '#E3F2EF',
    type: 'checkins',
    threshold: 1,
  },
  {
    id: 'streak_3',
    title: 'Ignited',
    description: '3-day streak',
    emoji: '🔥',
    color: '#F5874F',
    bgColor: '#FEF0E9',
    type: 'streak',
    threshold: 3,
  },
  {
    id: 'streak_7',
    title: 'Week Warrior',
    description: '7-day streak',
    emoji: '⚡',
    color: '#F5C548',
    bgColor: '#FEF9E7',
    type: 'streak',
    threshold: 7,
  },
  {
    id: 'streak_14',
    title: 'Fortnight Flow',
    description: '14-day streak',
    emoji: '🌊',
    color: '#5BC4D4',
    bgColor: '#E8F8FB',
    type: 'streak',
    threshold: 14,
  },
  {
    id: 'streak_30',
    title: 'Monthly Master',
    description: '30-day streak',
    emoji: '🏆',
    color: '#F0A500',
    bgColor: '#FEF5E4',
    type: 'streak',
    threshold: 30,
  },
  {
    id: 'checkins_5',
    title: 'Self-Aware',
    description: '5 check-ins completed',
    emoji: '🪞',
    color: '#B5A8D6',
    bgColor: '#F0EDF9',
    type: 'checkins',
    threshold: 5,
  },
  {
    id: 'checkins_20',
    title: 'Consistent',
    description: '20 check-ins completed',
    emoji: '📅',
    color: '#8DC8C4',
    bgColor: '#E3F2EF',
    type: 'checkins',
    threshold: 20,
  },
  {
    id: 'checkins_50',
    title: 'Habit Forged',
    description: '50 check-ins completed',
    emoji: '⚙️',
    color: '#6B9FB5',
    bgColor: '#E3EFF5',
    type: 'checkins',
    threshold: 50,
  },
  {
    id: 'journal_1',
    title: 'Inner Voice',
    description: 'Write your first journal entry',
    emoji: '✍️',
    color: '#E8A5C4',
    bgColor: '#FCF0F6',
    type: 'journal',
    threshold: 1,
  },
  {
    id: 'journal_5',
    title: 'Reflective',
    description: '5 journal entries written',
    emoji: '📖',
    color: '#C49BC3',
    bgColor: '#F5EEF8',
    type: 'journal',
    threshold: 5,
  },
  {
    id: 'journal_20',
    title: 'Deep Thinker',
    description: '20 journal entries written',
    emoji: '🧠',
    color: '#9B7EC8',
    bgColor: '#EDE8F7',
    type: 'journal',
    threshold: 20,
  },
  {
    id: 'journal_50',
    title: 'Life Chronicler',
    description: '50 journal entries written',
    emoji: '📚',
    color: '#7B5EA7',
    bgColor: '#EAE3F5',
    type: 'journal',
    threshold: 50,
  },
  {
    id: 'triggers_5',
    title: 'Pattern Spotter',
    description: 'Log 5 emotional triggers',
    emoji: '🔍',
    color: '#F5A623',
    bgColor: '#FEF5E4',
    type: 'triggers',
    threshold: 5,
  },
  {
    id: 'triggers_20',
    title: 'Trigger Master',
    description: 'Log 20 emotional triggers',
    emoji: '🎯',
    color: '#E07A90',
    bgColor: '#FCEEF2',
    type: 'triggers',
    threshold: 20,
  },
  {
    id: 'xp_100',
    title: 'Getting Started',
    description: 'Earn 100 XP',
    emoji: '🌟',
    color: '#7CB98A',
    bgColor: '#EAF5EC',
    type: 'xp',
    threshold: 100,
  },
  {
    id: 'xp_500',
    title: 'Momentum Builder',
    description: 'Earn 500 XP',
    emoji: '🚀',
    color: '#5BC4D4',
    bgColor: '#E8F8FB',
    type: 'xp',
    threshold: 500,
  },
  {
    id: 'xp_1000',
    title: 'Growth Champion',
    description: 'Earn 1,000 XP',
    emoji: '💪',
    color: '#F5C548',
    bgColor: '#FEF9E7',
    type: 'xp',
    threshold: 1000,
  },
];
