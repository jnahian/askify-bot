/**
 * Tests for remaining action handlers
 * Covers edit, list, modal, repost, schedule, share, and template actions
 */

import { registerEditPollAction } from '../../src/actions/editPollAction';
import { registerListActions } from '../../src/actions/listActions';
import { registerModalActions } from '../../src/actions/modalActions';
import { registerRepostAction, registerRepostSubmission } from '../../src/actions/repostAction';
import { registerScheduleRepostAction, registerScheduleRepostSubmission } from '../../src/actions/scheduleRepostAction';
import { registerShareResultsAction, registerShareResultsSubmission } from '../../src/actions/shareResultsAction';
import { registerTemplateActions, registerSaveTemplateSubmission } from '../../src/actions/templateActions';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as voteService from '../../src/services/voteService';
import * as templateService from '../../src/services/templateService';
import * as pollMessage from '../../src/blocks/pollMessage';
import * as resultsDM from '../../src/blocks/resultsDM';
import * as pollCreationModal from '../../src/views/pollCreationModal';

// Mock dependencies
jest.mock('../../src/services/pollService');
jest.mock('../../src/services/voteService');
jest.mock('../../src/services/templateService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/blocks/resultsDM');
jest.mock('../../src/views/pollCreationModal');

describe('action handlers', () => {
  let mockApp: any;
  let actionHandlers: Map<string | RegExp, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    actionHandlers = new Map();

    mockApp = {
      action: jest.fn((pattern: string | RegExp, handler: Function) => {
        actionHandlers.set(pattern, handler);
      }),
      view: jest.fn(),
    };
  });

  const createActionPayload = (actionId: string, value: string, userId: string = 'U123') => ({
    ack: jest.fn().mockResolvedValue(undefined),
    action: {
      type: 'button',
      action_id: actionId,
      value,
    },
    body: {
      type: 'block_actions',
      user: { id: userId },
      channel: { id: 'C123' },
      trigger_id: 'trigger-123',
    },
    client: mockSlackClient,
  });

  const findHandler = (pattern: string): Function | undefined => {
    for (const [key, handler] of actionHandlers.entries()) {
      if (key instanceof RegExp && key.test(pattern)) {
        return handler;
      } else if (key === pattern) {
        return handler;
      }
    }
    return undefined;
  };

  describe('editPollAction', () => {
    beforeEach(() => {
      registerEditPollAction(mockApp);
    });

    it('should register edit_scheduled action', () => {
      expect(mockApp.action).toHaveBeenCalledWith(/^edit_scheduled_.+$/, expect.any(Function));
    });

    it('should open edit modal for scheduled poll', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'scheduled',
        question: 'Test Poll?',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollCreationModal, 'buildPollCreationModal').mockReturnValue({ type: 'modal' } as any);

      const handler = findHandler('edit_scheduled_poll-123');
      const payload = createActionPayload('edit_scheduled_poll-123', 'poll-123');

      await handler!(payload);

      expect(payload.ack).toHaveBeenCalled();
      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.any(Object),
      });
    });

    it('should show error when poll not found', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const handler = findHandler('edit_scheduled_poll-123');
      const payload = createActionPayload('edit_scheduled_poll-123', 'poll-123');

      await handler!(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Could not find this poll'),
      });
    });

    it('should prevent editing non-scheduled polls', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('edit_scheduled_poll-123');
      const payload = createActionPayload('edit_scheduled_poll-123', 'poll-123');

      await handler!(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('already been posted'),
      });
    });
  });

  describe('listActions', () => {
    beforeEach(() => {
      registerListActions(mockApp);
    });

    it('should register list action patterns', () => {
      expect(mockApp.action).toHaveBeenCalledWith(/^list_close_.+$/, expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith(/^list_cancel_.+$/, expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith(/^list_results_.+$/, expect.any(Function));
    });

    it('should close poll from list', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        messageTs: '1234567890.123456',
        channelId: 'C123',
        question: 'Test?',
      });

      jest.spyOn(pollService, 'closePoll').mockResolvedValue(poll as any);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({ blocks: [], text: 'Results' });

      const handler = findHandler('list_close_poll-123');
      const payload = createActionPayload('list_close_poll-123', 'poll-123');

      await handler!(payload);

      expect(pollService.closePoll).toHaveBeenCalledWith('poll-123');
      expect(mockSlackClient.chat.update).toHaveBeenCalled();
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('has been closed'),
      });
    });

    it('should cancel scheduled poll from list', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        question: 'Test?',
        status: 'closed',
      });

      jest.spyOn(pollService, 'cancelScheduledPoll').mockResolvedValue(poll as any);
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('list_cancel_poll-123');
      const payload = createActionPayload('list_cancel_poll-123', 'poll-123');

      await handler!(payload);

      expect(pollService.cancelScheduledPoll).toHaveBeenCalledWith('poll-123');
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('has been cancelled'),
      });
    });

    it('should open results modal from list', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        channelId: 'C456',
        _count: { votes: 5 },
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
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
      const payload = createActionPayload('list_results_poll-123', 'poll-123');

      await handler!(payload);

      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: {
          type: 'modal',
          title: { type: 'plain_text', text: 'Poll Results' },
          close: { type: 'plain_text', text: 'Close' },
          blocks: expect.any(Array),
        },
      });
    });
  });

  describe('modalActions', () => {
    beforeEach(() => {
      registerModalActions(mockApp);
      jest.spyOn(pollCreationModal, 'buildPollCreationModal').mockReturnValue({ type: 'modal' } as any);
    });

    it('should register modal action IDs', () => {
      expect(mockApp.action).toHaveBeenCalledWith('poll_type_select', expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith('close_method_select', expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith('schedule_method_select', expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith('add_modal_option', expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith('remove_modal_option', expect.any(Function));
    });

    it('should update modal when poll type changes', async () => {
      const handler = findHandler('poll_type_select');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: {
          type: 'block_actions',
          view: {
            id: 'view-123',
            hash: 'hash-abc',
            state: {
              values: {
                poll_type_block: {
                  poll_type_select: { selected_option: { value: 'multi_select' } },
                },
              },
            },
          },
        },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(payload.ack).toHaveBeenCalled();
      expect(mockSlackClient.views.update).toHaveBeenCalledWith({
        view_id: 'view-123',
        hash: 'hash-abc',
        view: expect.any(Object),
      });
    });

    it('should add option field when button clicked', async () => {
      const handler = findHandler('add_modal_option');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: {
          type: 'block_actions',
          view: {
            id: 'view-123',
            hash: 'hash-abc',
            state: {
              values: {
                option_block_0: { option_input_0: { value: 'A' } },
                option_block_1: { option_input_1: { value: 'B' } },
              },
            },
          },
        },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).toHaveBeenCalled();
    });

    it('should remove option field when button clicked', async () => {
      const handler = findHandler('remove_modal_option');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: {
          type: 'block_actions',
          view: {
            id: 'view-123',
            hash: 'hash-abc',
            state: {
              values: {
                option_block_0: { option_input_0: { value: 'A' } },
                option_block_1: { option_input_1: { value: 'B' } },
                option_block_2: { option_input_2: { value: 'C' } },
              },
            },
          },
        },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).toHaveBeenCalled();
    });

    it('should not add more than 10 options', async () => {
      const handler = findHandler('add_modal_option');
      const values: any = {};
      for (let i = 0; i < 10; i++) {
        values[`option_block_${i}`] = { [`option_input_${i}`]: { value: `Opt ${i}` } };
      }

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: {
          type: 'block_actions',
          view: {
            id: 'view-123',
            hash: 'hash-abc',
            state: { values },
          },
        },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });

    it('should not remove below 2 options', async () => {
      const handler = findHandler('remove_modal_option');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: {
          type: 'block_actions',
          view: {
            id: 'view-123',
            hash: 'hash-abc',
            state: {
              values: {
                option_block_0: { option_input_0: { value: 'A' } },
                option_block_1: { option_input_1: { value: 'B' } },
              },
            },
          },
        },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });

    it('should ignore non-block_actions for poll type select', async () => {
      const handler = findHandler('poll_type_select');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: { type: 'view_submission' },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });

    it('should ignore missing view for close method select', async () => {
      const handler = findHandler('close_method_select');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: { type: 'block_actions', view: null },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });

    it('should ignore non-block_actions for schedule method select', async () => {
      const handler = findHandler('schedule_method_select');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: { type: 'message_action' },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });

    it('should ignore non-block_actions for add option', async () => {
      const handler = findHandler('add_modal_option');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: { type: 'shortcut' },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });

    it('should ignore non-block_actions for remove option', async () => {
      const handler = findHandler('remove_modal_option');
      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        body: { type: 'view_closed' },
        client: mockSlackClient,
      };

      await handler!(payload);

      expect(mockSlackClient.views.update).not.toHaveBeenCalled();
    });
  });

  describe('repostAction', () => {
    beforeEach(() => {
      registerRepostAction(mockApp);
      registerRepostSubmission(mockApp);
    });

    it('should register repost action', () => {
      expect(mockApp.action).toHaveBeenCalledWith(/^repost_poll_.+$/, expect.any(Function));
    });

    it('should open repost modal', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        question: 'Test?',
        channelId: 'C456',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('repost_poll_poll-123');
      const payload = createActionPayload('repost_poll_poll-123', 'poll-123');

      await handler!(payload);

      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.objectContaining({
          type: 'modal',
          callback_id: 'repost_poll_modal',
        }),
      });
    });

    it('should handle repost submission', async () => {
      const newPoll = createTestPoll({
        id: 'new-poll',
        question: 'Reposted?',
      });

      jest.spyOn(pollService, 'repostPoll').mockResolvedValue(newPoll as any);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(newPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'repost_poll_modal'
      )?.[1];

      expect(viewHandler).toBeDefined();

      const payload = {
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
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(pollService.repostPoll).toHaveBeenCalledWith('poll-123', 'U123', { channelId: 'C789' });
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C789',
        })
      );
    });

    it('should validate channel selection', async () => {
      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'repost_poll_modal'
      )?.[1];

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              repost_channel_block: {
                repost_channel_select: { selected_conversation: undefined },
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
        errors: { repost_channel_block: 'Please select a channel.' },
      });
    });

    it('should rethrow non-channel errors', async () => {
      const newPoll = createTestPoll({ id: 'new-poll' });

      jest.spyOn(pollService, 'repostPoll').mockResolvedValue(newPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage.mockRejectedValueOnce(new Error('Server error'));

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'repost_poll_modal'
      )?.[1];

      const payload = {
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
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await expect(viewHandler(payload)).rejects.toThrow('Server error');
    });
  });

  describe('scheduleRepostAction', () => {
    beforeEach(() => {
      registerScheduleRepostAction(mockApp);
      registerScheduleRepostSubmission(mockApp);
    });

    it('should register schedule_repost action', () => {
      expect(mockApp.action).toHaveBeenCalledWith(/^schedule_repost_.+$/, expect.any(Function));
    });

    it('should open schedule repost modal', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        question: 'Test?',
        channelId: 'C456',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const handler = findHandler('schedule_repost_poll-123');
      const payload = createActionPayload('schedule_repost_poll-123', 'poll-123');

      await handler!(payload);

      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.objectContaining({
          type: 'modal',
          callback_id: 'schedule_repost_modal',
        }),
      });
    });

    it('should handle schedule repost submission', async () => {
      const newPoll = createTestPoll({
        id: 'new-poll',
        question: 'Scheduled?',
        status: 'scheduled',
      });

      jest.spyOn(pollService, 'repostPoll').mockResolvedValue(newPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

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
              schedule_repost_close_method_block: {
                schedule_repost_close_method_select: { selected_option: { value: 'manual' } },
              },
            },
          },
        },
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(pollService.repostPoll).toHaveBeenCalledWith('poll-123', 'U123', expect.objectContaining({
        channelId: 'C789',
        scheduledAt: expect.any(Date),
      }));
    });

    it('should validate future schedule time', async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              schedule_repost_datetime_block: {
                schedule_repost_datetime: { selected_date_time: pastTimestamp },
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
        errors: { schedule_repost_datetime_block: 'Schedule time must be in the future.' },
      });
    });

    it('should validate missing schedule datetime', async () => {
      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              schedule_repost_datetime_block: {
                schedule_repost_datetime: { selected_date_time: undefined },
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
        errors: { schedule_repost_datetime_block: 'Please select a date and time.' },
      });
    });

    it('should validate missing channel', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

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
                schedule_repost_channel: { selected_conversation: undefined },
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
        errors: { schedule_repost_channel_block: 'Please select a channel.' },
      });
    });

    it('should validate invalid duration hours', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

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
              schedule_repost_close_method_block: {
                schedule_repost_close_method_select: { selected_option: { value: 'duration' } },
              },
              schedule_repost_duration_block: {
                schedule_repost_duration_input: { value: 'invalid' },
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
        errors: { schedule_repost_duration_block: 'Please enter a valid number of hours.' },
      });
    });

    it('should validate zero duration hours', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

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
              schedule_repost_close_method_block: {
                schedule_repost_close_method_select: { selected_option: { value: 'duration' } },
              },
              schedule_repost_duration_block: {
                schedule_repost_duration_input: { value: '0' },
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
        errors: { schedule_repost_duration_block: 'Please enter a valid number of hours.' },
      });
    });

    it('should calculate closesAt for valid duration', async () => {
      const newPoll = createTestPoll({
        id: 'new-poll',
        status: 'scheduled',
      });

      jest.spyOn(pollService, 'repostPoll').mockResolvedValue(newPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

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
              schedule_repost_close_method_block: {
                schedule_repost_close_method_select: { selected_option: { value: 'duration' } },
              },
              schedule_repost_duration_block: {
                schedule_repost_duration_input: { value: '2' },
              },
            },
          },
        },
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(pollService.repostPoll).toHaveBeenCalledWith('poll-123', 'U123', expect.objectContaining({
        closesAt: expect.any(Date),
      }));
    });

    it('should validate missing close datetime', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600;

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

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
              schedule_repost_close_method_block: {
                schedule_repost_close_method_select: { selected_option: { value: 'datetime' } },
              },
              schedule_repost_datetime_close_block: {
                schedule_repost_datetime_close_input: { selected_date_time: undefined },
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
        errors: { schedule_repost_datetime_close_block: 'Please select a close date and time.' },
      });
    });

    it('should validate close time after schedule time', async () => {
      const futureTimestamp = Math.floor(Date.now() / 1000) + 7200; // 2 hours from now
      const closeBeforeSchedule = futureTimestamp - 3600; // 1 hour before schedule

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_modal'
      )?.[1];

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
              schedule_repost_close_method_block: {
                schedule_repost_close_method_select: { selected_option: { value: 'datetime' } },
              },
              schedule_repost_datetime_close_block: {
                schedule_repost_datetime_close_input: { selected_date_time: closeBeforeSchedule },
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
        errors: { schedule_repost_datetime_close_block: 'Close time must be after the scheduled time.' },
      });
    });

    it('should handle dynamic modal update when close method changes', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        question: 'Test?',
        channelId: 'C123',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      // Register the action handlers
      registerScheduleRepostAction(mockApp);

      const actionHandler = mockApp.action.mock.calls.find(
        (call: any) => call[0] === 'schedule_repost_close_method_select'
      )?.[1];

      expect(actionHandler).toBeDefined();

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        action: {
          type: 'static_select',
          selected_option: { value: 'duration' },
        },
        body: {
          type: 'block_actions',
          view: {
            id: 'view-123',
            private_metadata: 'poll-123',
          },
        },
        client: mockSlackClient,
      };

      await actionHandler(payload);

      expect(payload.ack).toHaveBeenCalled();
      expect(mockSlackClient.views.update).toHaveBeenCalled();
    });
  });

  describe('shareResultsAction', () => {
    beforeEach(() => {
      registerShareResultsAction(mockApp);
      registerShareResultsSubmission(mockApp);
    });

    it('should register share_results action', () => {
      expect(mockApp.action).toHaveBeenCalledWith('share_results', expect.any(Function));
    });

    it('should open share results modal', async () => {
      const handler = findHandler('share_results');
      const payload = createActionPayload('share_results', 'poll-123');

      await handler!(payload);

      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.objectContaining({
          type: 'modal',
          callback_id: 'share_results_modal',
        }),
      });
    });

    it('should handle share results submission', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        question: 'Test?',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: 'Results' } },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                action_id: 'share_results',
                text: { type: 'plain_text', text: 'Share' },
              },
            ],
          },
        ],
        text: 'Results',
      });

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'share_results_modal'
      )?.[1];

      const payload = {
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
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C789',
        })
      );
    });

    it('should validate channel selection', async () => {
      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'share_results_modal'
      )?.[1];

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              share_channel_block: {
                share_channel_select: { selected_conversation: undefined },
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
        errors: { share_channel_block: 'Please select a channel.' },
      });
    });

    it('should handle poll not found after submission', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'share_results_modal'
      )?.[1];

      const payload = {
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
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123',
        text: expect.stringContaining('Could not find the poll'),
      });
    });

    it('should rethrow non-channel errors', async () => {
      const poll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(voteService, 'getVotersByOption').mockResolvedValue(new Map());
      jest.spyOn(resultsDM, 'buildResultsDMBlocks').mockReturnValue({
        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Results' } }],
        text: 'Results',
      });

      mockSlackClient.chat.postMessage.mockRejectedValueOnce(new Error('Server error'));

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'share_results_modal'
      )?.[1];

      const payload = {
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
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await expect(viewHandler(payload)).rejects.toThrow('Server error');
    });
  });

  describe('templateActions', () => {
    beforeEach(() => {
      registerTemplateActions(mockApp);
      registerSaveTemplateSubmission(mockApp);
    });

    it('should register template actions', () => {
      expect(mockApp.action).toHaveBeenCalledWith('save_as_template', expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith(/^use_template_.+$/, expect.any(Function));
      expect(mockApp.action).toHaveBeenCalledWith(/^delete_template_.+$/, expect.any(Function));
    });

    it('should open save template modal', async () => {
      const handler = findHandler('save_as_template');
      const payload = createActionPayload('save_as_template', 'poll-123');

      await handler!(payload);

      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.objectContaining({
          type: 'modal',
          callback_id: 'save_template_modal',
        }),
      });
    });

    it('should open poll creation modal with template data', async () => {
      const template = {
        id: 'tmpl-1',
        userId: 'U123',
        name: 'Test Template',
        config: {
          pollType: 'single_choice',
          options: ['A', 'B', 'C'],
          description: 'Test description',
          settings: {
            anonymous: true,
            allowVoteChange: true,
            liveResults: true,
          },
          closeMethod: 'manual',
        },
        createdAt: new Date(),
      };

      jest.spyOn(templateService, 'getTemplate').mockResolvedValue(template as any);
      jest.spyOn(pollCreationModal, 'buildPollCreationModal').mockReturnValue({ type: 'modal' } as any);

      const handler = findHandler('use_template_tmpl-1');
      const payload = createActionPayload('use_template_tmpl-1', 'tmpl-1');

      await handler!(payload);

      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.any(Object),
      });
    });

    it('should delete template', async () => {
      jest.spyOn(templateService, 'deleteTemplate').mockResolvedValue(true);

      const handler = findHandler('delete_template_tmpl-1');
      const payload = createActionPayload('delete_template_tmpl-1', 'tmpl-1');

      await handler!(payload);

      expect(templateService.deleteTemplate).toHaveBeenCalledWith('tmpl-1', 'U123');
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Template deleted'),
      });
    });

    it('should handle save template submission', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        question: 'Test?',
        pollType: 'multi_select',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(templateService, 'saveTemplate').mockResolvedValue({} as any);

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'save_template_modal'
      )?.[1];

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              template_name_block: {
                template_name_input: { value: 'My Template' },
              },
            },
          },
        },
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(templateService.saveTemplate).toHaveBeenCalledWith(
        'U123',
        'My Template',
        expect.objectContaining({
          pollType: 'multi_select',
        })
      );
    });

    it('should validate template name', async () => {
      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'save_template_modal'
      )?.[1];

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              template_name_block: {
                template_name_input: { value: '  ' },
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
        errors: { template_name_block: 'Please enter a template name.' },
      });
    });

    it('should handle poll not found when saving template', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const viewHandler = mockApp.view.mock.calls.find(
        (call: any) => call[0] === 'save_template_modal'
      )?.[1];

      const payload = {
        ack: jest.fn().mockResolvedValue(undefined),
        view: {
          private_metadata: 'poll-123',
          state: {
            values: {
              template_name_block: {
                template_name_input: { value: 'My Template' },
              },
            },
          },
        },
        body: { user: { id: 'U123' } },
        client: mockSlackClient,
      };

      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123',
        text: expect.stringContaining('Could not find the poll'),
      });
    });
  });
});

