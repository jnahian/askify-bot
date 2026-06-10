/**
 * Tests for voteService
 * Demonstrates testing pattern for service layer
 */

import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma';
import {
  handleSingleVote,
  handleMultiVote,
  getVotersByOption,
  countUniqueVoters,
  getUniqueVoterCount,
} from '../../src/services/voteService';
import { Prisma } from '../../src/generated/prisma/client';
import { createTestVote } from '../fixtures/testData';

/** Build a real Prisma unique-constraint (P2002) error. */
function uniqueViolationError(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

describe('voteService', () => {
  beforeEach(() => {
    resetPrismaMocks();
    // Vote handlers run in a transaction; the shared mock's $transaction
    // passes mockPrismaClient as the tx, but is reset alongside the rest.
    mockPrismaClient.$transaction.mockImplementation((fn: any) => fn(mockPrismaClient));
    // Handlers re-check poll status inside the transaction; default to active.
    mockPrismaClient.poll.findUnique.mockResolvedValue({ status: 'active' });
  });

  describe('handleSingleVote', () => {
    const pollId = 'poll-123';
    const optionId = 'opt-1';
    const voterId = 'U123';

    it('should reject when poll is not active', async () => {
      mockPrismaClient.poll.findUnique.mockResolvedValue({ status: 'closed' });

      const result = await handleSingleVote(pollId, optionId, voterId, true);

      expect(result.action).toBe('rejected');
      expect(result.message).toContain('no longer accepting votes');
      expect(mockPrismaClient.vote.create).not.toHaveBeenCalled();
      expect(mockPrismaClient.vote.deleteMany).not.toHaveBeenCalled();
    });

    it('should reject when poll does not exist', async () => {
      mockPrismaClient.poll.findUnique.mockResolvedValue(null);

      const result = await handleSingleVote(pollId, optionId, voterId, true);

      expect(result.action).toBe('rejected');
      expect(result.message).toContain('no longer accepting votes');
      expect(mockPrismaClient.vote.findFirst).not.toHaveBeenCalled();
    });

    describe('when no existing vote', () => {
      it('should cast a new vote', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 0 });
        mockPrismaClient.vote.create.mockResolvedValue(
          createTestVote({ pollId, optionId, voterId })
        );

        const result = await handleSingleVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('cast');
        expect(mockPrismaClient.vote.findFirst).toHaveBeenCalledWith({
          where: { pollId, voterId },
        });
        expect(mockPrismaClient.vote.create).toHaveBeenCalledWith({
          data: { pollId, optionId, voterId },
        });
      });

      it('should treat a unique violation as an idempotent cast (concurrent double-click)', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 0 });
        mockPrismaClient.vote.create.mockRejectedValue(uniqueViolationError());

        const result = await handleSingleVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('cast');
      });

      it('should rethrow non-unique-violation errors from create', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 0 });
        mockPrismaClient.vote.create.mockRejectedValue(new Error('connection lost'));

        await expect(handleSingleVote(pollId, optionId, voterId, true)).rejects.toThrow(
          'connection lost'
        );
      });

      it('should rethrow Prisma errors whose code is not P2002', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 0 });
        const fkError = new Prisma.PrismaClientKnownRequestError('FK constraint failed', {
          code: 'P2003',
          clientVersion: 'test',
        });
        mockPrismaClient.vote.create.mockRejectedValue(fkError);

        await expect(handleSingleVote(pollId, optionId, voterId, true)).rejects.toThrow(
          'FK constraint failed'
        );
      });
    });

    describe('when voting for same option again', () => {
      it('should retract vote when vote change is allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId, voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 1 });

        const result = await handleSingleVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('retracted');
        expect(mockPrismaClient.vote.deleteMany).toHaveBeenCalledWith({
          where: { pollId, voterId },
        });
        expect(mockPrismaClient.vote.create).not.toHaveBeenCalled();
      });

      it('should reject when vote change is not allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId, voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);

        const result = await handleSingleVote(pollId, optionId, voterId, false);

        expect(result.action).toBe('rejected');
        expect(result.message).toContain('not allowed');
        expect(mockPrismaClient.vote.deleteMany).not.toHaveBeenCalled();
      });
    });

    describe('when switching to different option', () => {
      it('should switch vote when vote change is allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId: 'opt-1', voterId });
        const newOptionId = 'opt-2';
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 1 });
        mockPrismaClient.vote.create.mockResolvedValue(
          createTestVote({ pollId, optionId: newOptionId, voterId })
        );

        const result = await handleSingleVote(pollId, newOptionId, voterId, true);

        expect(result.action).toBe('switched');
        expect(mockPrismaClient.vote.deleteMany).toHaveBeenCalledWith({
          where: { pollId, voterId },
        });
        expect(mockPrismaClient.vote.create).toHaveBeenCalledWith({
          data: { pollId, optionId: newOptionId, voterId },
        });
      });

      it('should reject when vote change is not allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId: 'opt-1', voterId });
        const newOptionId = 'opt-2';
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);

        const result = await handleSingleVote(pollId, newOptionId, voterId, false);

        expect(result.action).toBe('rejected');
        expect(result.message).toContain('not allowed');
        expect(mockPrismaClient.vote.create).not.toHaveBeenCalled();
        expect(mockPrismaClient.vote.deleteMany).not.toHaveBeenCalled();
      });

      it('should treat a unique violation during switch as an idempotent cast', async () => {
        const existingVote = createTestVote({ pollId, optionId: 'opt-1', voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 1 });
        mockPrismaClient.vote.create.mockRejectedValue(uniqueViolationError());

        const result = await handleSingleVote(pollId, 'opt-2', voterId, true);

        expect(result.action).toBe('cast');
      });

      it('should rethrow non-unique-violation errors during switch', async () => {
        const existingVote = createTestVote({ pollId, optionId: 'opt-1', voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 1 });
        mockPrismaClient.vote.create.mockRejectedValue(new Error('db exploded'));

        await expect(handleSingleVote(pollId, 'opt-2', voterId, true)).rejects.toThrow(
          'db exploded'
        );
      });
    });
  });

  describe('handleMultiVote', () => {
    const pollId = 'poll-123';
    const optionId = 'opt-1';
    const voterId = 'U123';

    it('should reject when poll is not active', async () => {
      mockPrismaClient.poll.findUnique.mockResolvedValue({ status: 'closed' });

      const result = await handleMultiVote(pollId, optionId, voterId, true);

      expect(result.action).toBe('rejected');
      expect(result.message).toContain('no longer accepting votes');
      expect(mockPrismaClient.vote.create).not.toHaveBeenCalled();
    });

    it('should reject when poll does not exist', async () => {
      mockPrismaClient.poll.findUnique.mockResolvedValue(null);

      const result = await handleMultiVote(pollId, optionId, voterId, true);

      expect(result.action).toBe('rejected');
      expect(result.message).toContain('no longer accepting votes');
      expect(mockPrismaClient.vote.findFirst).not.toHaveBeenCalled();
    });

    describe('when option not yet voted', () => {
      it('should cast a new vote', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
        mockPrismaClient.vote.create.mockResolvedValue(
          createTestVote({ pollId, optionId, voterId })
        );

        const result = await handleMultiVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('cast');
        expect(mockPrismaClient.vote.findFirst).toHaveBeenCalledWith({
          where: { pollId, optionId, voterId },
        });
        expect(mockPrismaClient.vote.create).toHaveBeenCalledWith({
          data: { pollId, optionId, voterId },
        });
      });

      it('should treat a unique violation as an idempotent cast (concurrent double-click)', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
        mockPrismaClient.vote.create.mockRejectedValue(uniqueViolationError());

        const result = await handleMultiVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('cast');
      });

      it('should rethrow non-unique-violation errors from create', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
        mockPrismaClient.vote.create.mockRejectedValue(new Error('timeout'));

        await expect(handleMultiVote(pollId, optionId, voterId, true)).rejects.toThrow('timeout');
      });
    });

    describe('when option already voted', () => {
      it('should retract vote (toggle off) when vote change is allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId, voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);
        mockPrismaClient.vote.deleteMany.mockResolvedValue({ count: 1 });

        const result = await handleMultiVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('retracted');
        expect(mockPrismaClient.vote.deleteMany).toHaveBeenCalledWith({
          where: { id: existingVote.id },
        });
      });

      it('should reject when vote change is not allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId, voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);

        const result = await handleMultiVote(pollId, optionId, voterId, false);

        expect(result.action).toBe('rejected');
        expect(result.message).toContain('not allowed');
        expect(mockPrismaClient.vote.deleteMany).not.toHaveBeenCalled();
      });
    });
  });

  describe('getVotersByOption', () => {
    it('should return map of voters grouped by option', async () => {
      const votes = [
        createTestVote({ pollId: 'poll-123', optionId: 'opt-1', voterId: 'U111' }),
        createTestVote({ pollId: 'poll-123', optionId: 'opt-1', voterId: 'U222' }),
        createTestVote({ pollId: 'poll-123', optionId: 'opt-2', voterId: 'U333' }),
      ];

      mockPrismaClient.vote.findMany.mockResolvedValue(votes);

      const result = await getVotersByOption('poll-123');

      expect(result.get('opt-1')).toEqual(['U111', 'U222']);
      expect(result.get('opt-2')).toEqual(['U333']);
    });

    it('should return empty map when no votes', async () => {
      mockPrismaClient.vote.findMany.mockResolvedValue([]);

      const result = await getVotersByOption('poll-123');

      expect(result.size).toBe(0);
    });

    it('should handle single vote per option', async () => {
      const votes = [
        createTestVote({ pollId: 'poll-123', optionId: 'opt-1', voterId: 'U111' }),
        createTestVote({ pollId: 'poll-123', optionId: 'opt-2', voterId: 'U222' }),
      ];

      mockPrismaClient.vote.findMany.mockResolvedValue(votes);

      const result = await getVotersByOption('poll-123');

      expect(result.get('opt-1')).toEqual(['U111']);
      expect(result.get('opt-2')).toEqual(['U222']);
      expect(result.size).toBe(2);
    });
  });

  describe('countUniqueVoters', () => {
    it('should count unique voters for a poll', async () => {
      const votes = [
        { voterId: 'U111' },
        { voterId: 'U222' },
        { voterId: 'U333' },
      ];

      mockPrismaClient.vote.findMany.mockResolvedValue(votes);

      const count = await countUniqueVoters('poll-123');

      expect(count).toBe(3);
      expect(mockPrismaClient.vote.findMany).toHaveBeenCalledWith({
        where: { pollId: 'poll-123' },
        distinct: ['voterId'],
        select: { voterId: true },
      });
    });

    it('should return 0 when no votes', async () => {
      mockPrismaClient.vote.findMany.mockResolvedValue([]);

      const count = await countUniqueVoters('poll-123');

      expect(count).toBe(0);
    });

    it('should handle single voter', async () => {
      mockPrismaClient.vote.findMany.mockResolvedValue([{ voterId: 'U111' }]);

      const count = await countUniqueVoters('poll-123');

      expect(count).toBe(1);
    });
  });

  describe('getUniqueVoterCount', () => {
    it('should return _count.votes directly for non-multi-select polls', async () => {
      const poll = { id: 'poll-123', pollType: 'single_choice', _count: { votes: 7 } };

      const count = await getUniqueVoterCount(poll);

      expect(count).toBe(7);
      expect(mockPrismaClient.vote.findMany).not.toHaveBeenCalled();
    });

    it('should query distinct voters for multi-select polls', async () => {
      const poll = { id: 'poll-123', pollType: 'multi_select', _count: { votes: 5 } };
      // 5 vote rows but only 2 unique voters
      mockPrismaClient.vote.findMany.mockResolvedValue([{ voterId: 'U111' }, { voterId: 'U222' }]);

      const count = await getUniqueVoterCount(poll);

      expect(count).toBe(2);
      expect(mockPrismaClient.vote.findMany).toHaveBeenCalledWith({
        where: { pollId: 'poll-123' },
        distinct: ['voterId'],
        select: { voterId: true },
      });
    });
  });
});
