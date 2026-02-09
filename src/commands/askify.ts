import { App } from '@slack/bolt';
import type { KnownBlock, Button } from '@slack/types';
import { buildPollCreationModal } from '../views/pollCreationModal';
import { createPoll, updatePollMessageTs, getUserPolls } from '../services/pollService';
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

  if (flags.includes('--multi')) pollType = 'multi_select';
  if (flags.includes('--yesno')) pollType = 'yes_no';
  if (flags.includes('--anon')) anonymous = true;

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

  return { question, options, pollType, anonymous, closeDuration, ratingScale };
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
                + '`/askify list` — View your active & scheduled polls\n'
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
        pollOptions = ['Yes', 'No', 'Maybe'];
      } else if (parsed.pollType === 'rating') {
        pollOptions = Array.from({ length: parsed.ratingScale }, (_, i) => `${i + 1}`);
      }

      const settings = {
        anonymous: parsed.anonymous,
        allowVoteChange: true,
        liveResults: true,
        ...(parsed.pollType === 'rating' ? { ratingScale: parsed.ratingScale } : {}),
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
