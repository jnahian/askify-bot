const BAR_LENGTH = 14;

// Color-coded bar segments based on position/ranking
const BAR_COLORS = [
  ':large_green_square:',   // 1st place / high
  ':large_blue_square:',    // 2nd place
  ':large_purple_square:',  // 3rd place
  ':large_orange_square:',  // 4th place
  ':large_yellow_square:',  // 5th+
];

const EMPTY_SEGMENT = ':white_large_square:';

/**
 * Render an emoji-based progress bar with percentage.
 * Uses colored emoji squares for a cleaner look in Slack.
 */
export function renderBar(count: number, total: number, colorIndex: number = 0): string {
  const percentage = total > 0 ? count / total : 0;
  const filled = Math.round(percentage * BAR_LENGTH);
  const empty = BAR_LENGTH - filled;
  const pct = total > 0 ? Math.round(percentage * 100) : 0;

  const color = BAR_COLORS[Math.min(colorIndex, BAR_COLORS.length - 1)];
  const bar = color.repeat(filled) + EMPTY_SEGMENT.repeat(empty);

  return `${bar}  ${pct}% (${count})`;
}

/**
 * Render a simple text bar (for contexts where emoji squares are too heavy).
 */
export function renderTextBar(count: number, total: number): string {
  const FILLED = '\u2588';  // █
  const EMPTY = '\u2591';   // ░
  const percentage = total > 0 ? count / total : 0;
  const filled = Math.round(percentage * 10);
  const empty = 10 - filled;
  const pct = total > 0 ? Math.round(percentage * 100) : 0;

  return `${FILLED.repeat(filled)}${EMPTY.repeat(empty)}  ${pct}% (${count})`;
}

export function renderResultsText(
  options: { label: string; voteCount: number }[],
  totalVoters: number,
): string {
  return options
    .map((opt, i) => `${opt.label}\n${renderBar(opt.voteCount, totalVoters, i)}`)
    .join('\n\n');
}
