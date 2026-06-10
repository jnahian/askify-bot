import { WebClient } from '@slack/web-api';
import {
  getExpiredPolls,
  getScheduledPolls,
  getStrandedActivePolls,
  claimPollClose,
  claimScheduledPoll,
  getPoll,
  updatePollMessageTs,
} from '../services/pollService';
import type { PollWithOptions } from '../services/pollService';
import { getVotersByOption, getUniqueVoterCount } from '../services/voteService';
import { buildPollMessage } from '../blocks/pollMessage';
import { buildResultsDMBlocks } from '../blocks/resultsDM';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';
import { buildCreatorNotifyDM } from '../blocks/creatorNotifyDM';

/**
 * Run once on startup to handle anything missed while the bot was down.
 */
export async function runStartupRecovery(client: WebClient): Promise<void> {
  try {
    // Helper: post a poll's message and notify the creator
    const postPoll = async (poll: PollWithOptions): Promise<void> => {
      const settings = poll.settings as {
        anonymous?: boolean;
        allowVoteChange?: boolean;
        liveResults?: boolean;
      };

      const message = buildPollMessage(poll, settings);
      try {
        const result = await client.chat.postMessage({
          channel: poll.channelId,
          ...message,
        });

        if (result.ts) {
          await updatePollMessageTs(poll.id, result.ts);
        }

        const dm = buildCreatorNotifyDM(poll, { isScheduled: true, isRecovery: true });
        await client.chat.postMessage({ channel: poll.creatorId, ...dm });
      } catch (err) {
        if (isNotInChannelError(err)) {
          await client.chat.postMessage({
            channel: poll.creatorId,
            text: notInChannelText(poll.channelId),
          });
          console.warn(`[Recovery] Poll ${poll.id}: bot not in channel ${poll.channelId}`);
        } else {
          throw err;
        }
      }
    };

    // Snapshot stranded polls before processing scheduled ones, so polls we
    // post (or fail to post) below aren't immediately retried in step 2
    const strandedPolls = await getStrandedActivePolls();

    // 1. Post any overdue scheduled polls
    const scheduledPolls = await getScheduledPolls();
    for (const rawPoll of scheduledPolls) {
      const poll = rawPoll as unknown as PollWithOptions;
      try {
        const claimed = await claimScheduledPoll(poll.id);
        if (!claimed) continue;

        await postPoll(poll);
        console.log(`[Recovery] Posted overdue scheduled poll ${poll.id}: "${poll.question}"`);
      } catch (error) {
        console.error(`[Recovery] Error posting scheduled poll ${poll.id}:`, error);
      }
    }

    // 2. Re-post polls that were claimed (active) but never reached Slack —
    // e.g. the bot crashed between claiming and chat.postMessage
    for (const rawPoll of strandedPolls) {
      const poll = rawPoll as unknown as PollWithOptions;
      try {
        await postPoll(poll);
        console.log(`[Recovery] Posted stranded active poll ${poll.id}: "${poll.question}"`);
      } catch (error) {
        console.error(`[Recovery] Error posting stranded poll ${poll.id}:`, error);
      }
    }

    // 3. Close any overdue active polls
    const expiredPolls = await getExpiredPolls();
    for (const poll of expiredPolls) {
      try {
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

        const message = buildPollMessage(closedPoll, { ...settings, liveResults: true }, voterNames, uniqueVoters);
        await client.chat.update({
          channel: closedPoll.channelId,
          ts: closedPoll.messageTs,
          ...message,
        });

        const dm = buildResultsDMBlocks(closedPoll, settings, voterNames, uniqueVoters);
        await client.chat.postMessage({
          channel: closedPoll.creatorId,
          ...dm,
        });

        console.log(`[Recovery] Auto-closed overdue poll ${poll.id}: "${poll.question}"`);
      } catch (error) {
        console.error(`[Recovery] Error closing expired poll ${poll.id}:`, error);
      }
    }

    if (scheduledPolls.length > 0 || strandedPolls.length > 0 || expiredPolls.length > 0) {
      console.log(`[Recovery] Processed ${scheduledPolls.length} scheduled, ${strandedPolls.length} stranded, ${expiredPolls.length} expired polls`);
    }
  } catch (error) {
    console.error('[Recovery] Startup recovery error:', error);
  }
}
