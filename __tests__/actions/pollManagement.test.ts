/**
 * Integration tests for poll management actions
 * Tests close poll and add option functionality
 */

import { registerClosePollAction } from '../../src/actions/closePollAction';
import { registerAddOptionAction, registerAddOptionSubmission } from '../../src/actions/addOptionAction';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll, createTestOption } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as voteService from '../../src/services/voteService';
import * as pollMessage from '../../src/blocks/pollMessage';
import * as resultsDM from '../../src/blocks/resultsDM';
import prisma from '../../src/lib/prisma';

// Mock the services and blocks
jest.mock('../../src/services/pollService');
jest.mock('../../src/services/voteService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/blocks/resultsDM');
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    pollOption: {
      create: jest.fn(),
    },
  },
}));

describe('poll management actions', () => {
  let mockApp: any;
  let mockAck: jest.Mock;
  let registeredActions: Map<string, Function>;
  let registeredViews: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    registeredActions = new Map();
    registeredViews = new Map();

    mockAck = jest.fn().mockResolvedValue(undefined);

    // Mock Slack Bolt App
    mockApp = {
      action: jest.fn((actionId: string, handler: Function) => {
        registeredActions.set(actionId, handler);
      }),
      view: jest.fn((callbackId: string, handler: Function) => {
        registeredViews.set(callbackId, handler);
      }),
    };

    // Register the actions
    registerClosePollAction(mockApp);
    registerAddOptionAction(mockApp);
    registerAddOptionSubmission(mockApp);
  });

  describe('close poll action', () => {
    const createClosePayload = (pollId: string, userId: string) => ({
      ack: mockAck,
      action: {
        type: 'button',
        action_id: 'close_poll',
        value: pollId,
      },
      body: {
        type: 'block_actions',
        user: { id: userId },
      },
      client: mockSlackClient,
    });

    it('should register close_poll action', () => {
      expect(mockApp.action).toHaveBeenCalledWith('close_poll', expect.any(Function));
    });

    it('should successfully close poll by creator', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'active',
        messageTs: '1234567890.123456',
        channelId: 'C123',
        settings: { liveResults: true },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'closePoll').mockResolvedValue(poll as any);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll Closed',
      });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [],
        text: 'Results',
      });

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('poll-123', 'U123');

      await handler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(pollService.closePoll).toHaveBeenCalledWith('poll-123');
      expect(mockSlackClient.chat.update).toHaveBeenCalled();
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123',
        blocks: [],
        text: 'Results',
      });
    });

    it('should prevent non-creator from closing poll', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        channelId: 'C123',
        status: 'active',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const closePollSpy = jest.spyOn(pollService, 'closePoll');

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('poll-123', 'U456'); // Different user

      await handler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can close this poll.',
      });
      expect(closePollSpy).not.toHaveBeenCalled();
    });

    it('should return early if poll already closed', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'closed',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const closePollSpy = jest.spyOn(pollService, 'closePoll');

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('poll-123', 'U123');

      await handler(payload);

      expect(closePollSpy).not.toHaveBeenCalled();
    });

    it('should return early if poll not found', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);
      const closePollSpy = jest.spyOn(pollService, 'closePoll');

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('nonexistent', 'U123');

      await handler(payload);

      expect(closePollSpy).not.toHaveBeenCalled();
    });

    it('should update channel message with final results', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'active',
        messageTs: '1234567890.123456',
        channelId: 'C123',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'closePoll').mockResolvedValue(poll as any);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Final Results',
      });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [],
        text: 'Results',
      });

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('poll-123', 'U123');

      await handler(payload);

      expect(mockSlackClient.chat.update).toHaveBeenCalledWith({
        channel: 'C123',
        ts: '1234567890.123456',
        blocks: [],
        text: 'Final Results',
      });
    });

    it('should force show results on close regardless of liveResults setting', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'active',
        messageTs: '1234567890.123456',
        settings: { liveResults: false }, // Results hidden during voting
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'closePoll').mockResolvedValue(poll as any);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      const buildMessageSpy = jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Results',
      });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [],
        text: 'Results',
      });

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('poll-123', 'U123');

      await handler(payload);

      // Should pass liveResults: true to force showing results
      expect(buildMessageSpy).toHaveBeenCalledWith(
        poll,
        expect.objectContaining({ liveResults: true }),
        expect.anything()
      );
    });

    it('should fetch voter names for non-anonymous polls', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'active',
        messageTs: '1234567890.123456',
        settings: { anonymous: false },
      });

      const voterNames = new Map([['opt-1', ['U111', 'U222']]]);

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'closePoll').mockResolvedValue(poll as any);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(voterNames);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [],
        text: 'Results',
      });

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('poll-123', 'U123');

      await handler(payload);

      expect(voteService.getVotersByOption).toHaveBeenCalledWith('poll-123');
      expect(pollMessage.buildPollMessage).toHaveBeenCalledWith(
        poll,
        expect.anything(),
        voterNames
      );
    });

    it('should not fetch voter names for anonymous polls', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'active',
        messageTs: '1234567890.123456',
        settings: { anonymous: true },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'closePoll').mockResolvedValue(poll as any);
      const getVotersSpy = jest.spyOn(voteService, 'getVotersByOption');
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [],
        text: 'Results',
      });

      const handler = registeredActions.get('close_poll')!;
      const payload = createClosePayload('poll-123', 'U123');

      await handler(payload);

      expect(getVotersSpy).not.toHaveBeenCalled();
    });
  });

  describe('add option action', () => {
    const createAddOptionPayload = (pollId: string) => ({
      ack: mockAck,
      action: {
        type: 'button',
        action_id: 'add_option',
        value: pollId,
      },
      body: {
        type: 'block_actions',
        trigger_id: 'trigger-123',
      },
      client: mockSlackClient,
    });

    it('should register add_option action', () => {
      expect(mockApp.action).toHaveBeenCalledWith('add_option', expect.any(Function));
    });

    it('should open modal when add option button clicked', async () => {
      const handler = registeredActions.get('add_option')!;
      const payload = createAddOptionPayload('poll-123');

      await handler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.objectContaining({
          type: 'modal',
          callback_id: 'add_option_modal',
          private_metadata: 'poll-123',
        }),
      });
    });

    it('should include input field in modal', async () => {
      const handler = registeredActions.get('add_option')!;
      const payload = createAddOptionPayload('poll-456');

      await handler(payload);

      const viewsOpenCall = mockSlackClient.views.open.mock.calls[0][0];
      expect(viewsOpenCall.view.blocks).toHaveLength(1);
      expect(viewsOpenCall.view.blocks[0].type).toBe('input');
      expect(viewsOpenCall.view.blocks[0].block_id).toBe('new_option_block');
    });
  });

  describe('add option submission', () => {
    const createSubmitPayload = (pollId: string, optionText: string, userId: string = 'U123') => ({
      ack: mockAck,
      view: {
        private_metadata: pollId,
        state: {
          values: {
            new_option_block: {
              new_option_input: {
                value: optionText,
              },
            },
          },
        },
      },
      body: {
        user: { id: userId },
      },
      client: mockSlackClient,
    });

    it('should register add_option_modal view submission', () => {
      expect(mockApp.view).toHaveBeenCalledWith('add_option_modal', expect.any(Function));
    });

    it('should successfully add new option', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
        channelId: 'C123',
        options: [
          createTestOption({ label: 'Red', position: 0 }),
          createTestOption({ label: 'Blue', position: 1 }),
        ],
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Updated Poll',
      });

      (prisma.pollOption.create as jest.Mock).mockResolvedValue({
        id: 'opt-new',
        pollId: 'poll-123',
        label: 'Green',
        position: 2,
        addedBy: 'U123',
      } as any);

      const handler = registeredViews.get('add_option_modal')!;
      const payload = createSubmitPayload('poll-123', 'Green', 'U123');

      await handler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(prisma.pollOption.create).toHaveBeenCalledWith({
        data: {
          pollId: 'poll-123',
          label: 'Green',
          position: 2,
          addedBy: 'U123',
        },
      });
    });

    it('should reject empty option text', async () => {
      const handler = registeredViews.get('add_option_modal')!;
      const payload = createSubmitPayload('poll-123', '  '); // Empty after trim

      await handler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { new_option_block: 'Please enter an option.' },
      });
      expect(prisma.pollOption.create).not.toHaveBeenCalled();
    });

    it('should reject if poll not found', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const handler = registeredViews.get('add_option_modal')!;
      const payload = createSubmitPayload('nonexistent', 'New Option');

      await handler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { new_option_block: 'Poll not found.' },
      });
    });

    it('should reject if poll is closed', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'closed' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = registeredViews.get('add_option_modal')!;
      const payload = createSubmitPayload('poll-123', 'New Option');

      await handler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { new_option_block: 'This poll is closed.' },
      });
    });

    it('should reject duplicate options (case insensitive)', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        options: [
          createTestOption({ label: 'Red' }),
          createTestOption({ label: 'Blue' }),
        ],
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = registeredViews.get('add_option_modal')!;
      const payload = createSubmitPayload('poll-123', 'red'); // lowercase

      await handler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { new_option_block: 'This option already exists.' },
      });
    });

    it('should update poll message after adding option', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
        channelId: 'C123',
        options: [createTestOption({ position: 0 })],
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Updated',
      });

      (prisma.pollOption.create as jest.Mock).mockResolvedValue({} as any);

      const handler = registeredViews.get('add_option_modal')!;
      const payload = createSubmitPayload('poll-123', 'New Option');

      await handler(payload);

      expect(mockSlackClient.chat.update).toHaveBeenCalledWith({
        channel: 'C123',
        ts: '1234567890.123456',
        blocks: [],
        text: 'Updated',
      });
    });

    it('should track who added the option', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        messageTs: '1234567890.123456',
        options: [],
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      (prisma.pollOption.create as jest.Mock).mockResolvedValue({} as any);

      const handler = registeredViews.get('add_option_modal')!;
      const payload = createSubmitPayload('poll-123', 'New Option', 'U456');

      await handler(payload);

      expect(prisma.pollOption.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          addedBy: 'U456',
        }),
      });
    });
  });
});
