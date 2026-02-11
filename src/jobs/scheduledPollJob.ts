import cron from 'node-cron';
import { WebClient } from '@slack/web-api';
import { getScheduledPolls, activatePoll, updatePollMessageTs, type PollWithOptions } from '../services/pollService';
import { buildPollMessage } from '../blocks/pollMessage';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';
import { buildCreatorNotifyDM } from '../blocks/creatorNotifyDM';

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
        try {
          const result = await client.chat.postMessage({
            channel: poll.channelId,
            ...message,
          });

          // Store message_ts
          if (result.ts) {
            await updatePollMessageTs(poll.id, result.ts);
          }

          // Notify creator with action buttons
          const dm = buildCreatorNotifyDM(poll, { isScheduled: true });
          await client.chat.postMessage({ channel: poll.creatorId, ...dm });

          console.log(`Posted scheduled poll ${poll.id}: "${poll.question}"`);
        } catch (err) {
          if (isNotInChannelError(err)) {
            await client.chat.postMessage({
              channel: poll.creatorId,
              text: notInChannelText(poll.channelId),
            });
            console.warn(`Scheduled poll ${poll.id}: bot not in channel ${poll.channelId}`);
          } else {
            throw err;
          }
        }
      }
    } catch (error) {
      console.error('Scheduled poll job error:', error);
    }
  });
}
