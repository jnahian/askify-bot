import type { KnownBlock, Button } from '@slack/types';
import type { PollWithOptions } from '../services/pollService';
import { renderBar } from '../utils/barChart';
import { getOptionEmoji } from '../utils/emojiPrefix';

interface PollSettings {
  anonymous?: boolean;
  allowVoteChange?: boolean;
  liveResults?: boolean;
  ratingScale?: number;
  description?: string;
}

/**
 * Build DM blocks for poll results with a "Share Results" button.
 */
export function buildResultsDMBlocks(
  poll: PollWithOptions,
  settings: PollSettings,
  voterNames?: Map<string, string[]>,
) {
  const totalVoters = poll._count.votes;
  const blocks: KnownBlock[] = [];

  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: `Poll Results: ${poll.question}`, emoji: true },
  });

  if (settings.description) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: settings.description },
    });
  }

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `${totalVoters} total vote${totalVoters !== 1 ? 's' : ''} · Posted in <#${poll.channelId}>` }],
  });

  blocks.push({ type: 'divider' });

  for (let idx = 0; idx < poll.options.length; idx++) {
    const option = poll.options[idx];
    const voteCount = option._count.votes;
    const emoji = getOptionEmoji(poll.pollType, idx, option.label);
    let text = `*${emoji} ${option.label}*\n${renderBar(voteCount, totalVoters, idx)}`;

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

  // Action buttons: Share Results + Repost
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: ':loudspeaker: Share Results', emoji: true },
        action_id: 'share_results',
        value: poll.id,
        style: 'primary',
      } as Button,
      {
        type: 'button',
        text: { type: 'plain_text', text: ':recycle: Repost', emoji: true },
        action_id: `repost_poll_${poll.id}`,
        value: poll.id,
      } as Button,
      {
        type: 'button',
        text: { type: 'plain_text', text: ':clock3: Schedule Repost', emoji: true },
        action_id: `schedule_repost_${poll.id}`,
        value: poll.id,
      } as Button,
    ],
  });

  return {
    blocks,
    text: `Poll Results: ${poll.question}`,
  };
}
