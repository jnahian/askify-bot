/**
 * Integration tests for vote action handler
 * Tests the vote button interaction flow end-to-end
 */

import { registerVoteAction } from '../../src/actions/voteAction';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll, createTestVote } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as voteService from '../../src/services/voteService';
import * as pollMessage from '../../src/blocks/pollMessage';

// Mock the services and utilities
jest.mock('../../src/services/pollService');
jest.mock('../../src/services/voteService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/utils/slackRetry', () => ({
  withRetry: jest.fn(async (fn) => await fn()),
}));
jest.mock('../../src/utils/debounce', () => ({
  debouncedUpdate: jest.fn(async (key, fn) => {
    // Execute immediately in tests instead of debouncing
    await fn().catch(() => {
      // Swallow errors to avoid unhandled rejections in tests
    });
  }),
}));

describe('voteAction integration', () => {
  let mockApp: any;
  let mockAck: jest.Mock;
  let registeredActions: Map<RegExp, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    registeredActions = new Map();

    mockAck = jest.fn().mockResolvedValue(undefined);

    // Mock Slack Bolt App
    mockApp = {
      action: jest.fn((pattern: RegExp, handler: Function) => {
        registeredActions.set(pattern, handler);
      }),
    };

    // Register the action
    registerVoteAction(mockApp);
  });

  const createVotePayload = (pollId: string, optionId: string, voterId: string) => ({
    ack: mockAck,
    action: {
      type: 'button',
      action_id: `vote_${optionId}`,
      value: `${pollId}:${optionId}`,
    },
    body: {
      type: 'block_actions',
      user: { id: voterId },
    },
    client: mockSlackClient,
  });

  it('should register vote action with correct pattern', () => {
    expect(mockApp.action).toHaveBeenCalledWith(/^vote_.+$/, expect.any(Function));
  });

  describe('successful vote handling', () => {
    it('should handle single choice vote', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        pollType: 'single_choice',
        status: 'active',
        messageTs: '1234567890.123456',
        channelId: 'C123',
        settings: { allowVoteChange: true, liveResults: true },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(pollService.getPoll).toHaveBeenCalledWith('poll-123');
      expect(voteService.handleSingleVote).toHaveBeenCalledWith(
        'poll-123',
        'opt-1',
        'U123',
        true
      );
    });

    it('should handle multi-select vote', async () => {
      const poll = createTestPoll({
        id: 'poll-456',
        pollType: 'multi_select',
        status: 'active',
        messageTs: '1234567890.123456',
        settings: { allowVoteChange: true, liveResults: true },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleMultiVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-456', 'opt-2', 'U456');

      await handler(payload);

      expect(voteService.handleMultiVote).toHaveBeenCalledWith(
        'poll-456',
        'opt-2',
        'U456',
        true
      );
    });

    it('should update poll message after vote', async () => {
      const poll = createTestPoll({
        id: 'poll-789',
        status: 'active',
        messageTs: '1234567890.123456',
        channelId: 'C789',
        settings: { liveResults: true },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [{ type: 'section' }],
        text: 'Updated Poll',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-789', 'opt-1', 'U789');

      await handler(payload);

      // Wait for debounced update to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockSlackClient.chat.update).toHaveBeenCalledWith({
        channel: 'C789',
        ts: '1234567890.123456',
        blocks: [{ type: 'section' }],
        text: 'Updated Poll',
      });
    });

    it('should fetch voter names for non-anonymous polls', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
        settings: { anonymous: false, liveResults: true },
      });

      const voterNames = new Map([['opt-1', ['U123', 'U456']]]);

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(voterNames);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      // Wait for debounced update to complete
      await new Promise((resolve) => setImmediate(resolve));

      expect(voteService.getVotersByOption).toHaveBeenCalledWith('poll-123');
      expect(pollMessage.buildPollMessage).toHaveBeenCalledWith(
        poll,
        poll.settings,
        voterNames
      );
    });

    it('should not fetch voter names for anonymous polls', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
        settings: { anonymous: true, liveResults: true },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      const getVotersSpy = jest.spyOn(voteService, 'getVotersByOption');
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      expect(getVotersSpy).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should show ephemeral message for closed polls', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'closed',
        channelId: 'C123',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: ':no_entry_sign: This poll is closed.',
      });
    });

    it('should not process vote for closed polls', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'closed' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const handleSingleSpy = jest.spyOn(voteService, 'handleSingleVote');

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      expect(handleSingleSpy).not.toHaveBeenCalled();
    });

    it('should show ephemeral message for rejected votes', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        channelId: 'C123',
        settings: { allowVoteChange: false },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'rejected',
        message: 'Vote changes are not allowed',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: ':x: Vote changes are not allowed',
      });
    });

    it('should not update message for rejected votes', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        settings: { allowVoteChange: false },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'rejected',
        message: 'Not allowed',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
    });

    it('should return early when poll not found', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);
      const handleSingleSpy = jest.spyOn(voteService, 'handleSingleVote');

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('nonexistent', 'opt-1', 'U123');

      await handler(payload);

      expect(handleSingleSpy).not.toHaveBeenCalled();
    });

    it('should return early when poll has no message timestamp', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: null,
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      await handler(payload);

      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
    });

    it('should handle message_not_found error gracefully', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      mockSlackClient.chat.update.mockRejectedValue({
        data: { error: 'message_not_found' },
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      // Should not throw
      await expect(handler(payload)).resolves.not.toThrow();
    });

    it('should handle channel_not_found error gracefully', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      mockSlackClient.chat.update.mockRejectedValue({
        data: { error: 'channel_not_found' },
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      // Should not throw
      await expect(handler(payload)).resolves.not.toThrow();
    });

    it('should handle not_in_channel error gracefully', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      mockSlackClient.chat.update.mockRejectedValue({
        data: { error: 'not_in_channel' },
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-123', 'opt-1', 'U123');

      // Should not throw
      await expect(handler(payload)).resolves.not.toThrow();
    });
  });

  describe('action type validation', () => {
    it('should only process button actions', async () => {
      const handler = Array.from(registeredActions.values())[0];
      const payload = {
        ack: mockAck,
        action: {
          type: 'static_select', // Not a button
          action_id: 'vote_opt-1',
          value: 'poll-123:opt-1',
        },
        body: {
          type: 'block_actions',
          user: { id: 'U123' },
        },
        client: mockSlackClient,
      };

      const getPollSpy = jest.spyOn(pollService, 'getPoll');

      await handler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(getPollSpy).not.toHaveBeenCalled();
    });

    it('should only process block_actions body type', async () => {
      const handler = Array.from(registeredActions.values())[0];
      const payload = {
        ack: mockAck,
        action: {
          type: 'button',
          action_id: 'vote_opt-1',
          value: 'poll-123:opt-1',
        },
        body: {
          type: 'view_submission', // Not block_actions
          user: { id: 'U123' },
        },
        client: mockSlackClient,
      };

      const getPollSpy = jest.spyOn(pollService, 'getPoll');

      await handler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(getPollSpy).not.toHaveBeenCalled();
    });
  });

  describe('vote parsing', () => {
    it('should correctly parse pollId and optionId from value', async () => {
      const poll = createTestPoll({
        id: 'poll-abc-123',
        status: 'active',
        messageTs: '1234567890.123456',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'handleSingleVote').mockResolvedValue({
        action: 'cast',
      });
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Test',
      });

      const handler = Array.from(registeredActions.values())[0];
      const payload = createVotePayload('poll-abc-123', 'opt-xyz-456', 'U123');

      await handler(payload);

      expect(pollService.getPoll).toHaveBeenCalledWith('poll-abc-123');
      expect(voteService.handleSingleVote).toHaveBeenCalledWith(
        'poll-abc-123',
        'opt-xyz-456',
        'U123',
        expect.any(Boolean)
      );
    });
  });
});
