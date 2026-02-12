import { App } from '@slack/bolt';
import type { KnownBlock } from "@slack/types";
import { buildPollMessage } from '../blocks/pollMessage';
import { buildResultsDMBlocks } from '../blocks/resultsDM';
import {
  cancelScheduledPoll,
  closePoll,
  getPoll,
} from "../services/pollService";
import { getVotersByOption } from "../services/voteService";

export function registerListActions(app: App): void {
  // Close poll from /askify list
  app.action(/^list_close_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    await closePoll(pollId);

    const closedPoll = await getPoll(pollId);
    if (!closedPoll) return;

    const settings = closedPoll.settings as {
      anonymous?: boolean;
      allowVoteChange?: boolean;
      liveResults?: boolean;
    };

    // Update channel message if it exists
    if (closedPoll.messageTs) {
      let voterNames: Map<string, string[]> | undefined;
      if (!settings.anonymous) {
        voterNames = await getVotersByOption(pollId);
      }

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
    }

    // Notify in ephemeral
    await client.chat.postEphemeral({
      channel: body.channel?.id || closedPoll.channelId,
      user: body.user.id,
      text: `:white_check_mark: Poll *"${closedPoll.question}"* has been closed.`,
    });
  });

  // Cancel scheduled poll from /askify list
  app.action(/^list_cancel_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    await cancelScheduledPoll(pollId);

    const poll = await getPoll(pollId);
    const question = poll?.question || 'Unknown poll';

    await client.chat.postEphemeral({
      channel: body.channel?.id || '',
      user: body.user.id,
      text: `:white_check_mark: Scheduled poll *"${question}"* has been cancelled.`,
    });
  });

  // View results from /askify list
  app.action(/^list_results_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const poll = await getPoll(pollId);
    if (!poll) return;

    const settings = poll.settings as {
      anonymous?: boolean;
      liveResults?: boolean;
      description?: string;
    };

    const totalVoters = poll._count.votes;
    let voterNames: Map<string, string[]> | undefined;
    if (!settings.anonymous) {
      voterNames = await getVotersByOption(pollId);
    }

    // Reuse buildResultsDMBlocks and adapt for modal
    const { blocks: dmBlocks } = buildResultsDMBlocks(poll, settings, voterNames);

    // Remove the header (first block - modal has its own title)
    const blocks = dmBlocks.slice(1);

    // Find and update the context block to include status
    const contextBlockIndex = blocks.findIndex(b => b.type === 'context');
    if (contextBlockIndex !== -1 && blocks[contextBlockIndex].type === 'context') {
      const contextBlock = blocks[contextBlockIndex];
      const statusText = poll.status === 'closed' ? ':no_entry_sign: Closed' : ':large_green_circle: Active';
      contextBlock.elements = [{
        type: 'mrkdwn',
        text: `${totalVoters} total vote${totalVoters !== 1 ? 's' : ''} · Posted in <#${poll.channelId}> · ${statusText}`,
      }];
    }

    // Remove the last two blocks (divider + Share Results button)
    blocks.splice(-2, 2);

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: {
        type: 'modal',
        title: { type: 'plain_text', text: 'Poll Results' },
        close: { type: 'plain_text', text: 'Close' },
        blocks,
      },
    });
  });
}
