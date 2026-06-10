import cron, { type ScheduledTask } from 'node-cron';
import { WebClient } from '@slack/web-api';
import { getPollsNeedingReminders, claimReminderSend } from '../services/pollService';
import { getSettings } from '../types/pollSettings';
import prisma from '../lib/prisma';
import { withRetry } from '../utils/slackRetry';
import { escapeMrkdwn } from '../utils/escapeMrkdwn';

export function startReminderJob(client: WebClient): ScheduledTask {
  let isRunning = false;

  // Run every 15 minutes
  return cron.schedule('*/15 * * * *', async () => {
    if (isRunning) return; // previous tick still in progress
    isRunning = true;
    try {
      const polls = await getPollsNeedingReminders();
      if (polls.length === 0) return;

      // Fetch the bot's own user ID once per run so we never DM ourselves
      let botUserId: string | undefined;
      try {
        const auth = await withRetry(() => client.auth.test());
        botUserId = auth.user_id;
      } catch {
        // Non-fatal — continue without the filter
      }

      for (const poll of polls) {
        try {
          const settings = getSettings(poll);
          if (!settings.reminders) continue;
          if (!poll.closesAt || !poll.messageTs) continue;

          // Atomically claim the reminder before sending so concurrent
          // workers/ticks can't double-DM
          const claimed = await claimReminderSend(poll.id);
          if (!claimed) continue;

          // Get channel members (paginated)
          let members: string[] = [];
          try {
            let cursor: string | undefined;
            do {
              const result = await withRetry(() => client.conversations.members({
                channel: poll.channelId,
                limit: 1000,
                cursor,
              }));
              members = members.concat(result.members || []);
              cursor = result.response_metadata?.next_cursor || undefined;
            } while (cursor);
          } catch {
            // Bot may not have access — skip this poll
            continue;
          }

          if (botUserId) {
            members = members.filter((m) => m !== botUserId);
          }

          // Get voters
          const votes = await prisma.vote.findMany({
            where: { pollId: poll.id },
            select: { voterId: true },
            distinct: ['voterId'],
          });
          const voterSet = new Set(votes.map((v) => v.voterId));

          // Non-voters (exclude bots by checking if they voted — simple heuristic)
          const nonVoters = members.filter((m) => !voterSet.has(m));

          if (nonVoters.length === 0) continue;

          const hoursLeft = Math.round(
            (poll.closesAt.getTime() - Date.now()) / (1000 * 60 * 60),
          );
          const timeLabel = hoursLeft <= 1 ? 'less than an hour' : `~${hoursLeft} hours`;

          // Build deep link to poll message
          const messageLink = `https://slack.com/archives/${poll.channelId}/p${poll.messageTs.replace('.', '')}`;

          // DM each non-voter
          for (const userId of nonVoters) {
            try {
              await withRetry(() => client.chat.postMessage({
                channel: userId,
                text: `:bell: Reminder: The poll *"${escapeMrkdwn(poll.question)}"* in <#${poll.channelId}> closes in ${timeLabel}.\n<${messageLink}|Vote now>`,
              }));
            } catch {
              // User may have DMs disabled — skip
            }
          }

          console.log(`Sent reminders for poll ${poll.id}: "${poll.question}" to ${nonVoters.length} user(s)`);
        } catch (error) {
          // Don't let one poll's failure abort the rest of the batch
          console.error(`Reminder job error for poll ${poll.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Reminder job error:', error);
    } finally {
      isRunning = false;
    }
  });
}
