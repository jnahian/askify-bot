import { App } from "@slack/bolt";
import "dotenv/config";
import { registerActions } from "./actions";
import { registerCommands } from "./commands";
import { registerEvents } from "./events";
import { startJobs } from "./jobs";
import { runStartupRecovery } from "./jobs/startupRecovery";
import { startHealthServer } from "./lib/healthServer";
import { registerRequestLogger } from "./middleware/requestLogger";
import { registerViews } from "./views";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
});

// Global middleware — must be registered before handlers
registerRequestLogger(app);

registerCommands(app);
registerActions(app);
registerViews(app);
registerEvents(app);

(async () => {
  await app.start();
  console.log("⚡ Askify bot is running!");

  // Run startup recovery for missed scheduled/expired polls
  await runStartupRecovery(app.client);

  startJobs(app.client);

  // Start health check server
  startHealthServer(app.client);
})();
