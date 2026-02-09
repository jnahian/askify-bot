import { WebClient } from '@slack/web-api';
import { startAutoCloseJob } from './autoCloseJob';
import { startScheduledPollJob } from './scheduledPollJob';
import { startReminderJob } from './reminderJob';

export function startJobs(client?: WebClient): void {
  if (client) {
    startAutoCloseJob(client);
    startScheduledPollJob(client);
    startReminderJob(client);
  }
  console.log('Background jobs initialized');
}
