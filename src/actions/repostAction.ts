import { App } from '@slack/bolt';
import { getPoll, repostPoll, updatePollMessageTs } from '../services/pollService';
import { buildPollMessage } from '../blocks/pollMessage';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';

export const REPOST_MODAL_CALLBACK_ID = 'repost_poll_modal';

export function registerRepostAction(app: App): void {
  // Repost button clicked — open modal with channel select
  app.action(/^repost_poll_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const poll = await getPoll(pollId);
    if (!poll) return;

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: {
        type: 'modal',
        callback_id: REPOST_MODAL_CALLBACK_ID,
        private_metadata: pollId,
        title: { type: 'plain_text', text: 'Repost Poll' },
        submit: { type: 'plain_text', text: 'Repost Now' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Repost *"${poll.question}"* as a fresh poll with zero votes.`,
            },
          },
          {
            type: 'input',
            block_id: 'repost_channel_block',
            label: { type: 'plain_text', text: 'Post to Channel' },
            element: {
              type: 'conversations_select',
              action_id: 'repost_channel_select',
              default_to_current_conversation: true,
              filter: { include: ['public', 'private'], exclude_bot_users: true },
              ...(poll.channelId ? { initial_conversation: poll.channelId } : {}),
            },
          },
        ],
      },
    });
  });
}

export function registerRepostSubmission(app: App): void {
  app.view(REPOST_MODAL_CALLBACK_ID, async ({ ack, view, client, body }) => {
    const sourcePollId = view.private_metadata;
    const channelId = view.state.values.repost_channel_block?.repost_channel_select?.selected_conversation;

    if (!channelId) {
      await ack({ response_action: 'errors', errors: { repost_channel_block: 'Please select a channel.' } });
      return;
    }

    await ack();

    const creatorId = body.user.id;

    try {
      const newPoll = await repostPoll(sourcePollId, creatorId, { channelId });

      const settings = newPoll.settings as {
        anonymous?: boolean;
        allowVoteChange?: boolean;
        liveResults?: boolean;
        allowAddingOptions?: boolean;
        description?: string;
      };

      const message = buildPollMessage(newPoll, settings);
      const result = await client.chat.postMessage({
        channel: channelId,
        ...message,
      });

      if (result.ts) {
        await updatePollMessageTs(newPoll.id, result.ts);
      }

      await client.chat.postMessage({
        channel: creatorId,
        text: `:recycle: Poll *"${newPoll.question}"* has been reposted to <#${channelId}>.`,
      });
    } catch (err) {
      if (isNotInChannelError(err)) {
        await client.chat.postMessage({
          channel: creatorId,
          text: notInChannelText(channelId),
        });
        return;
      }
      throw err;
    }
  });
}
