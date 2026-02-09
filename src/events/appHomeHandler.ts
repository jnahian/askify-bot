import { App } from '@slack/bolt';
import type { KnownBlock } from '@slack/types';

function buildHomeBlocks(): KnownBlock[] {
  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Askify — Slack Poll Bot' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Create interactive polls right in Slack. Gather feedback, make team decisions, and run votes — all without leaving your workspace.',
      },
    },
    { type: 'divider' },
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Getting Started' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'Type `/askify` in any channel to open the poll creation modal, or use the inline command for a quick poll.',
      },
    },
    { type: 'divider' },
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Commands' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/askify`\nOpen the poll creation modal with full settings',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/askify poll "Question?" "Option 1" "Option 2"`\nCreate a quick inline poll in the current channel',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/askify list`\nView your active and scheduled polls',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/askify templates`\nManage your saved poll templates',
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`/askify help`\nShow the full usage guide',
      },
    },
    { type: 'divider' },
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Poll Types' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':one:  *Single Choice* — Voters pick one option\n'
          + ':hash:  *Multi-Select* — Voters can pick multiple options\n'
          + ':white_check_mark:  *Yes / No / Maybe* — Quick consensus check\n'
          + ':star:  *Rating Scale* — Rate on a 1–5 or 1–10 scale',
      },
    },
    { type: 'divider' },
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Inline Poll Flags' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`--multi` — Multi-select poll\n'
          + '`--yesno` — Yes / No / Maybe poll\n'
          + '`--rating` — Rating scale 1–5 (or `--rating 10` for 1–10)\n'
          + '`--anon` — Anonymous voting\n'
          + '`--close 2h` — Auto-close after duration (e.g. `30m`, `4h`)',
      },
    },
    { type: 'divider' },
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Features' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: ':lock:  *Anonymous Voting* — Hide voter identities\n'
          + ':arrows_counterclockwise:  *Vote Change* — Let voters update their selection\n'
          + ':bar_chart:  *Live Results* — Show results as votes come in\n'
          + ':heavy_plus_sign:  *Voter-Added Options* — Let voters suggest new choices\n'
          + ':bell:  *Reminders* — DM non-voters before the poll closes\n'
          + ':clock3:  *Scheduling* — Schedule polls for later\n'
          + ':floppy_disk:  *Templates* — Save and reuse poll configurations\n'
          + ':outbox_tray:  *Share Results* — Post results to any channel',
      },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: ':fire:  *Tip:* Use emoji codes like `:rocket:` `:tada:` in your questions and options!',
        },
      ],
    },
  ];
}

export function registerAppHomeHandler(app: App): void {
  app.event('app_home_opened', async ({ event, client }) => {
    // Only publish on the Home tab
    if (event.tab !== 'home') return;

    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: buildHomeBlocks(),
      },
    });
  });
}
