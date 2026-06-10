/**
 * Tests for poll edit submission handler
 * Covers validation, updates, and status transitions
 */

import { registerPollEditSubmission } from '../../src/views/pollEditSubmission';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as pollMessage from '../../src/blocks/pollMessage';
import * as creatorNotifyDM from '../../src/blocks/creatorNotifyDM';

// Mock dependencies
jest.mock('../../src/services/pollService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/blocks/creatorNotifyDM');

describe('poll edit submission', () => {
  let mockApp: any;
  let mockAck: jest.Mock;
  let viewHandler: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAck = jest.fn().mockResolvedValue(undefined);

    mockApp = {
      view: jest.fn((callbackId: string, handler: Function) => {
        if (callbackId === 'poll_edit_modal') {
          viewHandler = handler;
        }
      }),
    };

    registerPollEditSubmission(mockApp);
  });

  // Default userId matches the fixture poll's creatorId — the handler rejects
  // submissions from anyone other than the poll creator.
  const createEditPayload = (state: any, pollId: string = 'poll-123', userId: string = 'U123456') => ({
    ack: mockAck,
    view: {
      private_metadata: pollId,
      state: { values: state },
    },
    body: {
      user: { id: userId },
    },
    client: mockSlackClient,
  });

  describe('registration', () => {
    it('should register poll_edit_modal view handler', () => {
      expect(mockApp.view).toHaveBeenCalledWith('poll_edit_modal', expect.any(Function));
    });
  });

  describe('validation', () => {
    it('should reject when poll not found', async () => {
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(null);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          question_block: expect.stringContaining('already been posted'),
        }),
      });
    });

    it('should reject when poll is no longer scheduled', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'active',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          question_block: expect.stringContaining('already been posted'),
        }),
      });
    });

    it('should reject when question is missing', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: '  ' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          question_block: 'Please enter a poll question.',
        }),
      });
    });

    it('should reject when poll type is missing', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          poll_type_block: 'Please select a poll type.',
        }),
      });
    });

    it('should reject when channel is missing', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          channel_block: 'Please select a channel.',
        }),
      });
    });

    it('should reject single_choice with less than 2 options', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        option_block_0: { option_input_0: { value: 'Only One' } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          option_block_0: 'Please provide at least 2 options.',
        }),
      });
    });

    it('should reject invalid duration', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'duration' } } },
        duration_block: { duration_input: { value: 'invalid' } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          duration_block: 'Please enter a valid number of hours.',
        }),
      });
    });

    it('should reject past datetime for close time', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'datetime' } } },
        datetime_block: { datetime_input: { selected_date_time: pastTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          datetime_block: 'Close time must be in the future.',
        }),
      });
    });

    it('should reject past datetime for schedule time', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: pastTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          schedule_datetime_block: 'Schedule time must be in the future.',
        }),
      });
    });
  });

  describe('successful update - remains scheduled', () => {
    it('should update scheduled poll', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'scheduled',
      });

      const updatedPoll = createTestPoll({
        id: 'poll-123',
        question: 'Updated Question?',
        status: 'scheduled',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      const state = {
        question_block: { question_input: { value: 'Updated Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        option_block_0: { option_input_0: { value: 'A' } },
        option_block_1: { option_input_1: { value: 'B' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(pollService.updatePoll).toHaveBeenCalledWith('poll-123', expect.objectContaining({
        question: 'Updated Question?',
        pollType: 'single_choice',
        options: ['A', 'B'],
        status: 'scheduled',
      }));
    });

    it('should send confirmation DM for scheduled poll update', async () => {
      const poll = createTestPoll({ status: 'scheduled', creatorId: 'U789' });
      const updatedPoll = createTestPoll({
        id: 'poll-123',
        question: 'Updated?',
        status: 'scheduled',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      const state = {
        question_block: { question_input: { value: 'Updated?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state, 'poll-123', 'U789');
      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'U789',
          text: expect.stringContaining('has been updated'),
        })
      );
    });
  });

  describe('successful update - change to immediate posting', () => {
    it('should post poll immediately when changed from scheduled to now', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        status: 'scheduled',
        creatorId: 'U789',
      });

      const updatedPoll = createTestPoll({
        id: 'poll-123',
        question: 'Posted Now?',
        status: 'active',
      });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Posted Now?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C456' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'now' } } },
      };

      const payload = createEditPayload(state, 'poll-123', 'U789');
      await viewHandler(payload);

      expect(pollService.updatePoll).toHaveBeenCalledWith('poll-123', expect.objectContaining({
        status: 'active',
        scheduledAt: null,
      }));

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C456',
        })
      );
    });

    it('should store message timestamp after posting', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123', status: 'active' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '9999.9999' });

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'now' } } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(pollService.updatePollMessageTs).toHaveBeenCalledWith('poll-123', '9999.9999');
    });

    it('should send creator notification DM when posted', async () => {
      const poll = createTestPoll({ status: 'scheduled', creatorId: 'U789' });
      const updatedPoll = createTestPoll({ id: 'poll-123', status: 'active' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({
        blocks: [{ type: 'section' }],
        text: 'Your poll is live!',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'now' } } },
      };

      const payload = createEditPayload(state, 'poll-123', 'U789');
      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'U789',
          text: 'Your poll is live!',
        })
      );
    });

    it('should handle channel not found error', async () => {
      const poll = createTestPoll({ status: 'scheduled', creatorId: 'U789' });
      const updatedPoll = createTestPoll({ id: 'poll-123', status: 'active' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage.mockRejectedValueOnce({
        data: { error: 'not_in_channel' },
      });

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C999' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'now' } } },
      };

      const payload = createEditPayload(state, 'poll-123', 'U789');
      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'U789',
          text: expect.stringContaining('<#C999>'),
        })
      );
    });
  });

  describe('poll type specific options', () => {
    it('should handle yes_no poll with Maybe included', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        include_maybe_block: { include_maybe_toggle: { selected_options: [{ value: 'include_maybe' }] } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(pollService.updatePoll).toHaveBeenCalledWith('poll-123', expect.objectContaining({
        pollType: 'yes_no',
        options: ['Yes', 'No', 'Maybe'],
      }));
    });

    it('should handle yes_no poll without Maybe', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        include_maybe_block: { include_maybe_toggle: { selected_options: [] } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(pollService.updatePoll).toHaveBeenCalledWith('poll-123', expect.objectContaining({
        options: ['Yes', 'No'],
      }));
    });

    it('should handle rating poll with scale 10', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      const state = {
        question_block: { question_input: { value: 'Rate us' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'rating' } } },
        rating_scale_block: { rating_scale_select: { selected_option: { value: '10' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(pollService.updatePoll).toHaveBeenCalledWith('poll-123', expect.objectContaining({
        pollType: 'rating',
        options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
        settings: expect.objectContaining({
          ratingScale: 10,
        }),
      }));
    });
  });

  describe('close and schedule options', () => {
    it('should handle duration-based close with immediate posting', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123', status: 'active' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'duration' } } },
        duration_block: { duration_input: { value: '24' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'now' } } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      const updateCall = (pollService.updatePoll as jest.Mock).mock.calls[0][1];
      expect(updateCall.closesAt).toBeInstanceOf(Date);
      expect(updateCall.closesAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should handle duration-based close relative to scheduled time', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123', status: 'scheduled' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);

      const futureTimestamp = Math.floor((Date.now() + 86400000) / 1000);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'duration' } } },
        duration_block: { duration_input: { value: '2' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      const updateCall = (pollService.updatePoll as jest.Mock).mock.calls[0][1];
      expect(updateCall.closesAt).toBeInstanceOf(Date);
      // Should be scheduledAt + 2 hours
      expect(updateCall.closesAt.getTime()).toBeGreaterThan(futureTimestamp * 1000);
    });
  });

  describe('authorization', () => {
    it('should reject edits from anyone other than the poll creator', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'scheduled', creatorId: 'U123456' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      const updateSpy = jest.spyOn(pollService, 'updatePoll');

      const state = {
        question_block: { question_input: { value: 'Hijacked?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
      };

      // Submitted by a different user than the creator
      const payload = createEditPayload(state, 'poll-123', 'U999999');
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: { question_block: 'Only the poll creator can do this.' },
      });
      expect(updateSpy).not.toHaveBeenCalled();
    });
  });

  describe('missing datetime validation', () => {
    it('should reject when close datetime is not selected', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'datetime' } } },
        // datetime_block intentionally missing
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          datetime_block: 'Please select a close date and time.',
        }),
      });
    });

    it('should reject when schedule datetime is not selected', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        // schedule_datetime_block intentionally missing
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          schedule_datetime_block: 'Please select a schedule date and time.',
        }),
      });
    });
  });

  describe('update conflicts and errors', () => {
    it('should DM the creator when the poll was posted while editing', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'scheduled', creatorId: 'U123456' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      // The handler checks `err instanceof PollNotEditableError` against the
      // same (auto-mocked) class it imports, so construct via that class
      const notEditable = new (pollService as any).PollNotEditableError('poll-123');
      jest.spyOn(pollService, 'updatePoll').mockRejectedValue(notEditable);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      const state = {
        question_block: { question_input: { value: 'Too late?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state);

      await expect(viewHandler(payload)).resolves.not.toThrow();

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U123456',
        text: expect.stringContaining('could not be saved'),
      });
    });

    it('should rethrow non-PollNotEditableError update failures', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'scheduled' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockRejectedValue(new Error('db error'));

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'now' } } },
      };

      const payload = createEditPayload(state);

      await expect(viewHandler(payload)).rejects.toThrow('db error');
    });

    it('should rethrow non-channel errors when posting immediately', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123', status: 'active' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage.mockRejectedValueOnce(new Error('API error'));

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'now' } } },
      };

      const payload = createEditPayload(state);

      await expect(viewHandler(payload)).rejects.toThrow('API error');
    });
  });

  describe('settings extraction', () => {
    it('should extract selected settings checkboxes into poll settings', async () => {
      const poll = createTestPoll({ status: 'scheduled' });
      const updatedPoll = createTestPoll({ id: 'poll-123', status: 'scheduled' });

      jest.spyOn(pollService, 'getPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePoll').mockResolvedValue(updatedPoll as any);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400;

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: {
          settings_checkboxes: {
            selected_options: [
              { value: 'anonymous' },
              { value: 'live_results' },
              { value: 'reminders' },
            ],
          },
        },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
      };

      const payload = createEditPayload(state);
      await viewHandler(payload);

      expect(pollService.updatePoll).toHaveBeenCalledWith('poll-123', expect.objectContaining({
        settings: expect.objectContaining({
          anonymous: true,
          liveResults: true,
          reminders: true,
          allowVoteChange: false,
          allowAddingOptions: false,
        }),
      }));
    });
  });
});
