import type { KnownBlock, Button } from '@slack/types';
import type { PollWithOptions } from '../services/pollService';
import { renderBar } from '../utils/barChart';

interface PollSettings {
  anonymous?: boolean;
  allowVoteChange?: boolean;
  liveResults?: boolean;
  ratingScale?: number;
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

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: `${totalVoters} total vote${totalVoters !== 1 ? 's' : ''} · Posted in <#${poll.channelId}>` }],
  });

  blocks.push({ type: 'divider' });

  for (let idx = 0; idx < poll.options.length; idx++) {
    const option = poll.options[idx];
    const voteCount = option._count.votes;
    let text = `*${option.label}*\n${renderBar(voteCount, totalVoters, idx)}`;

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

  // Share Results button
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: { type: 'plain_text', text: ':loudspeaker: Share Results to Channel', emoji: true },
        action_id: 'share_results',
        value: poll.id,
        style: 'primary',
      } as Button,
    ],
  });

  return {
    blocks,
    text: `Poll Results: ${poll.question}`,
  };
}
