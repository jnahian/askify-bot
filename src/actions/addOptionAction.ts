import { App } from '@slack/bolt';
import prisma from '../lib/prisma';
import { getPoll } from '../services/pollService';
import { getVotersByOption } from '../services/voteService';
import { buildPollMessage } from '../blocks/pollMessage';

const ADD_OPTION_MODAL_ID = 'add_option_modal';

export function registerAddOptionAction(app: App): void {
  // "Add Option" button clicked on poll message
  app.action('add_option', async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: {
        type: 'modal',
        callback_id: ADD_OPTION_MODAL_ID,
        private_metadata: pollId,
        title: { type: 'plain_text', text: 'Add an Option' },
        submit: { type: 'plain_text', text: 'Add' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'input',
            block_id: 'new_option_block',
            label: { type: 'plain_text', text: 'New Option' },
            element: {
              type: 'plain_text_input',
              action_id: 'new_option_input',
              placeholder: { type: 'plain_text', text: 'Enter your option' },
              max_length: 200,
            },
          },
        ],
      },
    });
  });
}

export function registerAddOptionSubmission(app: App): void {
  app.view(ADD_OPTION_MODAL_ID, async ({ ack, view, body, client }) => {
    const pollId = view.private_metadata;
    const newOptionText = view.state.values.new_option_block?.new_option_input?.value?.trim();

    if (!newOptionText) {
      await ack({ response_action: 'errors', errors: { new_option_block: 'Please enter an option.' } });
      return;
    }

    const poll = await getPoll(pollId);
    if (!poll) {
      await ack({ response_action: 'errors', errors: { new_option_block: 'Poll not found.' } });
      return;
    }

    if (poll.status === 'closed') {
      await ack({ response_action: 'errors', errors: { new_option_block: 'This poll is closed.' } });
      return;
    }

    // Check for duplicate
    const isDuplicate = poll.options.some(
      (o) => o.label.toLowerCase() === newOptionText.toLowerCase(),
    );
    if (isDuplicate) {
      await ack({ response_action: 'errors', errors: { new_option_block: 'This option already exists.' } });
      return;
    }

    await ack();

    // Add new option
    const nextPosition = poll.options.length;
    await prisma.pollOption.create({
      data: {
        pollId,
        label: newOptionText,
        position: nextPosition,
        addedBy: body.user.id,
      },
    });

    // Refresh poll and update message
    const updatedPoll = await getPoll(pollId);
    if (!updatedPoll || !updatedPoll.messageTs) return;

    const settings = updatedPoll.settings as {
      anonymous?: boolean;
      allowVoteChange?: boolean;
      liveResults?: boolean;
      allowAddingOptions?: boolean;
    };

    let voterNames: Map<string, string[]> | undefined;
    if (!settings.anonymous) {
      voterNames = await getVotersByOption(pollId);
    }

    const message = buildPollMessage(updatedPoll, settings, voterNames);
    await client.chat.update({
      channel: updatedPoll.channelId,
      ts: updatedPoll.messageTs,
      ...message,
    });
  });
}
