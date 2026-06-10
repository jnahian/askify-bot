import { WebClient } from '@slack/web-api';
import type { ScheduledTask } from 'node-cron';
import { startAutoCloseJob } from './autoCloseJob';
import { startReminderJob } from "./reminderJob";
import { startScheduledPollJob } from "./scheduledPollJob";

const tasks: ScheduledTask[] = [];

export function startJobs(client?: WebClient): void {
  if (client) {
    tasks.push(startAutoCloseJob(client));
    tasks.push(startScheduledPollJob(client));
    tasks.push(startReminderJob(client));
  }
  console.log("💼 Background jobs initialized");
}

export async function stopJobs(): Promise<void> {
  await Promise.all(tasks.map((task) => task.stop()));
  tasks.length = 0;
  console.log("💼 Background jobs stopped");
}
