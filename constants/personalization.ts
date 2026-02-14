import type { OnboardingAnswers, Milestone } from '@/types';

interface PersonalizedTip {
  emoji: string;
  title: string;
  message: string;
  action?: string;
}

const REACTION_TIPS: Record<string, PersonalizedTip[]> = {
  instant: [
    { emoji: '🧊', title: 'Cool Down First', message: 'Try counting to 5 before responding today. Your instant reactions need a speed bump.', action: 'pause' },
    { emoji: '✋', title: 'Pause Power', message: 'When you feel the urge to react, place your hand on your chest. Feel your heartbeat slow down.', action: 'pause' },
    { emoji: '🌊', title: 'Ride the Wave', message: 'Emotions are like waves — intense but temporary. Let this one pass before you act.' },
  ],
  quick: [
    { emoji: '⏸️', title: 'Extend the Gap', message: 'You already have a brief pause. Try stretching it — take one deep breath before reacting.', action: 'pause' },
    { emoji: '🪞', title: 'Mirror Check', message: 'Before responding, ask yourself: "Will I be proud of this reaction in an hour?"' },
    { emoji: '🎯', title: 'Aim Before You Fire', message: 'Your quick reactions show passion. Channel that energy into a thoughtful response.' },
  ],
  delayed: [
    { emoji: '💪', title: 'Your Strength', message: 'Your ability to pause is a superpower. Use that space to choose kindness today.' },
    { emoji: '🧘', title: 'Mindful Moment', message: 'Your natural pause gives you time. Fill it with a calming breath.', action: 'meditation' },
    { emoji: '🌱', title: 'Growing Well', message: 'You already have emotional awareness. Today, practice turning that awareness into action.' },
  ],
  thoughtful: [
    { emoji: '⭐', title: 'Lead by Example', message: 'Your thoughtful nature is rare. Share that calm energy with someone who needs it today.' },
    { emoji: '📝', title: 'Reflect & Record', message: 'Journal about a moment you handled well recently. Celebrate your emotional maturity.', action: 'journal' },
    { emoji: '🌟', title: 'Deepen Your Practice', message: 'Try a longer meditation today to further strengthen your mindful responses.', action: 'meditation' },
  ],
};

const TRIGGER_TIPS: Record<string, PersonalizedTip[]> = {
  criticism: [
    { emoji: '🛡️', title: 'Separate Self from Feedback', message: 'Criticism is about behavior, not your worth. You are more than any single comment.' },
  ],
  ignored: [
    { emoji: '💬', title: 'Speak Up Kindly', message: 'If you feel unheard, try: "I have something important to share. Can I have a moment?"' },
  ],
  stress: [
    { emoji: '🫧', title: 'Release the Pressure', message: 'High stress narrows your thinking. A 2-minute breathing exercise can widen your perspective.', action: 'pause' },
  ],
  unfairness: [
    { emoji: '⚖️', title: 'Choose Your Battles', message: 'Not every unfairness needs a reaction. Ask: "Will this matter in a week?"' },
  ],
  misunderstood: [
    { emoji: '🗣️', title: 'Clarify with Care', message: 'Instead of reacting, try: "I think there might be a misunderstanding. Can I explain what I meant?"' },
  ],
  disrespect: [
    { emoji: '👑', title: 'Your Worth is Yours', message: 'Disrespect says more about them than you. Respond with dignity, not anger.' },
  ],
  control: [
    { emoji: '🎈', title: 'Let Go a Little', message: 'Focus on what you can control: your breath, your words, your next action.' },
  ],
  interruption: [
    { emoji: '🤝', title: 'Gentle Redirect', message: 'Try: "I\'d love to finish my thought, then I really want to hear yours."' },
  ],
};

const FREQUENCY_TIPS: Record<string, PersonalizedTip> = {
  'multiple-daily': { emoji: '🔄', title: 'One at a Time', message: 'Focus on just the next interaction. You don\'t have to fix everything today — just this moment.' },
  daily: { emoji: '📅', title: 'Daily Practice', message: 'One mindful moment per day can shift your pattern. Make today\'s count.' },
  'few-weekly': { emoji: '📊', title: 'Pattern Spotter', message: 'Pay attention to which days are harder. Patterns reveal what needs attention.' },
  weekly: { emoji: '🗓️', title: 'Weekly Check', message: 'You\'re already managing well. Use your check-ins to catch subtle patterns.' },
  rarely: { emoji: '✨', title: 'Maintenance Mode', message: 'You\'re in a great place. Focus on deepening your emotional awareness.' },
};

export function getPersonalizedTip(answers: OnboardingAnswers | null): PersonalizedTip {
  if (!answers) {
    return { emoji: '🌿', title: 'Start Your Day Mindfully', message: 'Take a deep breath and set a positive intention for today.' };
  }

  const allTips: PersonalizedTip[] = [];

  const reactionTips = REACTION_TIPS[answers.reactionSpeed];
  if (reactionTips) {
    allTips.push(...reactionTips);
  }

  if (answers.commonTriggers.length > 0) {
    const randomTrigger = answers.commonTriggers[Math.floor(Math.random() * answers.commonTriggers.length)];
    const triggerTip = TRIGGER_TIPS[randomTrigger];
    if (triggerTip) {
      allTips.push(...triggerTip);
    }
  }

  const freqTip = FREQUENCY_TIPS[answers.frequency];
  if (freqTip) {
    allTips.push(freqTip);
  }

  if (allTips.length === 0) {
    return { emoji: '🌿', title: 'Start Your Day Mindfully', message: 'Take a deep breath and set a positive intention for today.' };
  }

  const today = new Date();
  const dayIndex = today.getDate() + today.getMonth() * 31;
  return allTips[dayIndex % allTips.length];
}

