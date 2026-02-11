import type { App, ViewSubmitAction, AllMiddlewareArgs, SlackViewMiddlewareArgs } from '@slack/bolt';
import { MODAL_CALLBACK_ID } from './pollCreationModal';
import { createPoll } from '../services/pollService';
import { buildPollMessage } from '../blocks/pollMessage';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';
import { buildCreatorNotifyDM } from '../blocks/creatorNotifyDM';

type ViewSubmissionArgs = SlackViewMiddlewareArgs<ViewSubmitAction> & AllMiddlewareArgs;

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

export function registerPollCreationSubmission(app: App): void {
  app.view(MODAL_CALLBACK_ID, async ({ ack, view, client, body }) => {
    const values = view.state.values;
    const creatorId = body.user.id;

    // Extract values
    const question = values.question_block?.question_input?.value?.trim();
    const description = values.description_block?.description_input?.value?.trim() || undefined;
    const pollType = values.poll_type_block?.poll_type_select?.selected_option?.value;
    const channelId = values.channel_block?.channel_select?.selected_conversation;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!question) errors.question_block = 'Please enter a poll question.';
    if (!pollType) errors.poll_type_block = 'Please select a poll type.';
    if (!channelId) errors.channel_block = 'Please select a channel.';

    // Extract options for applicable types
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

    // Extract settings from consolidated checkboxes
    const settingsChecked = values.settings_block?.settings_checkboxes?.selected_options || [];
    const selectedValues = new Set(settingsChecked.map((o: { value: string }) => o.value));

    const settings: PollSettings = {
      anonymous: selectedValues.has('anonymous'),
      allowVoteChange: selectedValues.has('vote_change'),
      liveResults: selectedValues.has('live_results'),
      allowAddingOptions: selectedValues.has('allow_adding_options'),
      reminders: selectedValues.has('reminders'),
    };

    // Description
    if (description) {
      settings.description = description;
    }

    // Rating scale
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

    // Schedule method
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

    // If scheduled, adjust closesAt relative to scheduledAt for duration-based close
    if (isScheduled && closeMethod === 'duration') {
      const hours = parseFloat(values.duration_block?.duration_input?.value || '');
      if (!isNaN(hours) && hours > 0) {
        closesAt = new Date(scheduledAt!.getTime() + hours * 60 * 60 * 1000);
      }
    }

    // Create poll in database
    const poll = await createPoll({
      creatorId,
      channelId: channelId!,
      question: question!,
      pollType: pollType as 'single_choice' | 'multi_select' | 'yes_no' | 'rating',
      options: pollOptions,
      settings: JSON.parse(JSON.stringify(settings)),
      closesAt,
      scheduledAt: isScheduled ? scheduledAt : null,
      status: isScheduled ? 'scheduled' : 'active',
    });

    if (isScheduled) {
      // DM creator confirming scheduled time
      const scheduleTs = Math.floor(scheduledAt!.getTime() / 1000);
      await client.chat.postMessage({
        channel: creatorId,
        text: `:clock3: Your poll *"${question}"* has been scheduled for *<!date^${scheduleTs}^{date_short} at {time}|${scheduledAt!.toISOString()}>*.\nIt will be posted to <#${channelId}>.`,
      });
    } else {
      // Post poll message to channel immediately
      const message = buildPollMessage(poll, settings);
      try {
        const result = await client.chat.postMessage({
          channel: channelId!,
          ...message,
        });

        // Store message_ts for future updates
        if (result.ts) {
          const { updatePollMessageTs } = await import('../services/pollService');
          await updatePollMessageTs(poll.id, result.ts);
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
    }

    // DM creator with "Save as Template" and (if live) "Close Poll" buttons
    if (!isScheduled) {
      const dm = buildCreatorNotifyDM(poll);
      await client.chat.postMessage({ channel: creatorId, ...dm });
    } else {
      // Scheduled polls aren't live yet — only offer "Save as Template"
      await client.chat.postMessage({
        channel: creatorId,
        text: `Your poll "${question}" has been scheduled!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `:white_check_mark: Your poll *"${question}"* has been scheduled!\nWant to save this configuration as a template?`,
            },
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
              },
            ],
          },
        ],
      });
    }
  });
}
