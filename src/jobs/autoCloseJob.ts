import cron from 'node-cron';
import { WebClient } from '@slack/web-api';
import { getExpiredPolls, claimPollClose, getPoll } from '../services/pollService';
import { getVotersByOption, getUniqueVoterCount } from '../services/voteService';
import { buildPollMessage } from '../blocks/pollMessage';
import { buildResultsDMBlocks } from '../blocks/resultsDM';

export function startAutoCloseJob(client: WebClient): void {
  let isRunning = false;

  // Run every minute
  cron.schedule('* * * * *', async () => {
    if (isRunning) return; // previous tick still in progress
    isRunning = true;
    try {
      const expiredPolls = await getExpiredPolls();

      for (const poll of expiredPolls) {
        try {
          // Atomically claim the close (active → closed); skip if another
          // worker/tick already closed it
          const claimed = await claimPollClose(poll.id);
          if (!claimed) continue;

          const closedPoll = await getPoll(poll.id);
          if (!closedPoll || !closedPoll.messageTs) continue;

          const settings = closedPoll.settings as {
            anonymous?: boolean;
            allowVoteChange?: boolean;
            liveResults?: boolean;
          };

          let voterNames: Map<string, string[]> | undefined;
          if (!settings.anonymous) {
            voterNames = await getVotersByOption(poll.id);
          }

          const uniqueVoters = await getUniqueVoterCount(closedPoll);

          // Update channel message
          const message = buildPollMessage(closedPoll, { ...settings, liveResults: true }, voterNames, uniqueVoters);
          await client.chat.update({
            channel: closedPoll.channelId,
            ts: closedPoll.messageTs,
            ...message,
          });

          // DM results to creator with "Share Results" button
          const dm = buildResultsDMBlocks(closedPoll, settings, voterNames, uniqueVoters);
          await client.chat.postMessage({
            channel: closedPoll.creatorId,
            ...dm,
          });

          console.log(`Auto-closed poll ${poll.id}: "${poll.question}"`);
        } catch (error) {
          // Don't let one poll's Slack failure abort the rest of the batch
          console.error(`Auto-close job error for poll ${poll.id}:`, error);
        }
      }
    } catch (error) {
      console.error('Auto-close job error:', error);
    } finally {
      isRunning = false;
    }
  });
}
