/**
 * Tests for voteService
 * Demonstrates testing pattern for service layer
 */

import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma';
import { handleSingleVote, handleMultiVote } from '../../src/services/voteService';
import { createTestVote } from '../fixtures/testData';

describe('voteService', () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  describe('handleSingleVote', () => {
    const pollId = 'poll-123';
    const optionId = 'opt-1';
    const voterId = 'U123';

    describe('when no existing vote', () => {
      it('should cast a new vote', async () => {
        mockPrismaClient.vote.findFirst.mockResolvedValue(null);
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
        mockPrismaClient.vote.delete.mockResolvedValue(existingVote);

        const result = await handleSingleVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('retracted');
        expect(mockPrismaClient.vote.delete).toHaveBeenCalledWith({
          where: { id: existingVote.id },
        });
      });

      it('should reject when vote change is not allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId, voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);

        const result = await handleSingleVote(pollId, optionId, voterId, false);

        expect(result.action).toBe('rejected');
        expect(result.message).toContain('not allowed');
        expect(mockPrismaClient.vote.delete).not.toHaveBeenCalled();
      });
    });

    describe('when switching to different option', () => {
      it('should switch vote when vote change is allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId: 'opt-1', voterId });
        const newOptionId = 'opt-2';
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);
        mockPrismaClient.vote.update.mockResolvedValue({
          ...existingVote,
          optionId: newOptionId,
        });

        const result = await handleSingleVote(pollId, newOptionId, voterId, true);

        expect(result.action).toBe('switched');
        expect(mockPrismaClient.vote.update).toHaveBeenCalledWith({
          where: { id: existingVote.id },
          data: { optionId: newOptionId, votedAt: expect.any(Date) },
        });
      });

      it('should reject when vote change is not allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId: 'opt-1', voterId });
        const newOptionId = 'opt-2';
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);

        const result = await handleSingleVote(pollId, newOptionId, voterId, false);

        expect(result.action).toBe('rejected');
        expect(result.message).toContain('not allowed');
        expect(mockPrismaClient.vote.update).not.toHaveBeenCalled();
      });
    });
  });

  describe('handleMultiVote', () => {
    const pollId = 'poll-123';
    const optionId = 'opt-1';
    const voterId = 'U123';

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
        mockPrismaClient.vote.delete.mockResolvedValue(existingVote);

        const result = await handleMultiVote(pollId, optionId, voterId, true);

        expect(result.action).toBe('retracted');
        expect(mockPrismaClient.vote.delete).toHaveBeenCalledWith({
          where: { id: existingVote.id },
        });
      });

      it('should reject when vote change is not allowed', async () => {
        const existingVote = createTestVote({ pollId, optionId, voterId });
        mockPrismaClient.vote.findFirst.mockResolvedValue(existingVote);

        const result = await handleMultiVote(pollId, optionId, voterId, false);

        expect(result.action).toBe('rejected');
        expect(result.message).toContain('not allowed');
        expect(mockPrismaClient.vote.delete).not.toHaveBeenCalled();
      });
    });
  });
});
