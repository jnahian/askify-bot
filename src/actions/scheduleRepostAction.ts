import { App } from '@slack/bolt';
import { getPoll, repostPoll } from '../services/pollService';

export const SCHEDULE_REPOST_MODAL_CALLBACK_ID = 'schedule_repost_modal';

export function registerScheduleRepostAction(app: App): void {
  app.action(/^schedule_repost_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const poll = await getPoll(pollId);
    if (!poll) return;

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: {
        type: 'modal',
        callback_id: SCHEDULE_REPOST_MODAL_CALLBACK_ID,
        private_metadata: pollId,
        title: { type: 'plain_text', text: 'Schedule Repost' },
        submit: { type: 'plain_text', text: 'Schedule' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Schedule a repost of *"${poll.question}"* as a fresh poll with zero votes.`,
            },
          },
          {
            type: 'input',
            block_id: 'schedule_repost_datetime_block',
            label: { type: 'plain_text', text: 'Schedule For' },
            element: {
              type: 'datetimepicker',
              action_id: 'schedule_repost_datetime',
            },
          },
          {
            type: 'input',
            block_id: 'schedule_repost_channel_block',
            label: { type: 'plain_text', text: 'Post to Channel' },
            element: {
              type: 'conversations_select',
              action_id: 'schedule_repost_channel',
              default_to_current_conversation: true,
              filter: { include: ['public', 'private'], exclude_bot_users: true },
              ...(poll.channelId ? { initial_conversation: poll.channelId } : {}),
            },
          },
          {
            type: 'input',
            block_id: 'schedule_repost_close_block',
            optional: true,
            label: { type: 'plain_text', text: 'Auto-Close After (hours)' },
            hint: { type: 'plain_text', text: 'Leave empty for manual close' },
            element: {
              type: 'plain_text_input',
              action_id: 'schedule_repost_close_hours',
              placeholder: { type: 'plain_text', text: 'e.g. 24' },
            },
          },
        ],
      },
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
    const closeHoursRaw = values.schedule_repost_close_block?.schedule_repost_close_hours?.value?.trim();

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

    let closeDurationHours: number | null = null;
    if (closeHoursRaw) {
      closeDurationHours = parseFloat(closeHoursRaw);
      if (isNaN(closeDurationHours) || closeDurationHours <= 0) {
        errors.schedule_repost_close_block = 'Please enter a valid number of hours.';
        closeDurationHours = null;
      }
    }

    if (Object.keys(errors).length > 0) {
      await ack({ response_action: 'errors', errors });
      return;
    }

    await ack();

    const scheduledAt = new Date(scheduledTimestamp! * 1000);
    const closesAt = closeDurationHours
      ? new Date(scheduledAt.getTime() + closeDurationHours * 60 * 60 * 1000)
      : null;

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
