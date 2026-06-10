/**
 * Render a capped list of user mentions so section blocks stay safely
 * under Slack's 3000-character text limit.
 */
export const MAX_RENDERED_MENTIONS = 20;

export function formatMentions(userIds: string[], max: number = MAX_RENDERED_MENTIONS): string {
  const shown = userIds.slice(0, max).map((id) => `<@${id}>`).join(', ');
  const remaining = userIds.length - max;
  return remaining > 0 ? `${shown} …and ${remaining} more` : shown;
}
