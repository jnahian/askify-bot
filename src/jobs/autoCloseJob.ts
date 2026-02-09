import cron from 'node-cron';
import { WebClient } from '@slack/web-api';
import { getExpiredPolls, closePoll, getPoll } from '../services/pollService';
import { getVotersByOption } from '../services/voteService';
import { buildPollMessage } from '../blocks/pollMessage';
import { buildResultsDMBlocks } from '../blocks/resultsDM';

export function startAutoCloseJob(client: WebClient): void {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const expiredPolls = await getExpiredPolls();

      for (const poll of expiredPolls) {
        await closePoll(poll.id);

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

        // Update channel message
        const message = buildPollMessage(closedPoll, { ...settings, liveResults: true }, voterNames);
        await client.chat.update({
          channel: closedPoll.channelId,
          ts: closedPoll.messageTs,
          ...message,
        });

        // DM results to creator with "Share Results" button
        const dm = buildResultsDMBlocks(closedPoll, settings, voterNames);
        await client.chat.postMessage({
          channel: closedPoll.creatorId,
          ...dm,
        });

        console.log(`Auto-closed poll ${poll.id}: "${poll.question}"`);
      }
    } catch (error) {
      console.error('Auto-close job error:', error);
    }
  });
}
