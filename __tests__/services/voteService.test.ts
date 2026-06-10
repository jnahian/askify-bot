/**
 * Tests for voteService
 * Demonstrates testing pattern for service layer
 */

import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma';
import { handleSingleVote, handleMultiVote, getVotersByOption, countUniqueVoters } from '../../src/services/voteService';
import { createTestVote } from '../fixtures/testData';

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
});
