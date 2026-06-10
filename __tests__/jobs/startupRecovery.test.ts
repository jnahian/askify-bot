/**
 * Tests for startup recovery job
 * Covers recovery of scheduled, stranded, and expired polls on bot startup
 */

import { runStartupRecovery } from '../../src/jobs/startupRecovery';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as voteService from '../../src/services/voteService';
import * as pollMessage from '../../src/blocks/pollMessage';
import * as resultsDM from '../../src/blocks/resultsDM';
import * as creatorNotifyDM from '../../src/blocks/creatorNotifyDM';

// Mock dependencies
jest.mock('../../src/services/pollService');
jest.mock('../../src/services/voteService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/blocks/resultsDM');
jest.mock('../../src/blocks/creatorNotifyDM');

describe('startupRecovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // No stranded polls by default — individual tests can override
    jest.spyOn(pollService, 'getStrandedActivePolls').mockResolvedValue([]);
  });

  describe('scheduled poll recovery', () => {
    it('should post overdue scheduled polls', async () => {
      const scheduledPoll = createTestPoll({
        id: 'poll-123',
        status: 'scheduled',
        channelId: 'C123',
        creatorId: 'U123',
        question: 'Overdue Poll?',
        scheduledAt: new Date(Date.now() - 60000),
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(scheduledPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      await runStartupRecovery(mockSlackClient as any);

      expect(pollService.claimScheduledPoll).toHaveBeenCalledWith('poll-123');
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C123',
        })
      );
    });

    it('should store message timestamp after posting', async () => {
      const scheduledPoll = createTestPoll({
        id: 'poll-123',
        status: 'scheduled',
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(scheduledPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '9999.9999' });

      await runStartupRecovery(mockSlackClient as any);

      expect(pollService.updatePollMessageTs).toHaveBeenCalledWith('poll-123', '9999.9999');
    });

    it('should send recovery notification DM to creator', async () => {
      const scheduledPoll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U789',
        status: 'scheduled',
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(scheduledPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({
        blocks: [{ type: 'section' }],
        text: 'Recovery notification',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      await runStartupRecovery(mockSlackClient as any);

      expect(creatorNotifyDM.buildCreatorNotifyDM).toHaveBeenCalledWith(
        scheduledPoll,
        { isScheduled: true, isRecovery: true }
      );

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'U789',
          text: 'Recovery notification',
        })
      );
    });

    it('should handle channel not found error for scheduled polls', async () => {
      const scheduledPoll = createTestPoll({
        id: 'poll-123',
        channelId: 'C999',
        creatorId: 'U123',
        status: 'scheduled',
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage
        .mockRejectedValueOnce({
          data: { error: 'not_in_channel' },
        })
        .mockResolvedValueOnce({ ok: true });

      await runStartupRecovery(mockSlackClient as any);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'U123',
          text: expect.stringContaining('<#C999>'),
        })
      );
    });

    it('should handle multiple scheduled polls', async () => {
      const polls = [
        createTestPoll({ id: 'poll-1', status: 'scheduled' }),
        createTestPoll({ id: 'poll-2', status: 'scheduled' }),
      ];

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue(polls);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockImplementation(async (id) =>
        polls.find((p) => p.id === id) || null
      );
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue({} as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      await runStartupRecovery(mockSlackClient as any);

      expect(pollService.claimScheduledPoll).toHaveBeenCalledTimes(2);
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(4); // 2 polls + 2 DMs
    });
  });

  describe('stranded poll recovery', () => {
    it('should re-post stranded active polls that never reached Slack', async () => {
      const strandedPoll = createTestPoll({
        id: 'poll-stranded',
        status: 'active',
        messageTs: null,
        channelId: 'C123',
        creatorId: 'U123',
      });

      jest.spyOn(pollService, 'getStrandedActivePolls').mockResolvedValue([strandedPoll] as any);
      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(strandedPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '5555.5555' });

      await runStartupRecovery(mockSlackClient as any);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'C123' })
      );
      expect(pollService.updatePollMessageTs).toHaveBeenCalledWith('poll-stranded', '5555.5555');
    });
  });

  describe('expired poll recovery', () => {
    it('should close overdue active polls', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
        channelId: 'C123',
        closesAt: new Date(Date.now() - 60000),
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Closed' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      await runStartupRecovery(mockSlackClient as any);

      expect(pollService.claimPollClose).toHaveBeenCalledWith('poll-123');
      expect(mockSlackClient.chat.update).toHaveBeenCalledWith({
        channel: 'C123',
        ts: '1234567890.123456',
        blocks: [],
        text: 'Closed',
      });
    });

    it('should send results DM to creator for expired polls', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U789',
        messageTs: '1234567890.123456',
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [{ type: 'section' }],
        text: 'Your poll results',
      });

      await runStartupRecovery(mockSlackClient as any);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'U789',
          text: 'Your poll results',
        })
      );
    });

    it('should fetch voter names for non-anonymous polls', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        messageTs: '1234567890.123456',
        settings: { anonymous: false },
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      await runStartupRecovery(mockSlackClient as any);

      expect(voteService.getVotersByOption).toHaveBeenCalledWith('poll-123');
    });

    it('should skip expired polls without message timestamp', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        messageTs: null,
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);

      await runStartupRecovery(mockSlackClient as any);

      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
    });

    it('should handle multiple expired polls', async () => {
      const polls = [
        createTestPoll({ id: 'poll-1', messageTs: '111.111' }),
        createTestPoll({ id: 'poll-2', messageTs: '222.222' }),
      ];

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue(polls);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockImplementation(async (id) =>
        polls.find((p) => p.id === id) || null
      );
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      await runStartupRecovery(mockSlackClient as any);

      expect(pollService.claimPollClose).toHaveBeenCalledTimes(2);
      expect(mockSlackClient.chat.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('combined recovery', () => {
    it('should handle both scheduled and expired polls', async () => {
      const scheduledPoll = createTestPoll({
        id: 'scheduled-1',
        status: 'scheduled',
      });
      const expiredPoll = createTestPoll({
        id: 'expired-1',
        messageTs: '1234567890.123456',
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockImplementation(async (id) =>
        id === 'scheduled-1' ? scheduledPoll : expiredPoll
      );
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(scheduledPoll as any);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      await runStartupRecovery(mockSlackClient as any);

      expect(pollService.claimScheduledPoll).toHaveBeenCalledWith('scheduled-1');
      expect(pollService.claimPollClose).toHaveBeenCalledWith('expired-1');
    });

    it('should handle empty recovery (no polls)', async () => {
      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);

      await runStartupRecovery(mockSlackClient as any);

      expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully without crashing', async () => {
      jest.spyOn(pollService, 'getScheduledPolls').mockRejectedValue(new Error('Database error'));
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);

      // Should not throw
      await expect(runStartupRecovery(mockSlackClient as any)).resolves.not.toThrow();
    });

    it('should continue processing after channel error', async () => {
      const polls = [
        createTestPoll({ id: 'poll-1', channelId: 'C999', status: 'scheduled', creatorId: 'U111' }),
        createTestPoll({ id: 'poll-2', channelId: 'C123', status: 'scheduled', creatorId: 'U222' }),
      ];

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue(polls);
      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockImplementation(async (id) =>
        polls.find((p) => p.id === id) || null
      );
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue({} as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage
        .mockRejectedValueOnce({
          data: { error: 'not_in_channel' },
        })
        .mockResolvedValueOnce({ ok: true }) // Error DM for first poll
        .mockResolvedValueOnce({ ts: '1234567890.123456' }) // Second poll post
        .mockResolvedValueOnce({ ok: true }); // Second poll DM

      await runStartupRecovery(mockSlackClient as any);

      expect(pollService.claimScheduledPoll).toHaveBeenCalledTimes(2);
    });
  });
});
