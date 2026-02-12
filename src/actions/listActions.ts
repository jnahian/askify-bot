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
import { renderBar } from '../utils/barChart';
import { getOptionEmoji } from '../utils/emojiPrefix';

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

    // Build modal blocks
    const blocks: KnownBlock[] = [];

    if (settings.description) {
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: settings.description },
      });
    }

    blocks.push({
      type: 'context',
      elements: [{
        type: 'mrkdwn',
        text: `${totalVoters} total vote${totalVoters !== 1 ? 's' : ''} · Posted in <#${poll.channelId}> · ${poll.status === 'closed' ? ':no_entry_sign: Closed' : ':large_green_circle: Active'}`,
      }],
    });

    blocks.push({ type: 'divider' });

    for (let idx = 0; idx < poll.options.length; idx++) {
      const option = poll.options[idx];
      const voteCount = option._count.votes;
      const emoji = getOptionEmoji(poll.pollType, idx, option.label);
      let text = `*${emoji} ${option.label}*\n\n${renderBar(voteCount, totalVoters, idx)}`;

      if (!settings.anonymous && voterNames?.has(option.id)) {
        const names = voterNames.get(option.id)!;
        if (names.length > 0) {
          text += `\nVoters: ${names.map((n) => `<@${n}>`).join(', ')}`;
        }
      }

      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text },
      });
    }

    // Rating average
    if (poll.pollType === 'rating' && totalVoters > 0) {
      const weightedSum = poll.options.reduce(
        (sum, opt) => sum + parseInt(opt.label, 10) * opt._count.votes,
        0,
      );
      blocks.push({ type: 'divider' });
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `:star: *Average Rating: ${(weightedSum / totalVoters).toFixed(1)}*` },
      });
    }

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
