import 'dotenv/config';
import { App } from '@slack/bolt';
import { registerCommands } from './commands';
import { registerActions } from './actions';
import { registerViews } from './views';
import { startJobs } from './jobs';
import { runStartupRecovery } from './jobs/startupRecovery';

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

registerCommands(app);
registerActions(app);
registerViews(app);

(async () => {
  await app.start();
  console.log('⚡ Askify bot is running!');

  // Run startup recovery for missed scheduled/expired polls
  await runStartupRecovery(app.client);

  startJobs(app.client);
})();
