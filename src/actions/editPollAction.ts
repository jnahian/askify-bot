import { App } from '@slack/bolt';
import { getPoll } from '../services/pollService';
import { buildPollCreationModal, EDIT_MODAL_CALLBACK_ID } from '../views/pollCreationModal';

export function registerEditPollAction(app: App): void {
  app.action(/^edit_scheduled_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const poll = await getPoll(pollId);

    if (!poll) {
      await client.chat.postEphemeral({
        channel: body.channel?.id || body.user.id,
        user: body.user.id,
        text: ':x: Could not find this poll.',
      });
      return;
    }

    // Validate poll is still scheduled
    if (poll.status !== 'scheduled') {
      await client.chat.postEphemeral({
        channel: body.channel?.id || body.user.id,
        user: body.user.id,
        text: ':x: This poll has already been posted and can no longer be edited.',
      });
      return;
    }

    const settings = poll.settings as {
      anonymous?: boolean;
      allowVoteChange?: boolean;
      liveResults?: boolean;
      ratingScale?: number;
      allowAddingOptions?: boolean;
      reminders?: boolean;
      description?: string;
      includeMaybe?: boolean;
    };

    // Determine close method from existing poll data
    let closeMethod: string | undefined;
    if (poll.closesAt) {
      // If closesAt is set, assume datetime method
      // (we can't distinguish between duration and datetime after creation)
      closeMethod = 'datetime';
    } else {
      // No closesAt means manual close
      closeMethod = 'manual';
    }

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: buildPollCreationModal({
        callbackId: EDIT_MODAL_CALLBACK_ID,
        privateMetadata: pollId,
        pollType: poll.pollType,
        closeMethod,
        scheduleMethod: 'scheduled',
        initialChannel: poll.channelId,
        initialOptions: poll.options.length || 2,
        prefill: {
          question: poll.question,
          description: settings.description,
          options: poll.options.map(o => o.label),
          ratingScale: settings.ratingScale,
          anonymous: settings.anonymous,
          allowVoteChange: settings.allowVoteChange,
          liveResults: settings.liveResults,
          allowAddingOptions: settings.allowAddingOptions,
          reminders: settings.reminders,
          includeMaybe: settings.includeMaybe,
          closesAt: poll.closesAt || undefined,
          scheduledAt: poll.scheduledAt || undefined,
        },
      }),
    });
  });
}
