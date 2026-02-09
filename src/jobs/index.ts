import { WebClient } from '@slack/web-api';
import { startAutoCloseJob } from './autoCloseJob';
import { startScheduledPollJob } from './scheduledPollJob';

export function startJobs(client?: WebClient): void {
  if (client) {
    startAutoCloseJob(client);
    startScheduledPollJob(client);
  }
  console.log('Background jobs initialized');
}
