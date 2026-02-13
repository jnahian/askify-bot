import { App } from '@slack/bolt';
import type { View, KnownBlock } from '@slack/types';
import { getPoll, repostPoll } from '../services/pollService';

export const SCHEDULE_REPOST_MODAL_CALLBACK_ID = 'schedule_repost_modal';
export const SCHEDULE_REPOST_CLOSE_METHOD_ACTION_ID = 'schedule_repost_close_method_select';

interface ScheduleRepostModalOptions {
  pollId: string;
  pollQuestion: string;
  channelId: string;
  closeMethod?: string;
}

function buildScheduleRepostModal(opts: ScheduleRepostModalOptions): View {
  const { pollId, pollQuestion, channelId, closeMethod } = opts;
  const blocks: KnownBlock[] = [];

  // Description
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `Schedule a repost of *"${pollQuestion}"* as a fresh poll with zero votes.`,
    },
  });

  // Schedule datetime
  blocks.push({
    type: 'input',
    block_id: 'schedule_repost_datetime_block',
    label: { type: 'plain_text', text: 'Schedule For' },
    element: {
      type: 'datetimepicker',
      action_id: 'schedule_repost_datetime',
    },
  });

  // Channel select
  blocks.push({
    type: 'input',
    block_id: 'schedule_repost_channel_block',
    label: { type: 'plain_text', text: 'Post to Channel' },
    element: {
      type: 'conversations_select',
      action_id: 'schedule_repost_channel',
      default_to_current_conversation: true,
      filter: { include: ['public', 'private'], exclude_bot_users: true },
      ...(channelId ? { initial_conversation: channelId } : {}),
    },
  });

  // Close Method selector
  blocks.push({
    type: 'input',
    block_id: 'schedule_repost_close_method_block',
    dispatch_action: true,
    optional: true,
    label: { type: 'plain_text', text: 'Close Method' },
    element: {
      type: 'static_select',
      action_id: SCHEDULE_REPOST_CLOSE_METHOD_ACTION_ID,
      placeholder: { type: 'plain_text', text: 'Manual (default)' },
      options: [
        { text: { type: 'plain_text', text: 'Manual' }, value: 'manual' },
        { text: { type: 'plain_text', text: 'After Duration' }, value: 'duration' },
        { text: { type: 'plain_text', text: 'At Date/Time' }, value: 'datetime' },
      ],
      ...(closeMethod ? { initial_option: getCloseMethodOption(closeMethod) } : {}),
    },
  });

  // Duration input (conditional)
  if (closeMethod === 'duration') {
    blocks.push({
      type: 'input',
      block_id: 'schedule_repost_duration_block',
      label: { type: 'plain_text', text: 'Duration (hours)' },
      element: {
        type: 'plain_text_input',
        action_id: 'schedule_repost_duration_input',
        placeholder: { type: 'plain_text', text: 'e.g. 24' },
      },
    });
  }

  // Datetime picker (conditional)
  if (closeMethod === 'datetime') {
    blocks.push({
      type: 'input',
      block_id: 'schedule_repost_datetime_close_block',
      label: { type: 'plain_text', text: 'Close At' },
      element: {
        type: 'datetimepicker',
        action_id: 'schedule_repost_datetime_close_input',
      },
    });
  }

  return {
    type: 'modal',
    callback_id: SCHEDULE_REPOST_MODAL_CALLBACK_ID,
    private_metadata: pollId,
    title: { type: 'plain_text', text: 'Schedule Repost' },
    submit: { type: 'plain_text', text: 'Schedule' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks,
  };
}

function getCloseMethodOption(value: string) {
  const map: Record<string, string> = {
    manual: 'Manual',
    duration: 'After Duration',
    datetime: 'At Date/Time',
  };
  return { text: { type: 'plain_text' as const, text: map[value] || value }, value };
}

