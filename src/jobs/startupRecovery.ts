import { WebClient } from '@slack/web-api';
import { getExpiredPolls, getScheduledPolls, closePoll, activatePoll, getPoll, updatePollMessageTs } from '../services/pollService';
import type { PollWithOptions } from '../services/pollService';
import { getVotersByOption } from '../services/voteService';
import { buildPollMessage } from '../blocks/pollMessage';
import { buildResultsDMBlocks } from '../blocks/resultsDM';

/**
 * Run once on startup to handle anything missed while the bot was down.
 */
export async function runStartupRecovery(client: WebClient): Promise<void> {
  try {
    // 1. Post any overdue scheduled polls
    const scheduledPolls = await getScheduledPolls();
    for (const rawPoll of scheduledPolls) {
      const poll = rawPoll as unknown as PollWithOptions;
      await activatePoll(poll.id);

      const settings = poll.settings as {
        anonymous?: boolean;
        allowVoteChange?: boolean;
        liveResults?: boolean;
      };

      const message = buildPollMessage(poll, settings);
      const result = await client.chat.postMessage({
        channel: poll.channelId,
        ...message,
      });

      if (result.ts) {
        await updatePollMessageTs(poll.id, result.ts);
      }

      await client.chat.postMessage({
        channel: poll.creatorId,
        text: `:white_check_mark: Your scheduled poll *"${poll.question}"* is now live in <#${poll.channelId}>! (posted on startup recovery)`,
      });

      console.log(`[Recovery] Posted overdue scheduled poll ${poll.id}: "${poll.question}"`);
    }

    // 2. Close any overdue active polls
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

      const message = buildPollMessage(closedPoll, { ...settings, liveResults: true }, voterNames);
      await client.chat.update({
        channel: closedPoll.channelId,
        ts: closedPoll.messageTs,
        ...message,
      });

      const dm = buildResultsDMBlocks(closedPoll, settings, voterNames);
      await client.chat.postMessage({
        channel: closedPoll.creatorId,
        ...dm,
      });

      console.log(`[Recovery] Auto-closed overdue poll ${poll.id}: "${poll.question}"`);
    }

    if (scheduledPolls.length > 0 || expiredPolls.length > 0) {
      console.log(`[Recovery] Processed ${scheduledPolls.length} scheduled, ${expiredPolls.length} expired polls`);
    }
  } catch (error) {
    console.error('[Recovery] Startup recovery error:', error);
  }
}
