/**
 * Tests for jobs index (startJobs / stopJobs)
 * Verifies cron schedules are registered and stopped correctly
 */

import { mockSlackClient } from '../mocks/slack';
import { startJobs, stopJobs } from '../../src/jobs';

// Keep the Prisma client out of module loading — the job modules pull in
// services which import the shared Prisma singleton.
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));

// Mock node-cron so schedules are captured instead of actually registered
jest.mock('node-cron', () => ({
  schedule: jest.fn(() => ({ stop: jest.fn() })),
}));

const nodeCron = require('node-cron');

describe('jobs index', () => {
  beforeEach(async () => {
    // Drain any tasks left over from a previous test (module-level state)
    await stopJobs();
    jest.clearAllMocks();
  });

  describe('startJobs', () => {
    it('should register all three cron jobs when a client is provided', async () => {
      startJobs(mockSlackClient as any);

      expect(nodeCron.schedule).toHaveBeenCalledTimes(3);

      const patterns = nodeCron.schedule.mock.calls.map((call: any[]) => call[0]).sort();
      // auto-close + scheduled poll jobs run every minute, reminders every 15
      expect(patterns).toEqual(['* * * * *', '* * * * *', '*/15 * * * *']);

      nodeCron.schedule.mock.calls.forEach((call: any[]) => {
        expect(call[1]).toEqual(expect.any(Function));
      });
    });

    it('should not register any cron jobs without a client', () => {
      startJobs();

      expect(nodeCron.schedule).not.toHaveBeenCalled();
    });
  });

  describe('stopJobs', () => {
    it('should stop every registered task', async () => {
      startJobs(mockSlackClient as any);

      const tasks = nodeCron.schedule.mock.results.map((r: any) => r.value);
      expect(tasks).toHaveLength(3);

      await stopJobs();

      tasks.forEach((task: any) => {
        expect(task.stop).toHaveBeenCalledTimes(1);
      });
    });

    it('should be safe to call when no jobs are running', async () => {
      await expect(stopJobs()).resolves.not.toThrow();
    });

    it('should not stop tasks twice on repeated calls', async () => {
      startJobs(mockSlackClient as any);
      const tasks = nodeCron.schedule.mock.results.map((r: any) => r.value);

      await stopJobs();
      await stopJobs();

      tasks.forEach((task: any) => {
        expect(task.stop).toHaveBeenCalledTimes(1);
      });
    });
  });
});
