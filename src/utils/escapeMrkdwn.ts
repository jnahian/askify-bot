/**
 * Escape user-supplied text for safe interpolation into Slack mrkdwn fields.
 * Per Slack docs, only `&`, `<`, and `>` need HTML entity escaping —
 * this prevents injection of links, user/channel mentions, and special
 * commands like <!everyone>.
 */
export function escapeMrkdwn(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
