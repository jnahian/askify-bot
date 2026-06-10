/**
 * Tests for reminder job
 * Covers reminder sending to non-voters before poll closes
 */

import { startReminderJob } from '../../src/jobs/reminderJob';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import prisma from '../../src/lib/prisma';

// Mock dependencies
jest.mock('../../src/services/pollService');
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    vote: {
      findMany: jest.fn(),
    },
  },
}));

// The reminder job calls client.auth.test() once per run to learn the bot's
// own user id; the shared Slack mock has no `auth` namespace, so extend it here.
const mockAuthTest = jest.fn();
(mockSlackClient as any).auth = { test: mockAuthTest };

// Mock node-cron to capture and execute callbacks
let cronCallbacks: Function[] = [];
jest.mock('node-cron', () => ({
  schedule: jest.fn((pattern: string, callback: Function) => {
    cronCallbacks.push(callback);
  }),
}));

describe('reminderJob', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cronCallbacks = [];
    mockAuthTest.mockResolvedValue({ ok: true, user_id: 'UBOT' });
  });

  it('should schedule cron job with 15 minute interval', () => {
    startReminderJob(mockSlackClient as any);

    const nodeCron = require('node-cron');
    expect(nodeCron.schedule).toHaveBeenCalledWith('*/15 * * * *', expect.any(Function));
  });

  it('should send reminders to non-voters', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      question: 'Vote now?',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000), // 1 hour from now
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111', 'U222', 'U333'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([
      { voterId: 'U111' }, // U111 has voted
    ]);

    startReminderJob(mockSlackClient as any);

    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(2);
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U222',
      text: expect.stringContaining('Vote now?'),
    });
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U333',
      text: expect.stringContaining('Vote now?'),
    });
  });

  it('should include poll question in reminder message', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      question: 'What is your favorite color?',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U111',
      text: expect.stringContaining('What is your favorite color?'),
    });
  });

  it('should include channel reference in reminder', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C456',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U111',
      text: expect.stringContaining('<#C456>'),
    });
  });

  it('should include deep link to poll message', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    const call = mockSlackClient.chat.postMessage.mock.calls[0][0];
    expect(call.text).toContain('https://slack.com/archives/C123/p1234567890123456');
    expect(call.text).toContain('Vote now');
  });

  it('should show "less than an hour" when close time is within 1 hour', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3000000), // ~50 minutes
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U111',
      text: expect.stringContaining('less than an hour'),
    });
  });

  it('should show hours remaining when more than 1 hour', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 86400000), // 24 hours
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U111',
      text: expect.stringContaining('~24 hours'),
    });
  });

  it('should claim the reminder before sending', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-123');
  });

  it('should skip polls without reminders enabled', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: false },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.conversations.members).not.toHaveBeenCalled();
    expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    expect(pollService.claimReminderSend).not.toHaveBeenCalled();
  });

  it('should skip polls without closesAt', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: null,
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.conversations.members).not.toHaveBeenCalled();
  });

  it('should skip polls without messageTs', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: null,
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.conversations.members).not.toHaveBeenCalled();
  });

  it('should handle channel access errors gracefully', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockRejectedValue(new Error('not_in_channel'));

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    // The claim happens before the members fetch, so it is still recorded
    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-123');
  });

  it('should handle DM send failures gracefully', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111', 'U222'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    mockSlackClient.chat.postMessage
      .mockRejectedValueOnce(new Error('cannot_dm_user'))
      .mockResolvedValueOnce({ ok: true });

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    // Should still have claimed the reminder even if some DMs fail
    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-123');
  });

  it('should claim the reminder even when all users have voted', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111', 'U222'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([
      { voterId: 'U111' },
      { voterId: 'U222' },
    ]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-123');
  });

  it('should handle multiple polls needing reminders', async () => {
    const polls = [
      createTestPoll({
        id: 'poll-1',
        question: 'Poll 1?',
        channelId: 'C123',
        messageTs: '111.111',
        closesAt: new Date(Date.now() + 3600000),
        settings: { reminders: true },
      }),
      createTestPoll({
        id: 'poll-2',
        question: 'Poll 2?',
        channelId: 'C456',
        messageTs: '222.222',
        closesAt: new Date(Date.now() + 86400000),
        settings: { reminders: true },
      }),
    ];

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue(polls);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-1');
    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-2');
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(2);
  });

  it('should exclude voters from reminders using distinct voterId', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111', 'U222', 'U333'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([
      { voterId: 'U111' },
      { voterId: 'U111' }, // Duplicate vote from same user
      { voterId: 'U222' },
    ]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(1);
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U333',
      text: expect.any(String),
    });
  });

  it('should handle empty member list', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: [],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-123');
  });

  it('should continue with remaining polls when one poll fails', async () => {
    const polls = [
      createTestPoll({
        id: 'poll-1',
        channelId: 'C111',
        messageTs: '111.111',
        closesAt: new Date(Date.now() + 3600000),
        settings: { reminders: true },
      }),
      createTestPoll({
        id: 'poll-2',
        channelId: 'C222',
        messageTs: '222.222',
        closesAt: new Date(Date.now() + 3600000),
        settings: { reminders: true },
      }),
    ];

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue(polls);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['U111'],
    });

    // First poll's vote lookup blows up — caught per-poll, batch continues
    (prisma.vote.findMany as jest.Mock)
      .mockRejectedValueOnce(new Error('db error'))
      .mockResolvedValueOnce([]);

    startReminderJob(mockSlackClient as any);

    await expect(cronCallbacks[0]()).resolves.not.toThrow();

    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-1');
    expect(pollService.claimReminderSend).toHaveBeenCalledWith('poll-2');
    // Only the second poll's reminder was sent
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(1);
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
      channel: 'U111',
      text: expect.any(String),
    });
  });

  it('should not throw when fetching polls needing reminders fails', async () => {
    jest.spyOn(pollService, 'getPollsNeedingReminders').mockRejectedValue(new Error('db down'));

    startReminderJob(mockSlackClient as any);

    await expect(cronCallbacks[0]()).resolves.not.toThrow();
    expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
  });

  it('should continue without bot filter when auth.test fails', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockAuthTest.mockRejectedValue(new Error('auth failed'));

    // Bot's own user id is in the member list but can't be filtered out
    mockSlackClient.conversations.members.mockResolvedValue({
      members: ['UBOT', 'U111'],
    });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    // Both members get DMs since the bot id is unknown
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(2);
  });

  it('should paginate through channel members', async () => {
    const poll = createTestPoll({
      id: 'poll-123',
      channelId: 'C123',
      messageTs: '1234567890.123456',
      closesAt: new Date(Date.now() + 3600000),
      settings: { reminders: true },
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockResolvedValue([poll]);
    jest.spyOn(pollService, 'claimReminderSend').mockResolvedValue(true);

    mockSlackClient.conversations.members
      .mockResolvedValueOnce({
        members: ['U111'],
        response_metadata: { next_cursor: 'cursor-2' },
      })
      .mockResolvedValueOnce({
        members: ['U222'],
        response_metadata: { next_cursor: '' },
      });

    (prisma.vote.findMany as jest.Mock).mockResolvedValue([]);

    startReminderJob(mockSlackClient as any);
    await cronCallbacks[0]();

    expect(mockSlackClient.conversations.members).toHaveBeenCalledTimes(2);
    expect(mockSlackClient.conversations.members).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'cursor-2' })
    );
    expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(2);
  });

  it('should skip a tick while the previous tick is still running', async () => {
    let resolvePolls!: (polls: any[]) => void;
    const pending = new Promise<any[]>((resolve) => {
      resolvePolls = resolve;
    });

    jest.spyOn(pollService, 'getPollsNeedingReminders').mockReturnValue(pending as any);

    startReminderJob(mockSlackClient as any);

    const firstTick = cronCallbacks[0]();
    const secondTick = cronCallbacks[0](); // re-entrant tick — should bail out

    resolvePolls([]);
    await firstTick;
    await secondTick;

    expect(pollService.getPollsNeedingReminders).toHaveBeenCalledTimes(1);
  });
});
