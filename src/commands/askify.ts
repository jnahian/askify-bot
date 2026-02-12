import { App } from '@slack/bolt';
import type { KnownBlock, Button } from '@slack/types';
import { buildPollCreationModal } from '../views/pollCreationModal';
import { createPoll, updatePollMessageTs, getUserPolls, type GetUserPollsOptions } from '../services/pollService';
import { buildPollMessage } from '../blocks/pollMessage';
import { getTemplates } from '../services/templateService';
import { isNotInChannelError, notInChannelText } from '../utils/channelError';

interface InlinePollArgs {
  question: string;
  options: string[];
  pollType: 'single_choice' | 'multi_select' | 'yes_no' | 'rating';
  anonymous: boolean;
  closeDuration: number | null;
  ratingScale: number;
  includeMaybe: boolean;
}

function parseInlinePoll(text: string): InlinePollArgs | { error: string } {
  const quoted: string[] = [];
  const withoutQuoted = text.replace(/"([^"]+)"/g, (_, match) => {
    quoted.push(match);
    return '';
  });

  if (quoted.length === 0) {
    return { error: 'Please provide a question in quotes.\nUsage: `/askify poll "Your question?" "Option 1" "Option 2"`' };
  }

  const question = quoted[0];
  const options = quoted.slice(1);

  const flags = withoutQuoted.toLowerCase().trim();
  let pollType: InlinePollArgs['pollType'] = 'single_choice';
  let anonymous = false;
  let closeDuration: number | null = null;
  let ratingScale = 5;
  let includeMaybe = true; // Default to including Maybe for yes/no polls

  if (flags.includes('--multi')) pollType = 'multi_select';
  if (flags.includes('--yesno')) pollType = 'yes_no';
  if (flags.includes('--anon')) anonymous = true;
  if (flags.includes('--no-maybe')) includeMaybe = false;

  const ratingMatch = flags.match(/--rating(?:\s+(\d+))?/);
  if (ratingMatch) {
    pollType = 'rating';
    if (ratingMatch[1]) {
      const scale = parseInt(ratingMatch[1], 10);
      ratingScale = scale === 10 ? 10 : 5;
    }
  }

  const closeMatch = flags.match(/--close\s+(\d+)(h|m)/);
  if (closeMatch) {
    const value = parseInt(closeMatch[1], 10);
    closeDuration = closeMatch[2] === 'h' ? value : value / 60;
  }

  if (pollType === 'single_choice' || pollType === 'multi_select') {
    if (options.length < 2) {
      return { error: 'Please provide at least 2 options.\nUsage: `/askify poll "Question?" "Option 1" "Option 2"`' };
    }
    if (options.length > 10) {
      return { error: 'Maximum 10 options allowed.' };
    }
  }

  return { question, options, pollType, anonymous, closeDuration, ratingScale, includeMaybe };
}

function parseListFilter(text: string): { options: GetUserPollsOptions; label: string } | { error: string } {
  const trimmed = text.trim();

  // No args — default latest 10
  if (!trimmed) {
    return { options: {}, label: '' };
  }

  // Relative: "7d", "30d", etc.
  const relativeMatch = trimmed.match(/^(\d+)d$/i);
  if (relativeMatch) {
    const days = parseInt(relativeMatch[1], 10);
    if (days <= 0 || days > 365) {
      return { error: 'Please provide a day range between 1 and 365 (e.g., `7d`, `30d`).' };
    }
    const from = new Date();
    from.setDate(from.getDate() - days);
    return { options: { from }, label: `Last ${days} day${days !== 1 ? 's' : ''}` };
  }

  // Absolute: "YYYY-MM-DD YYYY-MM-DD"
  const dateRangeMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})\s+(\d{4}-\d{2}-\d{2})$/);
  if (dateRangeMatch) {
    const from = new Date(dateRangeMatch[1]);
    const to = new Date(dateRangeMatch[2]);
    to.setUTCHours(23, 59, 59, 999);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      return { error: 'Invalid date format. Use `YYYY-MM-DD YYYY-MM-DD` (e.g., `2025-01-01 2025-01-31`).' };
    }
    if (from > to) {
      return { error: 'Start date must be before end date.' };
    }
    return { options: { from, to }, label: `${dateRangeMatch[1]} to ${dateRangeMatch[2]}` };
  }

  return { error: 'Invalid filter. Usage:\n`/askify list` — Latest 10 polls\n`/askify list 7d` — Last 7 days\n`/askify list 2025-01-01 2025-01-31` — Date range' };
}

