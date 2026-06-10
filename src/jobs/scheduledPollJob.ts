import cron, { type ScheduledTask } from 'node-cron';
import { WebClient } from '@slack/web-api';
import { getScheduledPolls, claimScheduledPoll, getPoll, updatePollMessageTs } from '../services/pollService';
import { getSettings } from '../types/pollSettings';
import { buildPollMessage } from '../blocks/pollMessage';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';
import { buildCreatorNotifyDM } from '../blocks/creatorNotifyDM';
import { withRetry } from '../utils/slackRetry';

export function startScheduledPollJob(client: WebClient): ScheduledTask {
  let isRunning = false;

  // Run every minute
  return cron.schedule('* * * * *', async () => {
    if (isRunning) return; // previous tick still in progress
    isRunning = true;
    try {
      const polls = await getScheduledPolls();

      for (const poll of polls) {
        try {
          // Atomically claim the poll (scheduled → active); skip if another
          // worker/tick already claimed it
          const claimed = await claimScheduledPoll(poll.id);
          if (!claimed) continue;

          // Re-fetch after claiming: the claim may have waited on an edit
          // transaction, leaving the pre-claim snapshot stale
          const freshPoll = await getPoll(poll.id);
          if (!freshPoll) continue;

          const settings = getSettings(freshPoll);

          // Post to channel
          const message = buildPollMessage(freshPoll, settings);
          try {
            const result = await withRetry(() => client.chat.postMessage({
              channel: freshPoll.channelId,
              ...message,
            }));

            // Store message_ts
            if (result.ts) {
              await updatePollMessageTs(freshPoll.id, result.ts);
            }

            // Notify creator with action buttons
            const dm = buildCreatorNotifyDM(freshPoll, { isScheduled: true });
            await withRetry(() => client.chat.postMessage({ channel: freshPoll.creatorId, ...dm }));

            console.log(`Posted scheduled poll ${freshPoll.id}: "${freshPoll.question}"`);
          } catch (err) {
            if (isNotInChannelError(err)) {
              await withRetry(() => client.chat.postMessage({
                channel: freshPoll.creatorId,
                text: notInChannelText(freshPoll.channelId),
              }));
              console.warn(`Scheduled poll ${freshPoll.id}: bot not in channel ${freshPoll.channelId}`);
            } else {
              throw err;
            }
          }
        } catch (error) {
          // Poll is claimed (active) but may have no messageTs — startup
          // recovery will retry posting it. Don't abort the rest of the batch.
          console.error(`Scheduled poll job error for poll ${poll.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Scheduled poll job error:', error);
    } finally {
      isRunning = false;
    }
  });
}
