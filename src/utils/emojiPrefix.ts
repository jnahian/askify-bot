const NUMBER_EMOJIS = [
  '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣',
  '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟',
];

const STAR = '⭐';

const YES_NO_EMOJIS: Record<string, string> = {
  'Yes': '✅',
  'No': '❌',
  'Maybe': '🤷',
};

/**
 * Get a number emoji for the given 0-based index (e.g., 0 → 1️⃣).
 * Falls back to the number in parentheses for indices >= 10.
 */
export function getNumberEmoji(index: number): string {
  return NUMBER_EMOJIS[index] ?? `(${index + 1})`;
}

/**
 * Get star emoji string for the given rating value (e.g., 3 → ⭐⭐⭐).
 */
export function getStarEmoji(rating: number): string {
  return STAR.repeat(Math.max(1, Math.min(rating, 10)));
}

/**
 * Get the appropriate emoji prefix for a poll option.
 * - Yes/No/Maybe polls: dedicated emojis (✅, ❌, 🤷)
 * - Rating polls: star emojis based on option label (numeric)
 * - All other polls: number emoji based on position
 */
export function getOptionEmoji(pollType: string, index: number, label: string): string {
  if (pollType === 'yes_no') {
    return YES_NO_EMOJIS[label] ?? getNumberEmoji(index);
  }
  if (pollType === 'rating') {
    const rating = parseInt(label, 10);
    return isNaN(rating) ? getNumberEmoji(index) : getStarEmoji(rating);
  }
  return getNumberEmoji(index);
}
