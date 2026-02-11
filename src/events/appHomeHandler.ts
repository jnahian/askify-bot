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
        text: 'Create interactive polls right in Slack. Gather feedback, make team decisions, and run votes — all without leaving your workspace.\n\nType `/askify` in any channel to get started.',
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
        text: '`/askify` — Open the poll creation modal\n\n'
          + '`/askify poll "Question?" "Opt 1" "Opt 2"` — Quick inline poll\n\n'
          + '`/askify list` — View your active & scheduled polls\n\n'
          + '`/askify templates` — Manage saved templates\n\n'
          + '`/askify help` — Show full usage guide',
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
        text: ':one:  *Single Choice* — Pick one option\n\n'
          + ':hash:  *Multi-Select* — Pick multiple options\n\n'
          + ':white_check_mark:  *Yes / No / Maybe* — Quick consensus check\n\n'
          + ':star:  *Rating Scale* — Rate on a 1–5 or 1–10 scale',
      },
    },
    { type: 'divider' },
    {
      type: 'header',
      text: { type: 'plain_text', text: 'Inline Flags' },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '`--multi` — Multi-select  ·  `--yesno` — Yes/No/Maybe  ·  `--anon` — Anonymous\n\n'
          + '`--rating` — Scale 1–5 (or `--rating 10`)  ·  `--close 2h` — Auto-close',
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
        text: ':lock: Anonymous Voting  ·  :arrows_counterclockwise: Vote Change  ·  :bar_chart: Live Results\n\n'
          + ':heavy_plus_sign: Voter-Added Options  ·  :bell: Reminders  ·  :clock3: Scheduling\n\n'
          + ':floppy_disk: Templates  ·  :outbox_tray: Share Results',
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
