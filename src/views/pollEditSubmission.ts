import type { App } from '@slack/bolt';
import { EDIT_MODAL_CALLBACK_ID } from './pollCreationModal';
import { getPoll, updatePoll, updatePollMessageTs } from '../services/pollService';
import { buildPollMessage } from '../blocks/pollMessage';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';
import { buildCreatorNotifyDM } from '../blocks/creatorNotifyDM';

interface PollSettings {
  anonymous: boolean;
  allowVoteChange: boolean;
  liveResults: boolean;
  ratingScale?: number;
  allowAddingOptions?: boolean;
  reminders?: boolean;
  description?: string;
  includeMaybe?: boolean;
}

export function registerPollEditSubmission(app: App): void {
  app.view(EDIT_MODAL_CALLBACK_ID, async ({ ack, view, client, body }) => {
    const pollId = view.private_metadata;
    const values = view.state.values;
    const creatorId = body.user.id;

    // Validate poll still exists and is scheduled
    const existingPoll = await getPoll(pollId);
    if (!existingPoll || existingPoll.status !== 'scheduled') {
      await ack({
        response_action: 'errors',
        errors: { question_block: 'This poll has already been posted and can no longer be edited.' },
      });
      return;
    }

    // Extract values (same as creation)
    const question = values.question_block?.question_input?.value?.trim();
    const description = values.description_block?.description_input?.value?.trim() || undefined;
    const pollType = values.poll_type_block?.poll_type_select?.selected_option?.value;
    const channelId = values.channel_block?.channel_select?.selected_conversation;

    const errors: Record<string, string> = {};
    if (!question) errors.question_block = 'Please enter a poll question.';
    if (!pollType) errors.poll_type_block = 'Please select a poll type.';
    if (!channelId) errors.channel_block = 'Please select a channel.';

    // Extract options
    const options: string[] = [];
    if (pollType === 'single_choice' || pollType === 'multi_select') {
      for (let i = 0; i < 10; i++) {
        const val = values[`option_block_${i}`]?.[`option_input_${i}`]?.value?.trim();
        if (val) options.push(val);
      }
      if (options.length < 2) {
        errors.option_block_0 = 'Please provide at least 2 options.';
      }
    }

    // Extract settings
    const settingsChecked = values.settings_block?.settings_checkboxes?.selected_options || [];
    const selectedValues = new Set(settingsChecked.map((o: { value: string }) => o.value));

    const settings: PollSettings = {
      anonymous: selectedValues.has('anonymous'),
      allowVoteChange: selectedValues.has('vote_change'),
      liveResults: selectedValues.has('live_results'),
      allowAddingOptions: selectedValues.has('allow_adding_options'),
      reminders: selectedValues.has('reminders'),
    };

    if (description) settings.description = description;

    if (pollType === 'rating') {
      const scale = values.rating_scale_block?.rating_scale_select?.selected_option?.value;
      settings.ratingScale = scale ? parseInt(scale, 10) : 5;
    }

    // Close method
    const closeMethod = values.close_method_block?.close_method_select?.selected_option?.value || 'manual';
    let closesAt: Date | null = null;

    if (closeMethod === 'duration') {
      const hours = parseFloat(values.duration_block?.duration_input?.value || '');
      if (isNaN(hours) || hours <= 0) {
        errors.duration_block = 'Please enter a valid number of hours.';
      } else {
        closesAt = new Date(Date.now() + hours * 60 * 60 * 1000);
      }
    } else if (closeMethod === 'datetime') {
      const timestamp = values.datetime_block?.datetime_input?.selected_date_time;
      if (!timestamp) {
        errors.datetime_block = 'Please select a close date and time.';
      } else {
        closesAt = new Date(timestamp * 1000);
        if (closesAt <= new Date()) {
          errors.datetime_block = 'Close time must be in the future.';
        }
      }
    }

    // Schedule time
    const scheduleMethod = values.schedule_method_block?.schedule_method_select?.selected_option?.value || 'now';
    let scheduledAt: Date | null = null;

    if (scheduleMethod === 'scheduled') {
      const timestamp = values.schedule_datetime_block?.schedule_datetime_input?.selected_date_time;
      if (!timestamp) {
        errors.schedule_datetime_block = 'Please select a schedule date and time.';
      } else {
        scheduledAt = new Date(timestamp * 1000);
        if (scheduledAt <= new Date()) {
          errors.schedule_datetime_block = 'Schedule time must be in the future.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      await ack({ response_action: 'errors', errors });
      return;
    }

    await ack();

    // Include Maybe preference
    const includeMaybeChecked = values.include_maybe_block?.include_maybe_toggle?.selected_options || [];
    const includeMaybe = includeMaybeChecked.some((o: { value: string }) => o.value === 'include_maybe');
    if (pollType === 'yes_no') {
      settings.includeMaybe = includeMaybe;
    }

    // Generate default options for special types
    let pollOptions = options;
    if (pollType === 'yes_no') {
      pollOptions = includeMaybe ? ['Yes', 'No', 'Maybe'] : ['Yes', 'No'];
    } else if (pollType === 'rating') {
      const max = settings.ratingScale || 5;
      pollOptions = Array.from({ length: max }, (_, i) => `${i + 1}`);
    }

    const isScheduled = scheduleMethod === 'scheduled' && scheduledAt;

    // Adjust closesAt relative to scheduledAt for duration-based close
    if (isScheduled && closeMethod === 'duration') {
      const hours = parseFloat(values.duration_block?.duration_input?.value || '');
      if (!isNaN(hours) && hours > 0) {
        closesAt = new Date(scheduledAt!.getTime() + hours * 60 * 60 * 1000);
      }
    }

    // Calculate status based on schedule method
    const status: 'active' | 'scheduled' = isScheduled ? 'scheduled' : 'active';

    // Update poll
    const updatedPoll = await updatePoll(pollId, {
      question: question!,
      pollType: pollType as 'single_choice' | 'multi_select' | 'yes_no' | 'rating',
      channelId: channelId!,
      options: pollOptions,
      settings: JSON.parse(JSON.stringify(settings)),
      closesAt,
      scheduledAt: isScheduled ? scheduledAt : null,
      status,
    });

    // If poll was changed to "Post Immediately", post it now
    if (status === 'active') {
      const message = buildPollMessage(updatedPoll, settings);
      try {
        const result = await client.chat.postMessage({
          channel: channelId!,
          ...message,
        });

        // Store message_ts for future updates
        if (result.ts) {
          await updatePollMessageTs(updatedPoll.id, result.ts);
        }
      } catch (err) {
        if (isNotInChannelError(err)) {
          await client.chat.postMessage({
            channel: creatorId,
            text: notInChannelText(channelId!),
          });
          return;
        }
        throw err;
      }

      // DM creator with poll management buttons
      const dm = buildCreatorNotifyDM(updatedPoll);
      await client.chat.postMessage({ channel: creatorId, ...dm });
      return;
    }

    // DM creator confirmation
    if (isScheduled && scheduledAt) {
      const scheduleTs = Math.floor(scheduledAt.getTime() / 1000);
      await client.chat.postMessage({
        channel: creatorId,
        text: `:pencil2: Your poll *"${question}"* has been updated.\nScheduled for *<!date^${scheduleTs}^{date_short} at {time}|${scheduledAt.toISOString()}>* in <#${channelId}>.`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:pencil2: Your poll *"${question}"* has been updated.\nScheduled for *<!date^${scheduleTs}^{date_short} at {time}|${scheduledAt.toISOString()}>* in <#${channelId}>.`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: ':pencil2: Edit', emoji: true },
                action_id: `edit_scheduled_${pollId}`,
                value: pollId,
              },
              {
                type: 'button',
                text: { type: 'plain_text', text: ':no_entry_sign: Cancel', emoji: true },
                action_id: `list_cancel_${pollId}`,
                value: pollId,
                style: 'danger' as const,
                confirm: {
                  title: { type: 'plain_text', text: 'Cancel this scheduled poll?' },
                  text: { type: 'plain_text', text: 'This poll will not be posted.' },
                  confirm: { type: 'plain_text', text: 'Cancel Poll' },
                  deny: { type: 'plain_text', text: 'Keep' },
                },
              },
            ],
          },
        ],
      });
    } else {
      await client.chat.postMessage({
        channel: creatorId,
        text: `:pencil2: Your poll *"${question}"* has been updated.`,
      });
    }
  });
}
