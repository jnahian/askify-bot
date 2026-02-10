import type { App, ViewSubmitAction, AllMiddlewareArgs, SlackViewMiddlewareArgs } from '@slack/bolt';
import { MODAL_CALLBACK_ID } from './pollCreationModal';
import { createPoll } from '../services/pollService';
import { buildPollMessage } from '../blocks/pollMessage';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';

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

    // Extract settings
    const anonymousChecked = values.anonymous_block?.anonymous_toggle?.selected_options || [];
    const voteChangeChecked = values.vote_change_block?.vote_change_toggle?.selected_options || [];
    const liveResultsChecked = values.live_results_block?.live_results_toggle?.selected_options || [];

    const addOptionsChecked = values.add_options_block?.add_options_toggle?.selected_options || [];
    const remindersChecked = values.reminders_block?.reminders_toggle?.selected_options || [];

    const settings: PollSettings = {
      anonymous: anonymousChecked.some((o: { value: string }) => o.value === 'anonymous'),
      allowVoteChange: voteChangeChecked.some((o: { value: string }) => o.value === 'vote_change'),
      liveResults: liveResultsChecked.some((o: { value: string }) => o.value === 'live_results'),
      allowAddingOptions: addOptionsChecked.some((o: { value: string }) => o.value === 'allow_adding_options'),
      reminders: remindersChecked.some((o: { value: string }) => o.value === 'reminders'),
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

    // DM creator with "Save as Template" option
    await client.chat.postMessage({
      channel: creatorId,
      text: `Your poll *"${question}"* has been ${isScheduled ? 'scheduled' : 'created'}! Want to save this configuration as a template for future use?`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:white_check_mark: Your poll *"${question}"* has been ${isScheduled ? 'scheduled' : 'created'}!\nWant to save this configuration as a template?`,
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
            ...(!isScheduled ? [{
              type: 'button' as const,
              text: { type: 'plain_text' as const, text: ':no_entry_sign: Close Poll', emoji: true },
              action_id: 'close_poll',
              value: poll.id,
              style: 'danger' as const,
              confirm: {
                title: { type: 'plain_text' as const, text: 'Close this poll?' },
                text: { type: 'plain_text' as const, text: 'This will end voting and display final results.' },
                confirm: { type: 'plain_text' as const, text: 'Close' },
                deny: { type: 'plain_text' as const, text: 'Cancel' },
              },
            }] : []),
          ],
        },
      ],
    });
  });
}
