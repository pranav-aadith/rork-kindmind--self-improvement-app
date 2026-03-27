export const DAILY_QUOTES = [
  "Be kind whenever possible. It is always possible.",
  "In a world where you can be anything, be kind.",
  "Kindness is the language the deaf can hear and the blind can see.",
  "A single act of kindness throws out roots in all directions.",
  "Treat yourself with the same kindness you'd give a good friend.",
  "The greatest gift you can give yourself is compassion.",
  "Your present circumstances don't determine where you can go.",
  "You are enough, just as you are.",
  "Small steps every day lead to big changes.",
  "Be patient with yourself. Growth takes time.",
  "You deserve the same love and care you give to others.",
  "Every day is a fresh start to be the person you want to be.",
  "Your feelings are valid, and it's okay to feel them.",
  "Progress, not perfection, is what matters.",
  "You are worthy of love, peace, and happiness.",
  "Be gentle with yourself. You're doing the best you can.",
  "The way you speak to yourself matters.",
  "Self-compassion is not self-indulgence, it's self-care.",
  "You have the power to create positive change in your life.",
  "Healing is not linear, and that's perfectly okay.",
  "Every moment is a chance to begin again.",
  "You are braver than you believe and stronger than you seem.",
  "Give yourself the grace to grow at your own pace.",
  "Your mental health matters. You matter.",
  "Small acts of self-kindness add up to big transformations.",
  "Be proud of how far you've come.",
  "You don't have to be perfect to be worthy of love.",
  "Taking care of yourself isn't selfish, it's essential.",
  "You are doing better than you think you are.",
  "Trust the process of your own growth.",
  "Every step forward, no matter how small, is progress.",
];

export function getDailyQuote(): string {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const diff = today.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  const index = dayOfYear % DAILY_QUOTES.length;
  return DAILY_QUOTES[index];
}
