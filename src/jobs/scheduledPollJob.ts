import cron from 'node-cron';
import { WebClient } from '@slack/web-api';
import { getScheduledPolls, activatePoll, updatePollMessageTs, type PollWithOptions } from '../services/pollService';
import { buildPollMessage } from '../blocks/pollMessage';

export function startScheduledPollJob(client: WebClient): void {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const polls = await getScheduledPolls();

      for (const rawPoll of polls) {
        const poll = rawPoll as unknown as PollWithOptions;
        // Activate the poll
        await activatePoll(poll.id);

        const settings = poll.settings as {
          anonymous?: boolean;
          allowVoteChange?: boolean;
          liveResults?: boolean;
        };

        // Post to channel
        const message = buildPollMessage(poll, settings);
        const result = await client.chat.postMessage({
          channel: poll.channelId,
          ...message,
        });

        // Store message_ts
        if (result.ts) {
          await updatePollMessageTs(poll.id, result.ts);
        }

        // Notify creator
        await client.chat.postMessage({
          channel: poll.creatorId,
          text: `:white_check_mark: Your scheduled poll *"${poll.question}"* is now live in <#${poll.channelId}>!`,
        });

        console.log(`Posted scheduled poll ${poll.id}: "${poll.question}"`);
      }
    } catch (error) {
      console.error('Scheduled poll job error:', error);
    }
  });
}