export function registerAskifyCommand(app: App): void {
  app.command('/askify', async ({ command, ack, client }) => {
    const rawText = command.text.trim();
    const spaceIdx = rawText.indexOf(' ');
    const subcommand = (spaceIdx === -1 ? rawText : rawText.slice(0, spaceIdx)).toLowerCase();
    const subArgs = spaceIdx === -1 ? '' : rawText.slice(spaceIdx + 1).trim();

    if (subcommand === 'help') {
      await ack();
      await client.chat.postEphemeral({
        channel: command.channel_id,
        user: command.user_id,
        text: 'Askify Help',
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: 'Askify — Slack Poll Bot' },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: 'Create interactive polls right in Slack with multiple poll types, anonymous voting, scheduling, and more.',
            },
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Commands*\n'
                + '`/askify` — Open the poll creation modal\n'
                + '`/askify poll "Q?" "Opt1" "Opt2"` — Quick inline poll\n'
                + '`/askify list` — View your latest 10 polls\n'
                + '`/askify list 7d` — Polls from the last 7 days\n'
                + '`/askify list 2025-01-01 2025-01-31` — Polls in a date range\n'
                + '`/askify templates` — Manage saved poll templates\n'
                + '`/askify help` — Show this help message',
            },
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Poll Types*\n'
                + ':one: *Single Choice* — Voters pick one option\n'
                + ':hash: *Multi-Select* — Voters can pick multiple options\n'
                + ':white_check_mark: *Yes / No / Maybe* — Quick consensus check\n'
                + ':star: *Rating Scale* — Rate on a 1–5 or 1–10 scale',
            },
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Settings*\n'
                + ':lock: *Anonymous* — Hide voter identities\n'
                + ':arrows_counterclockwise: *Vote Change* — Allow voters to update their vote\n'
                + ':bar_chart: *Live Results* — Show results as votes come in\n'
                + ':heavy_plus_sign: *Voter-Added Options* — Let voters add new choices (single/multi only)\n'
                + ':bell: *Reminders* — DM non-voters before the poll closes',
            },
          },
          { type: 'divider' },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*Quick Start*\n'
                + '1. Type `/askify` to open the creation modal\n'
                + '2. Enter your question, pick a poll type, and add options\n'
                + '3. Choose a channel, adjust settings, and create!\n'
                + '4. After closing, share results to any channel\n\n'
                + ':zap: *Quick Poll:* `/askify poll "Lunch?" "Pizza" "Sushi" --close 2h`\n'
                + ':bulb: *Tip:* Use emoji codes like `:fire:` `:rocket:` `:tada:` in questions and options!',
            },
          },
        ],
      });
      return;
    }

    if (subcommand === 'list') {
      await ack();

      // Parse date filter arguments
      const filterResult = parseListFilter(subArgs);
      if ('error' in filterResult) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: filterResult.error,
        });
        return;
      }

      const polls = await getUserPolls(command.user_id, filterResult.options);

      if (polls.length === 0) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: `You don't have any polls${filterResult.label ? ` ${filterResult.label}` : ''}.`,
        });
        return;
      }

      const POLL_TYPE_LABELS: Record<string, string> = {
        single_choice: 'Single Choice',
        multi_select: 'Multi-Select',
        yes_no: 'Yes / No / Maybe',
        rating: 'Rating Scale',
      };

      const STATUS_META: Record<string, { emoji: string; label: string }> = {
        active: { emoji: ':large_green_circle:', label: 'Active' },
        scheduled: { emoji: ':clock3:', label: 'Scheduled' },
        closed: { emoji: ':no_entry_sign:', label: 'Closed' },
      };

      const headerText = filterResult.label
        ? `Your Polls — ${filterResult.label}`
        : 'Your Polls';

      const blocks: KnownBlock[] = [
        {
          type: 'header',
          text: { type: 'plain_text', text: headerText },
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `Showing ${polls.length} poll${polls.length !== 1 ? 's' : ''}` }],
        },
      ];

      for (const poll of polls) {
        const meta = STATUS_META[poll.status] || STATUS_META.active;
        const voteCount = poll._count.votes;
        const optionCount = poll.options.length;
        const createdTs = Math.floor(poll.createdAt.getTime() / 1000);

        // Build enriched body
        let body = `${meta.emoji} *${poll.question}*\n`;
        body += `${meta.label} · ${POLL_TYPE_LABELS[poll.pollType] || poll.pollType} · ${optionCount} options · ${voteCount} vote${voteCount !== 1 ? 's' : ''}\n`;
        body += `<#${poll.channelId}> · Created <!date^${createdTs}^{date_short} at {time}|${poll.createdAt.toISOString()}>`;

        if (poll.closesAt) {
          const closesTs = Math.floor(poll.closesAt.getTime() / 1000);
          body += `\n${poll.status === 'closed' ? 'Closed' : 'Closes'}: <!date^${closesTs}^{date_short} at {time}|${poll.closesAt.toISOString()}>`;
        }

        if (poll.status === 'scheduled' && poll.scheduledAt) {
          const schedTs = Math.floor(poll.scheduledAt.getTime() / 1000);
          body += `\nScheduled for: <!date^${schedTs}^{date_short} at {time}|${poll.scheduledAt.toISOString()}>`;
        }

        // Option preview (first 3 options)
        const preview = poll.options.slice(0, 3).map(o => o.label).join(', ');
        const moreCount = poll.options.length - 3;
        body += `\n_Options: ${preview}${moreCount > 0 ? `, +${moreCount} more` : ''}_`;

        blocks.push({ type: 'divider' });
        blocks.push({
          type: 'section',
          text: { type: 'mrkdwn', text: body },
        });

        // Action buttons
        const actionElements: Button[] = [];

        // Results button for active and closed polls
        if (poll.status === 'active' || poll.status === 'closed') {
          actionElements.push({
            type: 'button',
            text: { type: 'plain_text', text: ':bar_chart: Results', emoji: true },
            action_id: `list_results_${poll.id}`,
            value: poll.id,
          } as Button);
        }

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

        // Repost buttons for closed polls
        if (poll.status === 'closed') {
          actionElements.push({
            type: 'button',
            text: { type: 'plain_text', text: ':recycle: Repost', emoji: true },
            action_id: `repost_poll_${poll.id}`,
            value: poll.id,
          } as Button);
          actionElements.push({
            type: 'button',
            text: { type: 'plain_text', text: ':clock3: Schedule Repost', emoji: true },
            action_id: `schedule_repost_${poll.id}`,
            value: poll.id,
          } as Button);
        }

        if (poll.status === 'scheduled') {
          actionElements.push({
            type: 'button',
            text: { type: 'plain_text', text: ':pencil2: Edit', emoji: true },
            action_id: `edit_scheduled_${poll.id}`,
            value: poll.id,
          } as Button);
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
        text: `You have ${polls.length} poll(s)${filterResult.label ? ` (${filterResult.label})` : ''}.`,
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

    // Inline poll creation
    if (subcommand === 'poll') {
      await ack();

      if (!subArgs) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: '*Inline Poll Usage:*\n'
            + '`/askify poll "Question?" "Option 1" "Option 2" [flags]`\n\n'
            + '*Flags:*\n'
            + '`--multi` — Multi-select poll\n'
            + '`--yesno` — Yes/No/Maybe poll (no options needed)\n'
            + '`--no-maybe` — Exclude "Maybe" from Yes/No polls\n'
            + '`--rating` — Rating scale 1–5 (or `--rating 10` for 1–10)\n'
            + '`--anon` — Anonymous voting\n'
            + '`--close 2h` — Auto-close after duration (e.g. `30m`, `4h`)',
        });
        return;
      }

      const parsed = parseInlinePoll(subArgs);
      if ('error' in parsed) {
        await client.chat.postEphemeral({
          channel: command.channel_id,
          user: command.user_id,
          text: parsed.error,
        });
        return;
      }

      let pollOptions = parsed.options;
      if (parsed.pollType === 'yes_no') {
        pollOptions = parsed.includeMaybe ? ['Yes', 'No', 'Maybe'] : ['Yes', 'No'];
      } else if (parsed.pollType === 'rating') {
        pollOptions = Array.from({ length: parsed.ratingScale }, (_, i) => `${i + 1}`);
      }

      const settings = {
        anonymous: parsed.anonymous,
        allowVoteChange: true,
        liveResults: true,
        ...(parsed.pollType === 'rating' ? { ratingScale: parsed.ratingScale } : {}),
        ...(parsed.pollType === 'yes_no' ? { includeMaybe: parsed.includeMaybe } : {}),
      };

      const closesAt = parsed.closeDuration
        ? new Date(Date.now() + parsed.closeDuration * 60 * 60 * 1000)
        : null;

      try {
        const poll = await createPoll({
          creatorId: command.user_id,
          channelId: command.channel_id,
          question: parsed.question,
          pollType: parsed.pollType,
          options: pollOptions,
          settings: JSON.parse(JSON.stringify(settings)),
          closesAt,
        });

        const message = buildPollMessage(poll, settings);
        const result = await client.chat.postMessage({
          channel: command.channel_id,
          ...message,
        });

        if (result.ts) {
          await updatePollMessageTs(poll.id, result.ts);
        }
      } catch (err) {
        const errorText = isNotInChannelError(err)
          ? notInChannelText(command.channel_id)
          : `:warning: Failed to create poll: ${err instanceof Error ? err.message : 'Unknown error'}`;
        await client.chat.postMessage({
          channel: command.user_id,
          text: errorText,
        });
      }
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
