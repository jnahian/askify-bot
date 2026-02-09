import { App } from '@slack/bolt';
import { getPoll } from '../services/pollService';
import { getVotersByOption } from '../services/voteService';
import { buildResultsDMBlocks } from '../blocks/resultsDM';

const SHARE_RESULTS_MODAL_ID = 'share_results_modal';

export function registerShareResultsAction(app: App): void {
  // "Share Results" button clicked
  app.action('share_results', async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: {
        type: 'modal',
        callback_id: SHARE_RESULTS_MODAL_ID,
        private_metadata: pollId,
        title: { type: 'plain_text', text: 'Share Results' },
        submit: { type: 'plain_text', text: 'Share' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'input',
            block_id: 'share_channel_block',
            label: { type: 'plain_text', text: 'Share results to' },
            element: {
              type: 'conversations_select',
              action_id: 'share_channel_select',
              default_to_current_conversation: true,
              filter: { include: ['public', 'private'], exclude_bot_users: true },
            },
          },
        ],
      },
    });
  });
}

export function registerShareResultsSubmission(app: App): void {
  app.view(SHARE_RESULTS_MODAL_ID, async ({ ack, view, body, client }) => {
    const pollId = view.private_metadata;
    const channelId = view.state.values.share_channel_block?.share_channel_select?.selected_conversation;

    if (!channelId) {
      await ack({ response_action: 'errors', errors: { share_channel_block: 'Please select a channel.' } });
      return;
    }

    await ack();

    const poll = await getPoll(pollId);
    if (!poll) {
      await client.chat.postMessage({
        channel: body.user.id,
        text: ':x: Could not find the poll.',
      });
      return;
    }

    const settings = poll.settings as {
      anonymous?: boolean;
      allowVoteChange?: boolean;
      liveResults?: boolean;
    };

    let voterNames: Map<string, string[]> | undefined;
    if (!settings.anonymous) {
      voterNames = await getVotersByOption(pollId);
    }

    // Build results but without the "Share Results" button
    const dm = buildResultsDMBlocks(poll, settings, voterNames);
    // Remove the last actions block (the share button) for the channel post
    const shareBlocks = dm.blocks.filter((b) => {
      if (b.type === 'actions') {
        const actions = b as any;
        return !actions.elements?.some((e: any) => e.action_id === 'share_results');
      }
      return true;
    });

    await client.chat.postMessage({
      channel: channelId,
      text: dm.text,
      blocks: shareBlocks,
    });

    await client.chat.postMessage({
      channel: body.user.id,
      text: `:white_check_mark: Results for *"${poll.question}"* have been shared to <#${channelId}>.`,
    });
  });
}