export function registerScheduleRepostAction(app: App): void {
  app.action(/^schedule_repost_.+$/, async ({ ack, action, body, client }) => {
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

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: buildScheduleRepostModal({
        pollId,
        pollQuestion: poll.question,
        channelId: poll.channelId,
      }),
    });
  });

  // Handle close method select to update modal dynamically
  app.action(SCHEDULE_REPOST_CLOSE_METHOD_ACTION_ID, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'static_select' || body.type !== 'block_actions') return;

    const pollId = body.view!.private_metadata;
    const poll = await getPoll(pollId);
    if (!poll) return;

    const closeMethod = action.selected_option?.value;

    await client.views.update({
      view_id: body.view!.id,
      view: buildScheduleRepostModal({
        pollId,
        pollQuestion: poll.question,
        channelId: poll.channelId,
        closeMethod,
      }),
    });
  });
}

export function registerScheduleRepostSubmission(app: App): void {
  app.view(SCHEDULE_REPOST_MODAL_CALLBACK_ID, async ({ ack, view, client, body }) => {
    const sourcePollId = view.private_metadata;
    const values = view.state.values;
    const creatorId = body.user.id;

    const scheduledTimestamp = values.schedule_repost_datetime_block?.schedule_repost_datetime?.selected_date_time;
    const channelId = values.schedule_repost_channel_block?.schedule_repost_channel?.selected_conversation;
    const closeMethod = values.schedule_repost_close_method_block?.schedule_repost_close_method_select?.selected_option?.value || 'manual';

    const errors: Record<string, string> = {};

    if (!scheduledTimestamp) {
      errors.schedule_repost_datetime_block = 'Please select a date and time.';
    } else {
      const scheduledAt = new Date(scheduledTimestamp * 1000);
      if (scheduledAt <= new Date()) {
        errors.schedule_repost_datetime_block = 'Schedule time must be in the future.';
      }
    }

    if (!channelId) {
      errors.schedule_repost_channel_block = 'Please select a channel.';
    }

    // Calculate closesAt based on close method
    let closesAt: Date | null = null;

    if (closeMethod === 'duration') {
      const hours = parseFloat(values.schedule_repost_duration_block?.schedule_repost_duration_input?.value || '');
      if (isNaN(hours) || hours <= 0) {
        errors.schedule_repost_duration_block = 'Please enter a valid number of hours.';
      } else {
        const scheduledAt = new Date(scheduledTimestamp! * 1000);
        closesAt = new Date(scheduledAt.getTime() + hours * 60 * 60 * 1000);
      }
    } else if (closeMethod === 'datetime') {
      const closeTimestamp = values.schedule_repost_datetime_close_block?.schedule_repost_datetime_close_input?.selected_date_time;
      if (!closeTimestamp) {
        errors.schedule_repost_datetime_close_block = 'Please select a close date and time.';
      } else {
        closesAt = new Date(closeTimestamp * 1000);
        const scheduledAt = new Date(scheduledTimestamp! * 1000);
        if (closesAt <= scheduledAt) {
          errors.schedule_repost_datetime_close_block = 'Close time must be after the scheduled time.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      await ack({ response_action: 'errors', errors });
      return;
    }

    await ack();

    const scheduledAt = new Date(scheduledTimestamp! * 1000);

    const newPoll = await repostPoll(sourcePollId, creatorId, {
      channelId: channelId!,
      scheduledAt,
      closesAt,
    });

    const scheduleTs = Math.floor(scheduledAt.getTime() / 1000);
    await client.chat.postMessage({
      channel: creatorId,
      text: `:clock3: Poll *"${newPoll.question}"* has been scheduled for repost.\n*<!date^${scheduleTs}^{date_short} at {time}|${scheduledAt.toISOString()}>* in <#${channelId}>.`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `:clock3: Poll *"${newPoll.question}"* has been scheduled for repost.\n*<!date^${scheduleTs}^{date_short} at {time}|${scheduledAt.toISOString()}>* in <#${channelId}>.`,
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: ':pencil2: Edit', emoji: true },
              action_id: `edit_scheduled_${newPoll.id}`,
              value: newPoll.id,
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: ':no_entry_sign: Cancel', emoji: true },
              action_id: `list_cancel_${newPoll.id}`,
              value: newPoll.id,
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
  });
}
