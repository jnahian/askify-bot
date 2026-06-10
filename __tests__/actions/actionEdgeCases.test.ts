/**
 * Edge-case and error-branch tests for action handlers
 * Covers permission checks, not-found paths, channel errors, and
 * dynamic-modal branches not exercised by the happy-path suites.
 */

import { registerVoteAction } from '../../src/actions/voteAction';
import { registerClosePollAction } from '../../src/actions/closePollAction';
import { registerListActions } from '../../src/actions/listActions';
import { registerEditPollAction } from '../../src/actions/editPollAction';
import { registerRepostAction, registerRepostSubmission } from '../../src/actions/repostAction';
import {
  registerScheduleRepostAction,
  registerScheduleRepostSubmission,
} from '../../src/actions/scheduleRepostAction';
import {
  registerShareResultsAction,
  registerShareResultsSubmission,
} from '../../src/actions/shareResultsAction';
import { registerTemplateActions, registerSaveTemplateSubmission } from '../../src/actions/templateActions';
import { registerAddOptionAction, registerAddOptionSubmission } from '../../src/actions/addOptionAction';
import { registerModalActions } from '../../src/actions/modalActions';
import { mockSlackClient, resetSlackMocks } from '../mocks/slack';
import { createTestPoll, createTestOption } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as voteService from '../../src/services/voteService';
import * as templateService from '../../src/services/templateService';
import * as pollMessage from '../../src/blocks/pollMessage';
import * as resultsDM from '../../src/blocks/resultsDM';
import * as pollCreationModal from '../../src/views/pollCreationModal';

jest.mock('../../src/services/pollService');
jest.mock('../../src/services/voteService');
jest.mock('../../src/services/templateService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/blocks/resultsDM');
jest.mock('../../src/views/pollCreationModal');
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    pollOption: { create: jest.fn() },
  },
}));
jest.mock('../../src/utils/slackRetry', () => ({
  withRetry: jest.fn(async (fn) => await fn()),
}));
jest.mock('../../src/utils/debounce', () => ({
  debouncedUpdate: jest.fn(async (_key, fn) => {
    await fn().catch(() => {
      // Swallow errors to avoid unhandled rejections in tests
    });
  }),
}));

