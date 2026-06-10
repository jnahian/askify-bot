import { App } from "@slack/bolt";
import "dotenv/config";
import { registerActions } from "./actions";
import { registerCommands } from "./commands";
import { registerEvents } from "./events";
import { startJobs, stopJobs } from "./jobs";
import { runStartupRecovery } from "./jobs/startupRecovery";
import { startHealthServer } from "./lib/healthServer";
import prisma from "./lib/prisma";
import { registerRequestLogger } from "./middleware/requestLogger";
import { flushAll } from "./utils/debounce";
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
})().catch((error) => {
  console.error("Failed to start Askify bot:", error);
  process.exit(1);
});

// Graceful shutdown — stop cron jobs, flush pending updates, then exit
let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`Received ${signal}, shutting down gracefully...`);

  try {
    await stopJobs();
    await flushAll();
    await app.stop();
    await prisma.$disconnect();
    console.log("Shutdown complete");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
