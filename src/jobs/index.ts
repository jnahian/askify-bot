import { WebClient } from '@slack/web-api';
import { startAutoCloseJob } from './autoCloseJob';

export function startJobs(client?: WebClient): void {
  if (client) {
    startAutoCloseJob(client);
  }
  console.log('Background jobs initialized');
}
