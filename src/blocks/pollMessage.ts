import type { KnownBlock, Button } from '@slack/types';
import type { PollWithOptions } from '../services/pollService';
import { renderBar } from '../utils/barChart';
import { getOptionEmoji, getButtonEmoji } from '../utils/emojiPrefix';

interface PollSettings {
  anonymous?: boolean;
  allowVoteChange?: boolean;
  liveResults?: boolean;
  ratingScale?: number;
  allowAddingOptions?: boolean;
}

const POLL_TYPE_LABELS: Record<string, string> = {
  single_choice: 'Single Choice',
  multi_select: 'Multi-Select',
  yes_no: 'Yes / No / Maybe',
  rating: 'Rating Scale',
};

export function buildPollMessage(
  poll: PollWithOptions,
  settings: PollSettings,
  voterNames?: Map<string, string[]>,
) {
  const isClosed = poll.status === 'closed';
  const showResults = settings.liveResults || isClosed;
  const totalVoters = countUniqueVoters(poll);

  const blocks: KnownBlock[] = [];

  // Header
  blocks.push({
    type: 'header',
    text: { type: 'plain_text', text: poll.question, emoji: true },
  });

  // Context: poll type, creator, status
  const contextParts = [
    `*${POLL_TYPE_LABELS[poll.pollType] || poll.pollType}*`,
    `Posted by <@${poll.creatorId}>`,
    `${totalVoters} vote${totalVoters !== 1 ? 's' : ''}`,
  ];
  if (settings.anonymous) contextParts.push(':lock: Anonymous');
  if (isClosed) contextParts.push(':no_entry_sign: Closed');

  blocks.push({
    type: 'context',
    elements: [{ type: 'mrkdwn', text: contextParts.join('  |  ') }],
  });

  blocks.push({ type: 'divider' });

  // Options with results and/or vote buttons
  for (let idx = 0; idx < poll.options.length; idx++) {
    const option = poll.options[idx];
    const voteCount = option._count.votes;
    const emoji = getOptionEmoji(poll.pollType, idx, option.label);
    const btnEmoji = getButtonEmoji(poll.pollType, idx, option.label);
    const labelWithEmoji = `${emoji} ${option.label}`;

    if (showResults) {
      // Show bar chart with color coding by position
      let text = `*${labelWithEmoji}*\n${renderBar(voteCount, totalVoters, idx)}`;

      // Show voter names (non-anonymous, non-closed or always for closed)
      if (!settings.anonymous && voterNames?.has(option.id)) {
        const names = voterNames.get(option.id)!;
        if (names.length > 0) {
          text += `\n${names.map((n) => `<@${n}>`).join(', ')}`;
        }
      }

      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text },
        ...(isClosed
          ? {}
          : {
              accessory: {
                type: 'button',
                text: { type: 'plain_text', text: btnEmoji, emoji: true },
                action_id: `vote_${option.id}`,
                value: `${poll.id}:${option.id}`,
              } as Button,
            }),
      });
    } else {
      // No results shown — just buttons
      blocks.push({
        type: 'section',
        text: { type: 'mrkdwn', text: `*${labelWithEmoji}*` },
        accessory: {
          type: 'button',
          text: { type: 'plain_text', text: btnEmoji, emoji: true },
          action_id: `vote_${option.id}`,
          value: `${poll.id}:${option.id}`,
        } as Button,
      });
    }
  }

  // Rating average (for rating polls)
  if (poll.pollType === 'rating' && showResults && totalVoters > 0) {
    const weightedSum = poll.options.reduce(
      (sum, opt) => sum + parseInt(opt.label, 10) * opt._count.votes,
      0,
    );
    const avg = (weightedSum / totalVoters).toFixed(1);
    blocks.push({ type: 'divider' });
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `:star: *Average Rating: ${avg}*` },
    });
  }

  // Action buttons (only for active polls)
  if (!isClosed) {
    blocks.push({ type: 'divider' });
    const actionElements: Button[] = [];

    // Add Option button (when allowed)
    if (settings.allowAddingOptions) {
      actionElements.push({
        type: 'button',
        text: { type: 'plain_text', text: ':heavy_plus_sign: Add Option', emoji: true },
        action_id: 'add_option',
        value: poll.id,
      } as Button);
    }

    if (actionElements.length > 0) {
      blocks.push({
        type: 'actions',
        block_id: 'poll_actions',
        elements: actionElements,
      });
    }
  }

  return { blocks, text: poll.question };
}

function countUniqueVoters(poll: PollWithOptions): number {
  // Total voters = sum of all option votes for single/yes_no/rating (each voter votes once)
  // For multi_select, _count.votes on the poll gives total vote rows, but we need unique voters
  // We use the poll-level _count as an approximation; exact count comes from the vote service
  return poll._count.votes;
}

export function buildResultsDM(
  poll: PollWithOptions,
  settings: PollSettings,
  voterNames?: Map<string, string[]>,
): string {
  const totalVoters = poll._count.votes;
  let text = `:bar_chart: *Poll Results: ${poll.question}*\n\n`;

  for (let idx = 0; idx < poll.options.length; idx++) {
    const option = poll.options[idx];
    const voteCount = option._count.votes;
    const emoji = getOptionEmoji(poll.pollType, idx, option.label);
    text += `*${emoji} ${option.label}*\n${renderBar(voteCount, totalVoters)}\n`;

    if (!settings.anonymous && voterNames?.has(option.id)) {
      const names = voterNames.get(option.id)!;
      if (names.length > 0) {
        text += `Voters: ${names.map((n) => `<@${n}>`).join(', ')}\n`;
      }
    }
    text += '\n';
  }

  if (poll.pollType === 'rating' && totalVoters > 0) {
    const weightedSum = poll.options.reduce(
      (sum, opt) => sum + parseInt(opt.label, 10) * opt._count.votes,
      0,
    );
    text += `:star: *Average Rating: ${(weightedSum / totalVoters).toFixed(1)}*\n`;
  }

  text += `\n_Total votes: ${totalVoters}_`;
  return text;
}
