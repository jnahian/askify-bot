import { App } from '@slack/bolt';
import type { KnownBlock, Button } from '@slack/types';
import { buildPollCreationModal } from '../views/pollCreationModal';
import { getUserPolls } from '../services/pollService';
import { getTemplates } from '../services/templateService';

export function registerAskifyCommand(app: App): void {
  app.command('/askify', async ({ command, ack, client }) => {
    const subcommand = command.text.trim().toLowerCase();

    if (subcommand === 'help') {
      await ack({
        response_type: 'ephemeral',
        text: '*Askify — Slack Poll Bot*\n\n'
          + '`/askify` — Create a new poll\n'
          + '`/askify list` — View your active & scheduled polls\n'
          + '`/askify templates` — Manage your saved templates\n'
          + '`/askify help` — Show this help message',
      });
      return;
    }

    if (subcommand === 'list') {
      await ack();
      const polls = await getUserPolls(command.user_id);

      if (polls.length === 0) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: "You don't have any active or scheduled polls.",
        });
        return;
      }

      const blocks: KnownBlock[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: 'Your Polls' },
        },
      ];

      for (const poll of polls) {
        const statusEmoji = poll.status === 'active' ? ':large_green_circle:' : ':clock3:';
        const statusLabel = poll.status === 'active' ? 'Active' : 'Scheduled';
        const voteCount = poll._count.votes;
        const closesInfo = poll.closesAt
          ? `\nCloses: <!date^${Math.floor(poll.closesAt.getTime() / 1000)}^{date_short} at {time}|${poll.closesAt.toISOString()}>`
          : '';
        const scheduledInfo = poll.status === 'scheduled' && poll.scheduledAt
          ? `\nScheduled for: <!date^${Math.floor(poll.scheduledAt.getTime() / 1000)}^{date_short} at {time}|${poll.scheduledAt.toISOString()}>`
          : '';

        blocks.push({ type: 'divider' });
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${statusEmoji} *${poll.question}*\n${statusLabel} in <#${poll.channelId}> · ${voteCount} vote${voteCount !== 1 ? 's' : ''}${closesInfo}${scheduledInfo}`,
          },
        });

        const actionElements: Button[] = [];

        if (poll.status === 'active' && poll.messageTs) {
          actionElements.push({
            type: 'button',
            text: { type: 'plain_text', text: 'Close' },
            action_id: `list_close_${poll.id}`,
            value: poll.id,
            style: 'danger',
            confirm: {
              title: { type: 'plain_text', text: 'Close this poll?' },
              text: { type: 'plain_text', text: 'This will end voting and display final results.' },
              confirm: { type: 'plain_text', text: 'Close' },
              deny: { type: 'plain_text', text: 'Cancel' },
            },
          } as Button);
        }

        if (poll.status === 'scheduled') {
          actionElements.push({
            type: 'button',
            text: { type: 'plain_text', text: 'Cancel' },
            action_id: `list_cancel_${poll.id}`,
            value: poll.id,
            style: 'danger',
            confirm: {
              title: { type: 'plain_text', text: 'Cancel this scheduled poll?' },
              text: { type: 'plain_text', text: 'This poll will not be posted.' },
              confirm: { type: 'plain_text', text: 'Cancel Poll' },
              deny: { type: 'plain_text', text: 'Keep' },
            },
          } as Button);
        }

        if (actionElements.length > 0) {
          blocks.push({
            type: 'actions',
            elements: actionElements,
          });
        }
      }

      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `You have ${polls.length} active/scheduled poll(s).`,
        blocks,
      });
      return;
    }

    if (subcommand === 'templates') {
      await ack();
      const templates = await getTemplates(command.user_id);

      if (templates.length === 0) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: "You don't have any saved templates. Create a poll and save it as a template!",
        });
        return;
      }

      const blocks: KnownBlock[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: 'Your Templates' },
        },
      ];

      for (const template of templates) {
        const config = template.config;
        const pollTypeLabel: Record<string, string> = {
          single_choice: 'Single Choice',
          multi_select: 'Multi-Select',
          yes_no: 'Yes / No / Maybe',
          rating: 'Rating Scale',
        };

        blocks.push({ type: 'divider' });
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${template.name}*\nType: ${pollTypeLabel[config.pollType] || config.pollType}` +
              (config.options.length > 0 ? `\nOptions: ${config.options.join(', ')}` : ''),
          },
        });

        blocks.push({
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: ':pencil2: Use Template', emoji: true },
              action_id: `use_template_${template.id}`,
              value: template.id,
              style: 'primary',
            } as Button,
            {
              type: 'button',
              text: { type: 'plain_text', text: ':wastebasket: Delete', emoji: true },
              action_id: `delete_template_${template.id}`,
              value: template.id,
              confirm: {
                title: { type: 'plain_text', text: 'Delete template?' },
                text: { type: 'plain_text', text: `Delete "${template.name}"? This cannot be undone.` },
                confirm: { type: 'plain_text', text: 'Delete' },
                deny: { type: 'plain_text', text: 'Keep' },
              },
            } as Button,
          ],
        });
      }

      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: `You have ${templates.length} template(s).`,
        blocks,
      });
      return;
    }

    // Default: open poll creation modal
    await ack();
    await client.views.open({
      trigger_id: command.trigger_id,
      view: buildPollCreationModal(),
    });
  });
}