describe('action handler edge cases', () => {
  let mockApp: any;
  let actionHandlers: Map<string | RegExp, Function>;
  let viewHandlers: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSlackMocks();
    actionHandlers = new Map();
    viewHandlers = new Map();

    mockApp = {
      action: jest.fn((pattern: string | RegExp, handler: Function) => {
        actionHandlers.set(pattern, handler);
      }),
      view: jest.fn((callbackId: string, handler: Function) => {
        viewHandlers.set(callbackId, handler);
      }),
    };
  });

  const findHandler = (actionId: string): Function => {
    // Exact string matches win over regex patterns (mirrors Bolt's specificity)
    const exact = actionHandlers.get(actionId);
    if (exact) return exact;
    for (const [key, handler] of actionHandlers.entries()) {
      if (key instanceof RegExp && key.test(actionId)) return handler;
    }
    throw new Error(`No handler registered for ${actionId}`);
  };

  const createActionPayload = (
    actionId: string,
    value: string,
    userId: string = 'U123',
    overrides: Partial<any> = {},
  ) => ({
    ack: jest.fn().mockResolvedValue(undefined),
    action: {
      type: 'button',
      action_id: actionId,
      value,
      ...(overrides.action || {}),
    },
    body: {
      type: 'block_actions',
      user: { id: userId },
      channel: { id: 'C123' },
      trigger_id: 'trigger-123',
      ...(overrides.body || {}),
    },
    client: mockSlackClient,
  });

  describe('voteAction error branches', () => {
    let warnSpy: jest.SpyInstance;
    let errorSpy: jest.SpyInstance;

    beforeEach(() => {
      registerVoteAction(mockApp);
      warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
      errorSpy.mockRestore();
    });

    const votePayload = (pollId: string, optionId: string, voterId = 'U123') =>
      createActionPayload(`vote_${optionId}`, `${pollId}:${optionId}`, voterId);

    it('should reject an option that does not belong to the poll', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'active', channelId: 'C123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const handleSingleSpy = jest.spyOn(voteService, 'handleSingleVote');

      const handler = findHandler('vote_opt-other');
      await handler(votePayload('poll-123', 'opt-does-not-exist', 'U777'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U777',
        text: ':x: That option does not belong to this poll.',
      });
      expect(handleSingleSpy).not.toHaveBeenCalled();
    });

    it('should warn and return when getPoll throws message_not_found', async () => {
      jest.spyOn(pollService, 'getPoll').mockRejectedValue({ data: { error: 'message_not_found' } });

      const handler = findHandler('vote_opt-1');
      await expect(handler(votePayload('poll-123', 'opt-1'))).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Poll message deleted for poll poll-123'));
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should warn and return when getPoll throws channel_not_found', async () => {
      jest.spyOn(pollService, 'getPoll').mockRejectedValue({ data: { error: 'channel_not_found' } });

      const handler = findHandler('vote_opt-1');
      await expect(handler(votePayload('poll-123', 'opt-1'))).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Bot not in channel for poll poll-123'));
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should warn and return when getPoll throws not_in_channel', async () => {
      jest.spyOn(pollService, 'getPoll').mockRejectedValue({ data: { error: 'not_in_channel' } });

      const handler = findHandler('vote_opt-1');
      await expect(handler(votePayload('poll-123', 'opt-1'))).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not_in_channel'));
    });

    it('should log unexpected errors without throwing', async () => {
      jest.spyOn(pollService, 'getPoll').mockRejectedValue(new Error('database down'));

      const handler = findHandler('vote_opt-1');
      await expect(handler(votePayload('poll-123', 'opt-1'))).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith('Vote action error:', expect.any(Error));
    });
  });

  describe('closePollAction branches', () => {
    beforeEach(() => {
      registerClosePollAction(mockApp);
    });

    it('should ignore non-button action types', async () => {
      const getPollSpy = jest.spyOn(pollService, 'getPoll');
      const handler = findHandler('close_poll');
      const payload = createActionPayload('close_poll', 'poll-123', 'U123', {
        action: { type: 'static_select' },
      });

      await handler(payload);

      expect(payload.ack).toHaveBeenCalled();
      expect(getPollSpy).not.toHaveBeenCalled();
    });

    it('should ignore non-block_actions body types', async () => {
      const getPollSpy = jest.spyOn(pollService, 'getPoll');
      const handler = findHandler('close_poll');
      const payload = createActionPayload('close_poll', 'poll-123', 'U123', {
        body: { type: 'view_submission' },
      });

      await handler(payload);

      expect(getPollSpy).not.toHaveBeenCalled();
    });

    it('should stop after claiming when refreshed poll has no messageTs', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', status: 'active' });
      const refreshed = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'closed',
        messageTs: null,
      });

      jest
        .spyOn(pollService, 'getPoll')
        .mockResolvedValueOnce(poll)
        .mockResolvedValueOnce(refreshed);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);

      const handler = findHandler('close_poll');
      await handler(createActionPayload('close_poll', 'poll-123', 'U123'));

      expect(pollService.claimPollClose).toHaveBeenCalledWith('poll-123');
      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
      expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    });

    it('should stop after claiming when refreshed poll is missing', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', status: 'active' });

      jest
        .spyOn(pollService, 'getPoll')
        .mockResolvedValueOnce(poll)
        .mockResolvedValueOnce(null);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);

      const handler = findHandler('close_poll');
      await handler(createActionPayload('close_poll', 'poll-123', 'U123'));

      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
    });
  });

  describe('listActions permission and edge branches', () => {
    beforeEach(() => {
      registerListActions(mockApp);
    });

    it('should block non-creator from closing a poll', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', channelId: 'C999' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const claimSpy = jest.spyOn(pollService, 'claimPollClose');

      const handler = findHandler('list_close_poll-123');
      await handler(createActionPayload('list_close_poll-123', 'poll-123', 'U456'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
      expect(claimSpy).not.toHaveBeenCalled();
    });

    it('should fall back to the poll channel when body has no channel (close)', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', channelId: 'C999' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('list_close_poll-123');
      const payload = createActionPayload('list_close_poll-123', 'poll-123', 'U456', {
        body: { channel: undefined },
      });

      await handler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C999',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
    });

    it('should tell the creator when the poll is already closed', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', status: 'closed' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(false);

      const handler = findHandler('list_close_poll-123');
      await handler(createActionPayload('list_close_poll-123', 'poll-123', 'U123'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: ':information_source: This poll is already closed.',
      });
      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
    });

    it('should return early when poll not found (close)', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);
      const claimSpy = jest.spyOn(pollService, 'claimPollClose');

      const handler = findHandler('list_close_poll-123');
      await handler(createActionPayload('list_close_poll-123', 'poll-123', 'U123'));

      expect(claimSpy).not.toHaveBeenCalled();
      expect(mockSlackClient.chat.postEphemeral).not.toHaveBeenCalled();
    });

    it('should skip channel update and DM when closed poll has no messageTs', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        messageTs: null,
        question: 'Skip update?',
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);

      const handler = findHandler('list_close_poll-123');
      await handler(createActionPayload('list_close_poll-123', 'poll-123', 'U123'));

      expect(mockSlackClient.chat.update).not.toHaveBeenCalled();
      expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('has been closed'),
      });
    });

    it('should not fetch voter names when closing an anonymous poll', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        messageTs: '1234.5678',
        settings: { anonymous: true },
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'claimPollClose').mockResolvedValue(true);
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      const getVotersSpy = jest.spyOn(voteService, 'getVotersByOption');
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      const handler = findHandler('list_close_poll-123');
      await handler(createActionPayload('list_close_poll-123', 'poll-123', 'U123'));

      expect(getVotersSpy).not.toHaveBeenCalled();
      expect(mockSlackClient.chat.update).toHaveBeenCalled();
    });

    it('should block non-creator from cancelling a scheduled poll', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const cancelSpy = jest.spyOn(pollService, 'cancelScheduledPoll');

      const handler = findHandler('list_cancel_poll-123');
      await handler(createActionPayload('list_cancel_poll-123', 'poll-123', 'U456'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('should report when a poll could not be cancelled', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'active',
        question: 'Already posted?',
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'cancelScheduledPoll').mockResolvedValue(false);

      const handler = findHandler('list_cancel_poll-123');
      await handler(createActionPayload('list_cancel_poll-123', 'poll-123', 'U123'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('could not be cancelled'),
      });
    });

    it('should return early when poll not found (cancel)', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);
      const cancelSpy = jest.spyOn(pollService, 'cancelScheduledPoll');

      const handler = findHandler('list_cancel_poll-123');
      await handler(createActionPayload('list_cancel_poll-123', 'poll-123', 'U123'));

      expect(cancelSpy).not.toHaveBeenCalled();
    });

    it('should block non-creator from viewing results', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('list_results_poll-123');
      await handler(createActionPayload('list_results_poll-123', 'poll-123', 'U456'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should return early when poll not found (results)', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const handler = findHandler('list_results_poll-123');
      await handler(createActionPayload('list_results_poll-123', 'poll-123', 'U123'));

      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should show closed status for a closed poll in the results modal', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        channelId: 'C456',
        status: 'closed',
        settings: { anonymous: true },
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(1);
      const getVotersSpy = jest.spyOn(voteService, 'getVotersByOption');
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: 'Results' } },
          { type: 'context', elements: [] },
          { type: 'section', text: { type: 'mrkdwn', text: 'Section' } },
          { type: 'divider' },
          { type: 'actions', elements: [] },
        ],
        text: 'Results',
      });

      const handler = findHandler('list_results_poll-123');
      await handler(createActionPayload('list_results_poll-123', 'poll-123', 'U123'));

      // Anonymous poll: voter names are not fetched
      expect(getVotersSpy).not.toHaveBeenCalled();

      const view = mockSlackClient.views.open.mock.calls[0][0].view;
      const contextBlock = view.blocks.find((b: any) => b.type === 'context');
      expect(contextBlock.elements[0].text).toContain(':no_entry_sign: Closed');
      expect(contextBlock.elements[0].text).toContain('1 total vote ·');
    });
  });

  describe('editPollAction branches', () => {
    beforeEach(() => {
      registerEditPollAction(mockApp);
      jest.spyOn(pollCreationModal, 'buildPollCreationModal').mockReturnValue({ type: 'modal' } as any);
    });

    it('should block non-creator from editing a scheduled poll', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('edit_scheduled_poll-123');
      await handler(createActionPayload('edit_scheduled_poll-123', 'poll-123', 'U456'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should use datetime close method when poll has closesAt', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        creatorId: 'U123',
        status: 'scheduled',
        closesAt: new Date('2026-07-01T12:00:00Z'),
        scheduledAt: new Date('2026-06-30T12:00:00Z'),
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('edit_scheduled_poll-123');
      await handler(createActionPayload('edit_scheduled_poll-123', 'poll-123', 'U123'));

      expect(pollCreationModal.buildPollCreationModal).toHaveBeenCalledWith(
        expect.objectContaining({ closeMethod: 'datetime' }),
      );
      expect(mockSlackClient.views.open).toHaveBeenCalled();
    });
  });

  describe('repostAction branches', () => {
    beforeEach(() => {
      registerRepostAction(mockApp);
      registerRepostSubmission(mockApp);
    });

    it('should block non-creator from opening the repost modal', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('repost_poll_poll-123');
      await handler(createActionPayload('repost_poll_poll-123', 'poll-123', 'U456'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    const repostSubmissionPayload = (userId = 'U123') => ({
      ack: jest.fn().mockResolvedValue(undefined),
      view: {
        private_metadata: 'poll-123',
        state: {
          values: {
            repost_channel_block: {
              repost_channel_select: { selected_conversation: 'C789' },
            },
          },
        },
      },
      body: { user: { id: userId } },
      client: mockSlackClient,
    });

    it('should reject repost submission from non-creator', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const repostSpy = jest.spyOn(pollService, 'repostPoll');

      const viewHandler = viewHandlers.get('repost_poll_modal')!;
      const payload = repostSubmissionPayload('U456');
      await viewHandler(payload);

      expect(payload.ack).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { repost_channel_block: 'Only the poll creator can do this.' },
      });
      expect(repostSpy).not.toHaveBeenCalled();
    });

    it('should reject repost submission when source poll missing', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const viewHandler = viewHandlers.get('repost_poll_modal')!;
      const payload = repostSubmissionPayload();
      await viewHandler(payload);

      expect(payload.ack).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { repost_channel_block: 'Only the poll creator can do this.' },
      });
    });

    it('should DM the creator when the bot is not in the target channel', async () => {
      const sourcePoll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      const newPoll = createTestPoll({ id: 'new-poll' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(sourcePoll);
      jest.spyOn(pollService, 'repostPoll').mockResolvedValue(newPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage
        .mockRejectedValueOnce({ data: { error: 'not_in_channel' } })
        .mockResolvedValueOnce({ ok: true });

      const viewHandler = viewHandlers.get('repost_poll_modal')!;
      await viewHandler(repostSubmissionPayload());

      expect(mockSlackClient.chat.postMessage).toHaveBeenLastCalledWith({
        channel: 'U123',
        text: expect.stringContaining("I couldn't post to <#C789>"),
      });
    });
  });

  describe('shareResultsAction branches', () => {
    beforeEach(() => {
      registerShareResultsAction(mockApp);
      registerShareResultsSubmission(mockApp);
    });

    it('should block non-creator from opening the share modal', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('share_results');
      await handler(createActionPayload('share_results', 'poll-123', 'U456'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should return early when poll missing on share button click', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const handler = findHandler('share_results');
      await handler(createActionPayload('share_results', 'poll-123', 'U123'));

      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
      expect(mockSlackClient.chat.postEphemeral).not.toHaveBeenCalled();
    });

    const shareSubmissionPayload = (userId = 'U123') => ({
      ack: jest.fn().mockResolvedValue(undefined),
      view: {
        private_metadata: 'poll-123',
        state: {
          values: {
            share_channel_block: {
              share_channel_select: { selected_conversation: 'C789' },
            },
          },
        },
      },
      body: { user: { id: userId } },
      client: mockSlackClient,
    });

    it('should reject share submission from non-creator', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const viewHandler = viewHandlers.get('share_results_modal')!;
      const payload = shareSubmissionPayload('U456');
      await viewHandler(payload);

      expect(payload.ack).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { share_channel_block: 'Only the poll creator can do this.' },
      });
      expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    });

    it('should DM the user when the bot is not in the share channel', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(voteService, 'getUniqueVoterCount').mockResolvedValue(0);
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Results' } }],
        text: 'Results',
      });

      mockSlackClient.chat.postMessage
        .mockRejectedValueOnce({ data: { error: 'channel_not_found' } })
        .mockResolvedValueOnce({ ok: true });

      const viewHandler = viewHandlers.get('share_results_modal')!;
      await viewHandler(shareSubmissionPayload());

      // Only the not-in-channel DM is sent; the success confirmation is skipped
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledTimes(2);
      expect(mockSlackClient.chat.postMessage).toHaveBeenLastCalledWith({
        channel: 'U123',
        text: expect.stringContaining("I couldn't post to <#C789>"),
      });
    });
  });

  describe('scheduleRepostAction branches', () => {
    beforeEach(() => {
      registerScheduleRepostAction(mockApp);
      registerScheduleRepostSubmission(mockApp);
    });

    it('should show an error when the poll is not found', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const handler = findHandler('schedule_repost_poll-123');
      await handler(createActionPayload('schedule_repost_poll-123', 'poll-123', 'U123'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: ':x: Could not find this poll.',
      });
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should block non-creator from scheduling a repost', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('schedule_repost_poll-123');
      await handler(createActionPayload('schedule_repost_poll-123', 'poll-123', 'U456'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U456',
        text: ':x: Only the poll creator can do this.',
      });
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should rebuild the modal with a close datetime picker when datetime is selected', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123', channelId: 'C123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const selectHandler = findHandler('schedule_repost_close_method_select');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        action: { type: 'static_select', selected_option: { value: 'datetime' } },
        body: {
          type: 'block_actions',
          user: { id: 'U123' },
          view: { id: 'view-123', private_metadata: 'poll-123' },
        },
        client: mockSlackClient,
      };

      await selectHandler(payload);

      const updatedView = mockSlackClient.views.update.mock.calls[0][0].view;
      const blockIds = updatedView.blocks.map((b: any) => b.block_id);
      expect(blockIds).toContain('schedule_repost_datetime_close_block');
      expect(blockIds).not.toContain('schedule_repost_duration_block');
    });

    it('should not rebuild the modal for a non-creator on close method change', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const selectHandler = findHandler('schedule_repost_close_method_select');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        action: { type: 'static_select', selected_option: { value: 'duration' } },
        body: {
          type: 'block_actions',
          user: { id: 'U456' },
          view: { id: 'view-123', private_metadata: 'poll-123' },
        },
        client: mockSlackClient,
      };

      await selectHandler(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });

    it('should reject schedule repost submission from non-creator', async () => {
      const poll = createTestPoll({ id: 'poll-123', creatorId: 'U123' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const repostSpy = jest.spyOn(pollService, 'repostPoll');

      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const viewHandler = viewHandlers.get('schedule_repost_modal')!;
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              schedule_repost_datetime_block: {
                schedule_repost_datetime: { selected_date_time: futureTimestamp },
              },
              schedule_repost_channel_block: {
                schedule_repost_channel: { selected_conversation: 'C789' },
              },
            },
          },
        },
        body: { user: { id: 'U456' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(payload.ack).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { schedule_repost_channel_block: 'Only the poll creator can do this.' },
      });
      expect(repostSpy).not.toHaveBeenCalled();
    });

    it('should reject schedule repost submission when source poll missing', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;
      const viewHandler = viewHandlers.get('schedule_repost_modal')!;
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              schedule_repost_datetime_block: {
                schedule_repost_datetime: { selected_date_time: futureTimestamp },
              },
              schedule_repost_channel_block: {
                schedule_repost_channel: { selected_conversation: 'C789' },
              },
            },
          },
        },
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(payload.ack).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { schedule_repost_channel_block: 'Only the poll creator can do this.' },
      });
    });
  });

  describe('templateActions branches', () => {
    beforeEach(() => {
      registerTemplateActions(mockApp);
      registerSaveTemplateSubmission(mockApp);
    });

    it('should show an error when the template is not found', async () => {
      jest.spyOn(templateService, 'getTemplate').mockResolvedValue(null);

      const handler = findHandler('use_template_tmpl-404');
      await handler(createActionPayload('use_template_tmpl-404', 'tmpl-404', 'U123'));

      expect(templateService.getTemplate).toHaveBeenCalledWith('tmpl-404', 'U123');
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: ':x: Could not find this template.',
      });
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should ignore non-button save_as_template actions', async () => {
      const handler = findHandler('save_as_template');
      const payload = createActionPayload('save_as_template', 'poll-123', 'U123', {
        action: { type: 'static_select' },
      });

      await handler(payload);

      expect(payload.ack).toHaveBeenCalled();
      expect(mockSlackClient.views.open).not.toHaveBeenCalled();
    });

    it('should include description and rating scale when saving a template', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        pollType: 'rating',
        settings: { description: 'Pick a rating', ratingScale: 5 },
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(templateService, 'saveTemplate').mockResolvedValue({} as any);

      const viewHandler = viewHandlers.get('save_template_modal')!;
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              template_name_block: { template_name_input: { value: 'Rating Template' } },
            },
          },
        },
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(templateService.saveTemplate).toHaveBeenCalledWith(
        'U123',
        'Rating Template',
        expect.objectContaining({
          description: 'Pick a rating',
          settings: expect.objectContaining({ ratingScale: 5 }),
        }),
      );
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123',
        text: expect.stringContaining('saved!'),
      });
    });

    it('should report failure when a template cannot be deleted', async () => {
      jest.spyOn(templateService, 'deleteTemplate').mockResolvedValue(false);

      const handler = findHandler('delete_template_tmpl-404');
      await handler(createActionPayload('delete_template_tmpl-404', 'tmpl-404', 'U123'));

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: ':x: Could not delete template.',
      });
    });
  });

  describe('addOptionAction submission branches', () => {
    beforeEach(() => {
      registerAddOptionAction(mockApp);
      registerAddOptionSubmission(mockApp);
    });

    const submitPayload = (pollId: string, optionText: string) => ({
      ack: jest.fn().mockResolvedValue(undefined),
      view: {
        private_metadata: pollId,
        state: {
          values: {
            new_option_block: { new_option_input: { value: optionText } },
          },
        },
      },
      body: { user: { id: 'U123' } },
      client: mockSlackClient,
    });

    it('should reject when the poll does not allow adding options', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        settings: { allowAddingOptions: false },
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const viewHandler = viewHandlers.get('add_option_modal')!;
      const payload = submitPayload('poll-123', 'New Option');
      await viewHandler(payload);

      expect(payload.ack).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { new_option_block: 'This poll does not allow adding options.' },
      });
    });

    it('should reject when the poll already has the maximum number of options', async () => {
      const options = Array.from({ length: 10 }, (_, i) =>
        createTestOption({ id: `opt-${i}`, label: `Option ${i}`, position: i }),
      );
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
        settings: { allowAddingOptions: true },
        options,
      });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const viewHandler = viewHandlers.get('add_option_modal')!;
      const payload = submitPayload('poll-123', 'Eleventh Option');
      await viewHandler(payload);

      expect(payload.ack).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { new_option_block: 'This poll already has the maximum of 10 options.' },
      });
    });
  });

  describe('modalActions metadata and rebuild branches', () => {
    beforeEach(() => {
      registerModalActions(mockApp);
      jest.spyOn(pollCreationModal, 'buildPollCreationModal').mockReturnValue({ type: 'modal' } as any);
    });

    const modalPayload = (values: any, privateMetadata?: string) => ({
      ack: jest.fn().mockResolvedValue(undefined),
      body: {
        type: 'block_actions',
        view: {
          id: 'view-123',
          hash: 'hash-abc',
          callback_id: 'poll_creation_modal',
          private_metadata: privateMetadata,
          state: { values },
        },
      },
      client: mockSlackClient,
    });

    it('should rebuild the modal on close method change', async () => {
      const handler = findHandler('close_method_select');
      const payload = modalPayload({
        close_method_block: {
          close_method_select: { selected_option: { value: 'duration' } },
        },
        settings_block: {
          settings_checkboxes: {
            selected_options: [{ value: 'anonymous' }, { value: 'reminders' }],
          },
        },
      });

      await handler(payload);

      expect(mockSlackClient.views.update).toHaveBeenCalledWith(
        expect.objectContaining({ view_id: 'view-123', hash: 'hash-abc' }),
      );
      expect(pollCreationModal.buildPollCreationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          closeMethod: 'duration',
          prefill: expect.objectContaining({ anonymous: true, reminders: true }),
        }),
      );
    });

    it('should rebuild the modal on schedule method change', async () => {
      const handler = findHandler('schedule_method_select');
      const payload = modalPayload({
        schedule_method_block: {
          schedule_method_select: { selected_option: { value: 'scheduled' } },
        },
      });

      await handler(payload);

      expect(pollCreationModal.buildPollCreationModal).toHaveBeenCalledWith(
        expect.objectContaining({ scheduleMethod: 'scheduled' }),
      );
    });

    it('should parse JSON private_metadata and preserve the poll id', async () => {
      const handler = findHandler('poll_type_select');
      const payload = modalPayload(
        {
          poll_type_block: {
            poll_type_select: { selected_option: { value: 'multi_select' } },
          },
          option_block_0: { option_input_0: { value: 'A' } },
          option_block_1: { option_input_1: { value: 'B' } },
        },
        JSON.stringify({ pollId: 'poll-xyz' }),
      );

      await handler(payload);

      expect(pollCreationModal.buildPollCreationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          privateMetadata: JSON.stringify({ pollId: 'poll-xyz', savedOptions: ['A', 'B'] }),
        }),
      );
    });

    it('should treat malformed JSON private_metadata as empty metadata', async () => {
      const handler = findHandler('poll_type_select');
      const payload = modalPayload(
        {
          poll_type_block: {
            poll_type_select: { selected_option: { value: 'single_choice' } },
          },
          option_block_0: { option_input_0: { value: 'A' } },
          option_block_1: { option_input_1: { value: 'B' } },
        },
        '{not valid json',
      );

      await handler(payload);

      expect(pollCreationModal.buildPollCreationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          privateMetadata: JSON.stringify({ savedOptions: ['A', 'B'] }),
        }),
      );
    });

    it('should treat plain-string private_metadata as a legacy poll id', async () => {
      const handler = findHandler('poll_type_select');
      const payload = modalPayload(
        {
          poll_type_block: {
            poll_type_select: { selected_option: { value: 'single_choice' } },
          },
          option_block_0: { option_input_0: { value: 'A' } },
          option_block_1: { option_input_1: { value: 'B' } },
        },
        'legacy-poll-id',
      );

      await handler(payload);

      expect(pollCreationModal.buildPollCreationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          privateMetadata: JSON.stringify({ pollId: 'legacy-poll-id', savedOptions: ['A', 'B'] }),
        }),
      );
    });

    it('should restore saved options when option inputs are hidden', async () => {
      const handler = findHandler('poll_type_select');
      const payload = modalPayload(
        {
          // No option_block_* keys — options hidden (yes_no/rating modal)
          poll_type_block: {
            poll_type_select: { selected_option: { value: 'single_choice' } },
          },
        },
        JSON.stringify({ savedOptions: ['Saved A', 'Saved B'] }),
      );

      await handler(payload);

      expect(pollCreationModal.buildPollCreationModal).toHaveBeenCalledWith(
        expect.objectContaining({
          prefill: expect.objectContaining({ options: ['Saved A', 'Saved B'] }),
        }),
      );
    });
  });
});
