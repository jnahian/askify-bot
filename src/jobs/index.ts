import { WebClient } from '@slack/web-api';
import { startAutoCloseJob } from './autoCloseJob';
import { startReminderJob } from "./reminderJob";
import { startScheduledPollJob } from "./scheduledPollJob";

export function startJobs(client?: WebClient): void {
  if (client) {
    startAutoCloseJob(client);
    startScheduledPollJob(client);
    startReminderJob(client);
  }
  console.log("💼 Background jobs initialized");
}