export const INTENTIONS = [
  { emoji: '🧘', label: 'Stay calm in tough moments' },
  { emoji: '💬', label: 'Speak with kindness' },
  { emoji: '👂', label: 'Listen before reacting' },
  { emoji: '🌊', label: 'Let go of what I can\'t control' },
  { emoji: '❤️', label: 'Be patient with myself' },
  { emoji: '🤝', label: 'Respond, don\'t react' },
  { emoji: '🌱', label: 'Grow through this challenge' },
  { emoji: '✨', label: 'Choose peace over being right' },
  { emoji: '🫂', label: 'Show compassion to others' },
  { emoji: '🔋', label: 'Protect my energy today' },
];

export const DEFAULT_MILESTONES: Milestone[] = [
  { id: 'streak_3', type: 'streak', title: 'Getting Started', description: '3-day streak', threshold: 3, unlockedAt: null },
  { id: 'streak_7', type: 'streak', title: 'Week Warrior', description: '7-day streak', threshold: 7, unlockedAt: null },
  { id: 'streak_14', type: 'streak', title: 'Two Week Strong', description: '14-day streak', threshold: 14, unlockedAt: null },
  { id: 'streak_30', type: 'streak', title: 'Monthly Master', description: '30-day streak', threshold: 30, unlockedAt: null },
  { id: 'checkins_5', type: 'checkins', title: 'Self-Aware', description: '5 check-ins completed', threshold: 5, unlockedAt: null },
  { id: 'checkins_20', type: 'checkins', title: 'Consistent Checker', description: '20 check-ins completed', threshold: 20, unlockedAt: null },
  { id: 'checkins_50', type: 'checkins', title: 'Habit Former', description: '50 check-ins completed', threshold: 50, unlockedAt: null },
  { id: 'triggers_5', type: 'triggers', title: 'Trigger Tracker', description: '5 triggers logged', threshold: 5, unlockedAt: null },
  { id: 'triggers_20', type: 'triggers', title: 'Pattern Finder', description: '20 triggers logged', threshold: 20, unlockedAt: null },
  { id: 'journal_5', type: 'journal', title: 'Reflective Mind', description: '5 journal entries', threshold: 5, unlockedAt: null },
  { id: 'journal_20', type: 'journal', title: 'Deep Thinker', description: '20 journal entries', threshold: 20, unlockedAt: null },
  { id: 'journal_50', type: 'journal', title: 'Journaling Pro', description: '50 journal entries', threshold: 50, unlockedAt: null },
];

export function getSmartInsight(data: {
  checkIns: { reactedCalmly: boolean; avoidedSnapping: boolean; wasKinder: boolean; noticedPositiveSelfTalk: boolean; feltRelaxed: boolean; date: string }[];
  triggers: { emotion: string; intensity: number; timestamp: number }[];
  journalEntries: { emotion: string; timestamp: number }[];
  currentStreak: number;
}): { emoji: string; message: string } | null {
  if (data.checkIns.length < 2) return null;

  const recent = data.checkIns.slice(0, 5);
  const calmCount = recent.filter(c => c.reactedCalmly).length;
  const kindCount = recent.filter(c => c.wasKinder).length;
  const relaxedCount = recent.filter(c => c.feltRelaxed).length;

  if (calmCount >= 4) {
    return { emoji: '🏆', message: `You've been remarkably calm lately — ${calmCount} out of your last ${recent.length} check-ins. Keep it up!` };
  }

  if (kindCount >= 4) {
    return { emoji: '💛', message: `Your kindness is shining — you reported being kinder in ${kindCount} of your last ${recent.length} days.` };
  }

  if (relaxedCount >= 4) {
    return { emoji: '🧘', message: `You've been finding peace — felt relaxed in ${relaxedCount} of your last ${recent.length} check-ins. Beautiful progress.` };
  }

  if (data.currentStreak >= 7) {
    return { emoji: '🔥', message: `${data.currentStreak}-day streak! Consistency is building your emotional resilience every single day.` };
  }

  const recentTriggers = data.triggers.filter(t => t.timestamp > Date.now() - 7 * 86400000);
  if (recentTriggers.length > 0) {
    const avgIntensity = recentTriggers.reduce((s, t) => s + t.intensity, 0) / recentTriggers.length;
    if (avgIntensity < 4) {
      return { emoji: '📉', message: 'Your trigger intensity has been low this week. You\'re handling situations with more ease.' };
    }
  }

  if (calmCount === 0 && recent.length >= 3) {
    return { emoji: '🌿', message: 'Tough days happen. Try a breathing exercise today — even 60 seconds can shift your state.' };
  }

  return { emoji: '📈', message: `You've completed ${data.checkIns.length} check-ins. Every reflection builds your self-awareness muscle.` };
}
