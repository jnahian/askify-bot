import type { KnownBlock, Button } from '@slack/types';
import type { PollWithOptions } from '../services/pollService';

interface CreatorNotifyOptions {
  isScheduled?: boolean;
  isRecovery?: boolean;
}

/**
 * Build DM blocks to notify the creator that their poll is now live.
 * Includes "Save as Template" and "Close Poll" action buttons.
 */
export function buildCreatorNotifyDM(
  poll: PollWithOptions,
  options: CreatorNotifyOptions = {},
) {
  const { isRecovery } = options;

  let text = `:white_check_mark: Your poll *"${poll.question}"* is now live in <#${poll.channelId}>!`;
  if (isRecovery) {
    text += ' _(posted on startup recovery)_';
  }

  const blocks: KnownBlock[] = [
    {
      type: 'section',
      text: { type: 'mrkdwn', text },
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: ':floppy_disk: Save as Template', emoji: true },
          action_id: 'save_as_template',
          value: poll.id,
          style: 'primary',
        } as Button,
        {
          type: 'button',
          text: { type: 'plain_text', text: ':no_entry_sign: Close Poll', emoji: true },
          action_id: 'close_poll',
          value: poll.id,
          style: 'danger',
          confirm: {
            title: { type: 'plain_text', text: 'Close this poll?' },
            text: { type: 'plain_text', text: 'This will end voting and display final results.' },
            confirm: { type: 'plain_text', text: 'Close' },
            deny: { type: 'plain_text', text: 'Cancel' },
          },
        } as Button,
      ],
    },
  ];

  return {
    blocks,
    text: `Your poll "${poll.question}" is now live!`,
  };
}
