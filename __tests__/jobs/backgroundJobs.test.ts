/**
 * Tests for background cron jobs
 * Covers auto-close and scheduled poll jobs
 */

import { startAutoCloseJob } from '../../src/jobs/autoCloseJob';
import { startScheduledPollJob } from '../../src/jobs/scheduledPollJob';
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

// Mock node-cron to capture and execute callbacks
let cronCallbacks: Function[] = [];
jest.mock('node-cron', () => ({
  schedule: jest.fn((pattern: string, callback: Function) => {
    cronCallbacks.push(callback);
  }),
}));

describe('background jobs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cronCallbacks = [];
  });

  describe('auto-close job', () => {
    it('should schedule cron job', () => {
      startAutoCloseJob(mockSlackClient as any);

      const nodeCron = require('node-cron');
      expect(nodeCron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
    });

    it('should close expired polls', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        closesAt: new Date(Date.now() - 60000), // 1 minute ago
        messageTs: '1234567890.123456',
        channelId: 'C123',
      });

      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Closed' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      startAutoCloseJob(mockSlackClient as any);

      // Execute the cron callback
      await cronCallbacks[0]();

      expect(pollService.getExpiredPolls).toHaveBeenCalled();
      expect(pollService.claimPollClose).toHaveBeenCalledWith('poll-123');
    });

    it('should update channel message with final results', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        messageTs: '1234567890.123456',
        channelId: 'C123',
      });

      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Final Results',
      });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      startAutoCloseJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(mockSlackClient.chat.update).toHaveBeenCalledWith({
        channel: 'C123',
        ts: '1234567890.123456',
        blocks: [],
        text: 'Final Results',
      });
    });

    it('should DM results to creator', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        messageTs: '1234567890.123456',
      });

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

      startAutoCloseJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123',
        blocks: [{ type: 'section' }],
        text: 'Your poll results',
      });
    });

    it('should fetch voter names for non-anonymous polls', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        messageTs: '1234567890.123456',
        settings: { anonymous: false },
      });

      const voterNames = new Map([['opt-1', ['U111', 'U222']]]);

      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(voterNames);
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(2);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      startAutoCloseJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(voteService.getVotersByOption).toHaveBeenCalledWith('poll-123');
    });

    it('should skip polls without message timestamp', async () => {
      const expiredPoll = createTestPoll({
        id: 'poll-123',
        messageTs: null, // No message posted yet
      });

      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue([expiredPoll]);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(expiredPoll);

      startAutoCloseJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
    });

    it('should handle multiple expired polls', async () => {
      const polls = [
        createTestPoll({ id: 'poll-1', messageTs: '111.111' }),
        createTestPoll({ id: 'poll-2', messageTs: '222.222' }),
      ];

      jest.spyOn(pollService, 'getExpiredPolls').mockResolvedValue(polls);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockImplementation(async (id) =>
        polls.find((p) => p.id === id) || null
      );
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      startAutoCloseJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(pollService.claimPollClose).toHaveBeenCalledTimes(2);
      expect(mockSlackClient.chat.update).toHaveBeenCalledTimes(2);
    });
  });

  describe('scheduled poll job', () => {
    it('should schedule cron job', () => {
      startScheduledPollJob(mockSlackClient as any);

      const nodeCron = require('node-cron');
      expect(nodeCron.schedule).toHaveBeenCalledWith('* * * * *', expect.any(Function));
    });

    it('should activate and post scheduled polls', async () => {
      const scheduledPoll = createTestPoll({
        id: 'poll-123',
        status: 'scheduled',
        channelId: 'C123',
        scheduledAt: new Date(Date.now() - 30000),
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(scheduledPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      startScheduledPollJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(pollService.claimScheduledPoll).toHaveBeenCalledWith('poll-123');
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C123',
        })
      );
    });

    it('should store message timestamp after posting', async () => {
      const scheduledPoll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(scheduledPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '9999.9999' });

      startScheduledPollJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(pollService.updatePollMessageTs).toHaveBeenCalledWith('poll-123', '9999.9999');
    });

    it('should notify creator with DM', async () => {
      const scheduledPoll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U789',
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(scheduledPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({
        blocks: [{ type: 'section' }],
        text: 'Poll is live!',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      startScheduledPollJob(mockSlackClient as any);

      await cronCallbacks[0]();

      // Second call should be the DM
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U789',
        blocks: [{ type: 'section' }],
        text: 'Poll is live!',
      });
    });

    it('should handle channel not found error', async () => {
      const scheduledPoll = createTestPoll({
        id: 'poll-123',
        channelId: 'C999',
        creatorId: 'U123',
      });

      jest.spyOn(pollService, 'getScheduledPolls').mockResolvedValue([scheduledPoll]);
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(scheduledPoll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage
        .mockRejectedValueOnce({
          data: { error: 'not_in_channel' },
        })
        .mockResolvedValueOnce({ ok: true });

      startScheduledPollJob(mockSlackClient as any);

      await cronCallbacks[0]();

      // Should send error DM to creator
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
      jest.spyOn(pollService, 'claimScheduledPoll').mockResolvedValue(true);
      jest.spyOn(pollService, 'getPoll').mockImplementation(async (id) =>
        polls.find((p) => p.id === id) || null
      );
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue({} as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      startScheduledPollJob(mockSlackClient as any);

      await cronCallbacks[0]();

      expect(pollService.claimScheduledPoll).toHaveBeenCalledTimes(2);
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(4); // 2 polls + 2 DMs
    });
  });
});
