import { App } from '@slack/bolt';
import { buildPollCreationModal } from '../views/pollCreationModal';

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
      await ack({
        response_type: 'ephemeral',
        text: '🚧 `/askify list` is coming in Phase 2.',
      });
      return;
    }

    if (subcommand === 'templates') {
      await ack({
        response_type: 'ephemeral',
        text: '🚧 `/askify templates` is coming in Phase 2.',
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
