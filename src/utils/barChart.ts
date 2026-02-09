const FILLED = '\u2588';  // █
const EMPTY = '\u2591';   // ░
const BAR_LENGTH = 12;

export function renderBar(count: number, total: number): string {
  const percentage = total > 0 ? count / total : 0;
  const filled = Math.round(percentage * BAR_LENGTH);
  const empty = BAR_LENGTH - filled;
  const pct = total > 0 ? Math.round(percentage * 100) : 0;

  return `${FILLED.repeat(filled)}${EMPTY.repeat(empty)}  ${pct}% (${count})`;
}

export function renderResultsText(
  options: { label: string; voteCount: number }[],
  totalVoters: number,
): string {
  return options
    .map((opt) => `${opt.label}\n${renderBar(opt.voteCount, totalVoters)}`)
    .join('\n\n');
}
