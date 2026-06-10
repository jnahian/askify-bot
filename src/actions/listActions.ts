import { App } from '@slack/bolt';
import type { KnownBlock } from "@slack/types";
import { buildPollMessage } from '../blocks/pollMessage';
import { buildResultsDMBlocks } from '../blocks/resultsDM';
import {
  cancelScheduledPoll,
  claimPollClose,
  getPoll,
} from "../services/pollService";
import { getSettings } from '../types/pollSettings';
import { getVotersByOption, getUniqueVoterCount } from "../services/voteService";
import { escapeMrkdwn } from '../utils/escapeMrkdwn';

export function registerListActions(app: App): void {
  // Close poll from /askify list
  app.action(/^list_close_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const poll = await getPoll(pollId);
    if (!poll) return;

    // Only creator can close the poll
    if (poll.creatorId !== body.user.id) {
      await client.chat.postEphemeral({
        channel: body.channel?.id || poll.channelId,
        user: body.user.id,
        text: ':x: Only the poll creator can do this.',
      });
      return;
    }

    // Atomically claim the close — only the claimer sends the results
    // side-effects, so a race with auto-close can't double-send DMs
    const claimed = await claimPollClose(pollId);
    if (!claimed) {
      await client.chat.postEphemeral({
        channel: body.channel?.id || poll.channelId,
        user: body.user.id,
        text: ':information_source: This poll is already closed.',
      });
      return;
    }

    const closedPoll = await getPoll(pollId);
    if (!closedPoll) return;

    const settings = getSettings(closedPoll);

    // Update channel message if it exists
    if (closedPoll.messageTs) {
      let voterNames: Map<string, string[]> | undefined;
      if (!settings.anonymous) {
        voterNames = await getVotersByOption(pollId);
      }

      const uniqueVoters = await getUniqueVoterCount(closedPoll);

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
    }

    // Notify in ephemeral
    await client.chat.postEphemeral({
      channel: body.channel?.id || closedPoll.channelId,
      user: body.user.id,
      text: `:white_check_mark: Poll *"${escapeMrkdwn(closedPoll.question)}"* has been closed.`,
    });
  });

  // Cancel scheduled poll from /askify list
  app.action(/^list_cancel_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const poll = await getPoll(pollId);
    if (!poll) return;

    // Only creator can cancel the poll
    if (poll.creatorId !== body.user.id) {
      await client.chat.postEphemeral({
        channel: body.channel?.id || body.user.id,
        user: body.user.id,
        text: ':x: Only the poll creator can do this.',
      });
      return;
    }

    // Conditional cancel — only succeeds if the poll is still scheduled
    const cancelled = await cancelScheduledPoll(pollId);
    const question = escapeMrkdwn(poll.question);

    await client.chat.postEphemeral({
      channel: body.channel?.id || body.user.id,
      user: body.user.id,
      text: cancelled
        ? `:white_check_mark: Scheduled poll *"${question}"* has been cancelled.`
        : `:warning: Poll *"${question}"* could not be cancelled — it has already been posted.`,
    });
  });

  // View results from /askify list
  app.action(/^list_results_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const poll = await getPoll(pollId);
    if (!poll) return;

    // Only creator can view results from the list
    if (poll.creatorId !== body.user.id) {
      await client.chat.postEphemeral({
        channel: body.channel?.id || poll.channelId,
        user: body.user.id,
        text: ':x: Only the poll creator can do this.',
      });
      return;
    }

    const settings = getSettings(poll);

    const totalVoters = await getUniqueVoterCount(poll);
    let voterNames: Map<string, string[]> | undefined;
    if (!settings.anonymous) {
      voterNames = await getVotersByOption(pollId);
    }

    // Reuse buildResultsDMBlocks and adapt for modal
    const { blocks: dmBlocks } = buildResultsDMBlocks(poll, settings, voterNames, totalVoters);

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
