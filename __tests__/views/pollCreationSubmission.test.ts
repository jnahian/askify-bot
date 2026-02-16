/**
 * Tests for poll creation modal submission
 * Covers validation and poll creation flow
 */

import { registerPollCreationSubmission } from '../../src/views/pollCreationSubmission';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as pollMessage from '../../src/blocks/pollMessage';
import * as creatorNotifyDM from '../../src/blocks/creatorNotifyDM';

// Mock dependencies
jest.mock('../../src/services/pollService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/blocks/creatorNotifyDM');

describe('poll creation submission', () => {
  let mockApp: any;
  let mockAck: jest.Mock;
  let viewHandler: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAck = jest.fn().mockResolvedValue(undefined);

    mockApp = {
      view: jest.fn((callbackId: string, handler: Function) => {
        if (callbackId === 'poll_creation_modal') {
          viewHandler = handler;
        }
      }),
    };

    registerPollCreationSubmission(mockApp);
  });

  const createSubmissionPayload = (state: any, userId: string = 'U123') => ({
    ack: mockAck,
    view: {
      state: { values: state },
    },
    body: {
      user: { id: userId },
    },
    client: mockSlackClient,
  });

  describe('registration', () => {
    it('should register poll_creation_modal view handler', () => {
      expect(mockApp.view).toHaveBeenCalledWith('poll_creation_modal', expect.any(Function));
    });
  });

  describe('validation', () => {
    it('should reject when question is missing', async () => {
      const state = {
        question_block: { question_input: { value: '  ' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          question_block: 'Please enter a poll question.',
        }),
      });
    });

    it('should reject when poll type is missing', async () => {
      const state = {
        question_block: { question_input: { value: 'Question?' } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          poll_type_block: 'Please select a poll type.',
        }),
      });
    });

    it('should reject when channel is missing', async () => {
      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          channel_block: 'Please select a channel.',
        }),
      });
    });

    it('should reject single_choice poll with less than 2 options', async () => {
      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        option_block_0: { option_input_0: { value: 'Only One' } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          option_block_0: 'Please provide at least 2 options.',
        }),
      });
    });

    it('should reject invalid duration hours', async () => {
      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'duration' } } },
        duration_block: { duration_input: { value: 'invalid' } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          duration_block: 'Please enter a valid number of hours.',
        }),
      });
    });
  });

  describe('successful creation', () => {
    it('should create basic single choice poll', async () => {
      const poll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Favorite Color?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        option_block_0: { option_input_0: { value: 'Red' } },
        option_block_1: { option_input_1: { value: 'Blue' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state, 'U123');

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(pollService.createPoll).toHaveBeenCalledWith({
        creatorId: 'U123',
        channelId: 'C123',
        question: 'Favorite Color?',
        pollType: 'single_choice',
        options: ['Red', 'Blue'],
        settings: expect.any(Object),
        closesAt: null,
        scheduledAt: null,
        status: 'active',
      });
    });

    it('should extract all options for single choice poll', async () => {
      const poll = createTestPoll();

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Q?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'single_choice' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        option_block_0: { option_input_0: { value: 'A' } },
        option_block_1: { option_input_1: { value: 'B' } },
        option_block_2: { option_input_2: { value: 'C' } },
        option_block_3: { option_input_3: { value: '' } }, // Empty should be skipped
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          options: ['A', 'B', 'C'],
        })
      );
    });

    it('should extract settings from checkboxes', async () => {
      const poll = createTestPoll();

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Q?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: {
          settings_checkboxes: {
            selected_options: [
              { value: 'anonymous' },
              { value: 'vote_change' },
              { value: 'live_results' },
            ],
          },
        },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            anonymous: true,
            allowVoteChange: true,
            liveResults: true,
          }),
        })
      );
    });

    it('should create yes/no poll without requiring options', async () => {
      const poll = createTestPoll({ pollType: 'yes_no' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Approve?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          pollType: 'yes_no',
          options: ['Yes', 'No'], // Maybe is excluded by default unless includeMaybe checkbox is selected
        })
      );
    });

    it('should create rating poll with specified scale', async () => {
      const poll = createTestPoll({ pollType: 'rating' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Rate our service' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'rating' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        rating_scale_block: { rating_scale_select: { selected_option: { value: '10' } } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          pollType: 'rating',
          options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          settings: expect.objectContaining({
            ratingScale: 10,
          }),
        })
      );
    });

    it('should post poll message to channel', async () => {
      const poll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [{ type: 'section' }],
        text: 'Poll Question',
      });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Q?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C456' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'C456',
        blocks: [{ type: 'section' }],
        text: 'Poll Question',
      });
    });

    it('should send DM notification to creator', async () => {
      const poll = createTestPoll();

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({
        blocks: [{ type: 'section' }],
        text: 'Your poll is live!',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Q?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state, 'U789');

      await viewHandler(payload);

      // Should DM the creator
      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'U789',
        blocks: [{ type: 'section' }],
        text: 'Your poll is live!',
      });
    });
  });

  describe('additional validation edge cases', () => {
    it('should validate missing close datetime', async () => {
      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'datetime' } } },
        datetime_block: { datetime_input: { selected_date_time: undefined } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          datetime_block: 'Please select a close date and time.',
        }),
      });
    });

    it('should validate past close datetime', async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'datetime' } } },
        datetime_block: { datetime_input: { selected_date_time: pastTimestamp } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          datetime_block: 'Close time must be in the future.',
        }),
      });
    });

    it('should validate missing schedule datetime', async () => {
      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: undefined } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          schedule_datetime_block: 'Please select a schedule date and time.',
        }),
      });
    });

    it('should validate past schedule datetime', async () => {
      const pastTimestamp = Math.floor(Date.now() / 1000) - 3600;

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: pastTimestamp } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(mockAck).toHaveBeenCalledWith({
        response_action: 'errors',
        errors: expect.objectContaining({
          schedule_datetime_block: 'Schedule time must be in the future.',
        }),
      });
    });

    it('should handle channel not found error', async () => {
      const poll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });

      mockSlackClient.chat.postMessage.mockRejectedValueOnce({
        data: { error: 'not_in_channel' },
      });

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C999' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state, 'U789');

      await viewHandler(payload);

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'U789',
          text: expect.stringContaining('<#C999>'),
        })
      );
    });

    it('should include description in settings when provided', async () => {
      const poll = createTestPoll({ id: 'poll-123' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({ blocks: [], text: 'Poll' });
      jest.spyOn(creatorNotifyDM, 'buildCreatorNotifyDM').mockReturnValue({ blocks: [], text: 'Notify' });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        description_block: { description_input: { value: 'This is a description' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            description: 'This is a description',
          }),
        })
      );
    });

    it('should adjust closesAt relative to scheduledAt for duration close', async () => {
      const poll = createTestPoll({ id: 'poll-123', status: 'scheduled' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);

      const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // 24 hours from now

      const state = {
        question_block: { question_input: { value: 'Question?' } },
        poll_type_block: { poll_type_select: { selected_option: { value: 'yes_no' } } },
        channel_block: { channel_select: { selected_conversation: 'C123' } },
        close_method_block: { close_method_select: { selected_option: { value: 'duration' } } },
        duration_block: { duration_input: { value: '2' } },
        schedule_method_block: { schedule_method_select: { selected_option: { value: 'scheduled' } } },
        schedule_datetime_block: { schedule_datetime_input: { selected_date_time: futureTimestamp } },
        settings_block: { settings_checkboxes: { selected_options: [] } },
      };

      const payload = createSubmissionPayload(state);

      await viewHandler(payload);

      const createCall = (pollService.createPoll as jest.Mock).mock.calls[0][0];
      expect(createCall.closesAt).toBeInstanceOf(Date);
      // Should be scheduledAt + 2 hours
      expect(createCall.closesAt.getTime()).toBeGreaterThan(futureTimestamp * 1000);
    });
  });
});
