/**
 * Truncate text to a maximum length, appending an ellipsis when cut.
 * Slack `header` blocks reject plain_text longer than 150 characters.
 */
export function truncate(text: string, max = 150): string {
  if (text.length <= max) return text;
  if (max < 1) return '';
  return `${text.slice(0, max - 1)}…`;
}
