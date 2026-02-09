import cron from 'node-cron';
import { WebClient } from '@slack/web-api';
import { getPollsNeedingReminders, markReminderSent } from '../services/pollService';
import prisma from '../lib/prisma';

export function startReminderJob(client: WebClient): void {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const polls = await getPollsNeedingReminders();

      for (const poll of polls) {
        const settings = poll.settings as { reminders?: boolean };
        if (!settings.reminders) continue;
        if (!poll.closesAt || !poll.messageTs) continue;

        // Get channel members
        let members: string[] = [];
        try {
          const result = await client.conversations.members({
            channel: poll.channelId,
            limit: 1000,
          });
          members = result.members || [];
        } catch {
          // Bot may not have access — skip this poll
          continue;
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

        if (nonVoters.length === 0) {
          await markReminderSent(poll.id);
          continue;
        }

        const hoursLeft = Math.round(
          (poll.closesAt.getTime() - Date.now()) / (1000 * 60 * 60),
        );
        const timeLabel = hoursLeft <= 1 ? 'less than an hour' : `~${hoursLeft} hours`;

        // Build deep link to poll message
        const messageLink = `https://slack.com/archives/${poll.channelId}/p${poll.messageTs.replace('.', '')}`;

        // DM each non-voter
        for (const userId of nonVoters) {
          try {
            await client.chat.postMessage({
              channel: userId,
              text: `:bell: Reminder: The poll *"${poll.question}"* in <#${poll.channelId}> closes in ${timeLabel}.\n<${messageLink}|Vote now>`,
            });
          } catch {
            // User may have DMs disabled — skip
          }
        }

        await markReminderSent(poll.id);
        console.log(`Sent reminders for poll ${poll.id}: "${poll.question}" to ${nonVoters.length} user(s)`);
      }
    } catch (error) {
      console.error('Reminder job error:', error);
    }
  });
}
