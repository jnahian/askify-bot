/**
 * Tests for pollService
 * Comprehensive coverage of all poll CRUD and query operations
 */

import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma';
import {
  createPoll,
  getPoll,
  closePoll,
  updatePollMessageTs,
  getExpiredPolls,
  getScheduledPolls,
  activatePoll,
  getUserPolls,
  updatePoll,
  repostPoll,
  cancelScheduledPoll,
  getPollsNeedingReminders,
  markReminderSent,
} from '../../src/services/pollService';
import { createTestPoll, createTestOption } from '../fixtures/testData';

describe('pollService', () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe('createPoll', () => {
    it('should create a poll with options', async () => {
      const mockPoll = createTestPoll({
        question: 'Test Poll?',
        pollType: 'single_choice',
        status: 'active',
      });

      mockPrismaClient.poll.create.mockResolvedValue(mockPoll as any);

      const result = await createPoll({
        creatorId: 'U123',
        channelId: 'C123',
        question: 'Test Poll?',
        pollType: 'single_choice',
        options: ['Option A', 'Option B', 'Option C'],
        settings: { allowVoteChange: true, liveResults: true },
        closesAt: null,
      });

      expect(mockPrismaClient.poll.create).toHaveBeenCalledWith({
        data: {
          creatorId: 'U123',
          channelId: 'C123',
          question: 'Test Poll?',
          pollType: 'single_choice',
          settings: { allowVoteChange: true, liveResults: true },
          status: 'active',
          closesAt: null,
          scheduledAt: null,
          options: {
            create: [
              { label: 'Option A', position: 0 },
              { label: 'Option B', position: 1 },
              { label: 'Option C', position: 2 },
            ],
          },
        },
        include: {
          options: {
            orderBy: { position: 'asc' },
            include: { _count: { select: { votes: true } } },
          },
          _count: { select: { votes: true } },
        },
      });
      expect(result).toEqual(mockPoll);
    });

    it('should create a scheduled poll when scheduledAt is provided', async () => {
      const scheduledAt = new Date('2026-03-01T12:00:00Z');
      const mockPoll = createTestPoll({
        status: 'scheduled',
        scheduledAt,
      });

      mockPrismaClient.poll.create.mockResolvedValue(mockPoll as any);

      const result = await createPoll({
        creatorId: 'U123',
        channelId: 'C123',
        question: 'Scheduled Poll?',
        pollType: 'yes_no',
        options: ['Yes', 'No', 'Maybe'],
        settings: {},
        closesAt: null,
        scheduledAt,
        status: 'scheduled',
      });

      expect(mockPrismaClient.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'scheduled',
            scheduledAt,
          }),
        })
      );
      expect(result.status).toBe('scheduled');
    });

    it('should default to active status when not specified', async () => {
      const mockPoll = createTestPoll({ status: 'active' });
      mockPrismaClient.poll.create.mockResolvedValue(mockPoll as any);

      await createPoll({
        creatorId: 'U123',
        channelId: 'C123',
        question: 'Test?',
        pollType: 'rating',
        options: ['1', '2', '3', '4', '5'],
        settings: { ratingScale: 5 },
        closesAt: null,
      });

      expect(mockPrismaClient.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'active',
          }),
        })
      );
    });
  });

  describe('getPoll', () => {
    it('should fetch a poll with options and vote counts', async () => {
      const mockPoll = createTestPoll({
        id: 'poll-123',
      });

      mockPrismaClient.poll.findUnique.mockResolvedValue(mockPoll as any);

      const result = await getPoll('poll-123');

      expect(mockPrismaClient.poll.findUnique).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        include: {
          options: {
            orderBy: { position: 'asc' },
            include: { _count: { select: { votes: true } } },
          },
          _count: { select: { votes: true } },
        },
      });
      expect(result).toEqual(mockPoll);
    });

    it('should return null when poll not found', async () => {
      mockPrismaClient.poll.findUnique.mockResolvedValue(null);

      const result = await getPoll('nonexistent-id');

      expect(result).toBeNull();
      expect(mockPrismaClient.poll.findUnique).toHaveBeenCalledWith({
        where: { id: 'nonexistent-id' },
        include: expect.any(Object),
      });
    });
  });

  describe('closePoll', () => {
    it('should update poll status to closed', async () => {
      const mockPoll = createTestPoll({ status: 'closed' });
      mockPrismaClient.poll.update.mockResolvedValue(mockPoll as any);

      const result = await closePoll('poll-123');

      expect(mockPrismaClient.poll.update).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        data: { status: 'closed' },
      });
      expect(result).toEqual(mockPoll);
    });
  });

  describe('updatePollMessageTs', () => {
    it('should update poll with message timestamp', async () => {
      const mockPoll = createTestPoll({ messageTs: '1234567890.123456' });
      mockPrismaClient.poll.update.mockResolvedValue(mockPoll as any);

      const result = await updatePollMessageTs('poll-123', '1234567890.123456');

      expect(mockPrismaClient.poll.update).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        data: { messageTs: '1234567890.123456' },
      });
      expect(result).toEqual(mockPoll);
    });
  });

  describe('getExpiredPolls', () => {
    it('should fetch active polls with closesAt in the past', async () => {
      const now = new Date();
      const expiredPoll1 = createTestPoll({
        status: 'active',
        closesAt: new Date(now.getTime() - 60000), // 1 minute ago
      });
      const expiredPoll2 = createTestPoll({
        status: 'active',
        closesAt: new Date(now.getTime() - 3600000), // 1 hour ago
      });

      mockPrismaClient.poll.findMany.mockResolvedValue([expiredPoll1, expiredPoll2] as any);

      const result = await getExpiredPolls();

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          closesAt: { lte: expect.any(Date) },
        },
        include: {
          options: {
            orderBy: { position: 'asc' },
            include: { _count: { select: { votes: true } } },
          },
          _count: { select: { votes: true } },
        },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no expired polls', async () => {
      mockPrismaClient.poll.findMany.mockResolvedValue([]);

      const result = await getExpiredPolls();

      expect(result).toEqual([]);
    });
  });

  describe('getScheduledPolls', () => {
    it('should fetch scheduled polls with scheduledAt in the past', async () => {
      const now = new Date();
      const scheduledPoll = createTestPoll({
        status: 'scheduled',
        scheduledAt: new Date(now.getTime() - 30000), // 30 seconds ago
      });

      mockPrismaClient.poll.findMany.mockResolvedValue([scheduledPoll] as any);

      const result = await getScheduledPolls();

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith({
        where: {
          status: 'scheduled',
          scheduledAt: { lte: expect.any(Date) },
        },
        include: {
          options: {
            orderBy: { position: 'asc' },
            include: { _count: { select: { votes: true } } },
          },
          _count: { select: { votes: true } },
        },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when no scheduled polls ready', async () => {
      mockPrismaClient.poll.findMany.mockResolvedValue([]);

      const result = await getScheduledPolls();

      expect(result).toEqual([]);
    });
  });

  describe('activatePoll', () => {
    it('should update poll status to active', async () => {
      const mockPoll = createTestPoll({ status: 'active' });
      mockPrismaClient.poll.update.mockResolvedValue(mockPoll as any);

      const result = await activatePoll('poll-123');

      expect(mockPrismaClient.poll.update).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        data: { status: 'active' },
      });
      expect(result).toEqual(mockPoll);
    });
  });

  describe('getUserPolls', () => {
    it('should fetch user polls with default limit', async () => {
      const mockPolls = [
        createTestPoll({ creatorId: 'U123' }),
        createTestPoll({ creatorId: 'U123' }),
      ];

      mockPrismaClient.poll.findMany.mockResolvedValue(mockPolls as any);

      const result = await getUserPolls('U123');

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith({
        where: {
          creatorId: 'U123',
        },
        include: {
          options: {
            orderBy: { position: 'asc' },
            include: { _count: { select: { votes: true } } },
          },
          _count: { select: { votes: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by date range when provided', async () => {
      const from = new Date('2026-01-01');
      const to = new Date('2026-02-01');
      const mockPolls = [createTestPoll({ creatorId: 'U123' })];

      mockPrismaClient.poll.findMany.mockResolvedValue(mockPolls as any);

      const result = await getUserPolls('U123', { from, to, limit: 5 });

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith({
        where: {
          creatorId: 'U123',
          createdAt: {
            gte: from,
            lte: to,
          },
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
      expect(result).toHaveLength(1);
    });

    it('should filter by from date only', async () => {
      const from = new Date('2026-01-01');
      mockPrismaClient.poll.findMany.mockResolvedValue([]);

      await getUserPolls('U123', { from });

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            creatorId: 'U123',
            createdAt: {
              gte: from,
            },
          },
        })
      );
    });

    it('should filter by to date only', async () => {
      const to = new Date('2026-02-01');
      mockPrismaClient.poll.findMany.mockResolvedValue([]);

      await getUserPolls('U123', { to });

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            creatorId: 'U123',
            createdAt: {
              lte: to,
            },
          },
        })
      );
    });
  });

  describe('updatePoll', () => {
    it('should update poll and replace options in a transaction', async () => {
      const updatedPoll = createTestPoll({
        question: 'Updated Question?',
        pollType: 'multi_select',
      });

      const mockTransaction = {
        pollOption: {
          deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
        },
        poll: {
          update: jest.fn().mockResolvedValue(updatedPoll),
        },
      };

      mockPrismaClient.$transaction.mockImplementation(async (fn: any) => {
        return fn(mockTransaction);
      });

      const result = await updatePoll('poll-123', {
        question: 'Updated Question?',
        pollType: 'multi_select',
        channelId: 'C456',
        options: ['New A', 'New B', 'New C', 'New D'],
        settings: { allowVoteChange: false },
        closesAt: null,
        scheduledAt: null,
        status: 'active',
      });

      expect(mockTransaction.pollOption.deleteMany).toHaveBeenCalledWith({
        where: { pollId: 'poll-123' },
      });

      expect(mockTransaction.poll.update).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        data: {
          question: 'Updated Question?',
          pollType: 'multi_select',
          channelId: 'C456',
          settings: { allowVoteChange: false },
          closesAt: null,
          scheduledAt: null,
          status: 'active',
          options: {
            create: [
              { label: 'New A', position: 0 },
              { label: 'New B', position: 1 },
              { label: 'New C', position: 2 },
              { label: 'New D', position: 3 },
            ],
          },
        },
        include: {
          options: {
            orderBy: { position: 'asc' },
            include: { _count: { select: { votes: true } } },
          },
          _count: { select: { votes: true } },
        },
      });

      expect(result).toEqual(updatedPoll);
    });
  });

  describe('repostPoll', () => {
    it('should create a copy of existing poll', async () => {
      const sourcePoll = createTestPoll({
        id: 'source-poll',
        creatorId: 'U123',
        channelId: 'C123',
        question: 'Original Poll?',
        pollType: 'yes_no',
      });

      const newPoll = createTestPoll({
        id: 'new-poll',
        creatorId: 'U456',
        channelId: 'C123',
        question: 'Original Poll?',
        pollType: 'yes_no',
      });

      mockPrismaClient.poll.findUnique.mockResolvedValue(sourcePoll as any);
      mockPrismaClient.poll.create.mockResolvedValue(newPoll as any);

      const result = await repostPoll('source-poll', 'U456');

      expect(mockPrismaClient.poll.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'source-poll' },
        })
      );

      expect(mockPrismaClient.poll.create).toHaveBeenCalledWith({
        data: {
          creatorId: 'U456',
          channelId: 'C123',
          question: 'Original Poll?',
          pollType: 'yes_no',
          settings: expect.any(Object),
          status: 'active',
          closesAt: null,
          scheduledAt: null,
          options: {
            create: sourcePoll.options.map((opt: any) => ({
              label: opt.label,
              position: opt.position,
            })),
          },
        },
        include: expect.any(Object),
      });

      expect(result).toEqual(newPoll);
    });

    it('should repost to different channel when specified', async () => {
      const sourcePoll = createTestPoll({ channelId: 'C123' });
      const newPoll = createTestPoll({ channelId: 'C456' });

      mockPrismaClient.poll.findUnique.mockResolvedValue(sourcePoll as any);
      mockPrismaClient.poll.create.mockResolvedValue(newPoll as any);

      await repostPoll('source-poll', 'U456', { channelId: 'C456' });

      expect(mockPrismaClient.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            channelId: 'C456',
          }),
        })
      );
    });

    it('should create scheduled poll when scheduledAt provided', async () => {
      const sourcePoll = createTestPoll();
      const scheduledAt = new Date('2026-03-01T12:00:00Z');
      const newPoll = createTestPoll({ status: 'scheduled', scheduledAt });

      mockPrismaClient.poll.findUnique.mockResolvedValue(sourcePoll as any);
      mockPrismaClient.poll.create.mockResolvedValue(newPoll as any);

      await repostPoll('source-poll', 'U456', { scheduledAt });

      expect(mockPrismaClient.poll.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'scheduled',
            scheduledAt,
          }),
        })
      );
    });

    it('should throw error when source poll not found', async () => {
      mockPrismaClient.poll.findUnique.mockResolvedValue(null);

      await expect(repostPoll('nonexistent', 'U456')).rejects.toThrow('Source poll not found');
    });
  });

  describe('cancelScheduledPoll', () => {
    it('should update scheduled poll status to closed', async () => {
      const mockPoll = createTestPoll({ status: 'closed' });
      mockPrismaClient.poll.update.mockResolvedValue(mockPoll as any);

      const result = await cancelScheduledPoll('poll-123');

      expect(mockPrismaClient.poll.update).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        data: { status: 'closed' },
      });
      expect(result).toEqual(mockPoll);
    });
  });

  describe('getPollsNeedingReminders', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return polls closing within 1 hour', async () => {
      const now = new Date('2026-02-16T12:00:00Z');
      jest.setSystemTime(now);

      const pollClosingSoon = createTestPoll({
        status: 'active',
        closesAt: new Date('2026-02-16T12:30:00Z'), // 30 minutes from now
        reminderSentAt: null,
      });

      mockPrismaClient.poll.findMany.mockResolvedValue([pollClosingSoon] as any);

      const result = await getPollsNeedingReminders();

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          closesAt: { not: null },
          reminderSentAt: null,
        },
        include: expect.any(Object),
      });
      expect(result).toHaveLength(1);
    });

    it('should return polls closing in 24 hours', async () => {
      const now = new Date('2026-02-16T12:00:00Z');
      jest.setSystemTime(now);

      const poll24h = createTestPoll({
        status: 'active',
        closesAt: new Date('2026-02-17T12:00:00Z'), // exactly 24 hours from now
        reminderSentAt: null,
      });

      mockPrismaClient.poll.findMany.mockResolvedValue([poll24h] as any);

      const result = await getPollsNeedingReminders();

      expect(result).toHaveLength(1);
    });

    it('should filter out polls with reminder already sent', async () => {
      const now = new Date('2026-02-16T12:00:00Z');
      jest.setSystemTime(now);

      // Database query filters for reminderSentAt: null, so it won't return polls with reminders
      mockPrismaClient.poll.findMany.mockResolvedValue([]);

      const result = await getPollsNeedingReminders();

      expect(mockPrismaClient.poll.findMany).toHaveBeenCalledWith({
        where: {
          status: 'active',
          closesAt: { not: null },
          reminderSentAt: null,
        },
        include: expect.any(Object),
      });
      expect(result).toHaveLength(0);
    });

    it('should filter out polls closing too far in future', async () => {
      const now = new Date('2026-02-16T12:00:00Z');
      jest.setSystemTime(now);

      const pollFarFuture = createTestPoll({
        status: 'active',
        closesAt: new Date('2026-02-20T12:00:00Z'), // 4 days from now
        reminderSentAt: null,
      });

      mockPrismaClient.poll.findMany.mockResolvedValue([pollFarFuture] as any);

      const result = await getPollsNeedingReminders();

      expect(result).toHaveLength(0);
    });

    it('should filter out polls that already closed', async () => {
      const now = new Date('2026-02-16T12:00:00Z');
      jest.setSystemTime(now);

      const pollClosed = createTestPoll({
        status: 'active',
        closesAt: new Date('2026-02-16T11:00:00Z'), // 1 hour ago
        reminderSentAt: null,
      });

      mockPrismaClient.poll.findMany.mockResolvedValue([pollClosed] as any);

      const result = await getPollsNeedingReminders();

      expect(result).toHaveLength(0);
    });
  });

  describe('markReminderSent', () => {
    it('should update reminderSentAt to current timestamp', async () => {
      const mockPoll = createTestPoll({
        reminderSentAt: new Date(),
      });

      mockPrismaClient.poll.update.mockResolvedValue(mockPoll as any);

      const result = await markReminderSent('poll-123');

      expect(mockPrismaClient.poll.update).toHaveBeenCalledWith({
        where: { id: 'poll-123' },
        data: { reminderSentAt: expect.any(Date) },
      });
      expect(result).toEqual(mockPoll);
    });
  });
});
