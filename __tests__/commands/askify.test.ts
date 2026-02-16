/**
 * Tests for /askify command handler
 * Covers subcommand routing and core functionality
 */

import { registerAskifyCommand } from '../../src/commands/askify';
import { mockSlackClient } from '../mocks/slack';
import { createTestPoll, createTestTemplate } from '../fixtures/testData';
import * as pollService from '../../src/services/pollService';
import * as templateService from '../../src/services/templateService';
import * as pollMessage from '../../src/blocks/pollMessage';

// Mock dependencies
jest.mock('../../src/services/pollService');
jest.mock('../../src/services/templateService');
jest.mock('../../src/blocks/pollMessage');
jest.mock('../../src/views/pollCreationModal', () => ({
  buildPollCreationModal: jest.fn(() => ({ type: 'modal', title: { type: 'plain_text', text: 'Create Poll' } })),
}));

describe('askify command', () => {
  let mockApp: any;
  let mockAck: jest.Mock;
  let commandHandler: Function;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAck = jest.fn().mockResolvedValue(undefined);

    mockApp = {
      command: jest.fn((cmd: string, handler: Function) => {
        if (cmd === '/askify') {
          commandHandler = handler;
        }
      }),
    };

    registerAskifyCommand(mockApp);
  });

  const createCommandPayload = (text: string, userId: string = 'U123', channelId: string = 'C123') => ({
    ack: mockAck,
    command: {
      text,
      user_id: userId,
      channel_id: channelId,
      trigger_id: 'trigger-123',
    },
    client: mockSlackClient,
  });

  describe('registration', () => {
    it('should register /askify command', () => {
      expect(mockApp.command).toHaveBeenCalledWith('/askify', expect.any(Function));
    });
  });

  describe('help subcommand', () => {
    it('should show help message', async () => {
      const payload = createCommandPayload('help');

      await commandHandler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C123',
          user: 'U123',
          text: 'Askify Help',
          blocks: expect.arrayContaining([
            expect.objectContaining({ type: 'header' }),
          ]),
        })
      );
    });

    it('should include all command descriptions in help', async () => {
      const payload = createCommandPayload('help');

      await commandHandler(payload);

      const helpCall = mockSlackClient.chat.postEphemeral.mock.calls[0][0];
      const helpText = JSON.stringify(helpCall.blocks);

      expect(helpText).toContain('/askify poll');
      expect(helpText).toContain('/askify list');
      expect(helpText).toContain('/askify templates');
      expect(helpText).toContain('/askify help');
    });

    it('should include poll types in help', async () => {
      const payload = createCommandPayload('help');

      await commandHandler(payload);

      const helpCall = mockSlackClient.chat.postEphemeral.mock.calls[0][0];
      const helpText = JSON.stringify(helpCall.blocks);

      expect(helpText).toContain('Single Choice');
      expect(helpText).toContain('Multi-Select');
      expect(helpText).toContain('Yes / No / Maybe');
      expect(helpText).toContain('Rating Scale');
    });
  });

  describe('list subcommand', () => {
    it('should show empty message when no polls', async () => {
      jest.spyOn(pollService, 'getUserPolls').mockResolvedValue([]);

      const payload = createCommandPayload('list', 'U123');

      await commandHandler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: "You don't have any polls.",
      });
    });

    it('should list user polls with default limit', async () => {
      const polls = [
        createTestPoll({ id: 'poll-1', question: 'Poll 1?', _count: { votes: 5 } }),
        createTestPoll({ id: 'poll-2', question: 'Poll 2?', _count: { votes: 3 } }),
      ];

      jest.spyOn(pollService, 'getUserPolls').mockResolvedValue(polls);

      const payload = createCommandPayload('list', 'U123');

      await commandHandler(payload);

      expect(pollService.getUserPolls).toHaveBeenCalledWith('U123', {});
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C123',
          user: 'U123',
          blocks: expect.any(Array),
        })
      );
    });

    it('should parse relative date filter (7d)', async () => {
      jest.spyOn(pollService, 'getUserPolls').mockResolvedValue([]);

      const payload = createCommandPayload('list 7d', 'U123');

      await commandHandler(payload);

      expect(pollService.getUserPolls).toHaveBeenCalledWith('U123', {
        from: expect.any(Date),
      });
    });

    it('should parse absolute date range filter', async () => {
      jest.spyOn(pollService, 'getUserPolls').mockResolvedValue([]);

      const payload = createCommandPayload('list 2025-01-01 2025-01-31', 'U123');

      await commandHandler(payload);

      expect(pollService.getUserPolls).toHaveBeenCalledWith('U123', {
        from: expect.any(Date),
        to: expect.any(Date),
      });
    });

    it('should show error for invalid date range', async () => {
      const payload = createCommandPayload('list invalid', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Invalid filter'),
      });
    });

    it('should show error for invalid day count (0 days)', async () => {
      const payload = createCommandPayload('list 0d', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('day range between 1 and 365'),
      });
    });

    it('should show error for invalid day count (over 365)', async () => {
      const payload = createCommandPayload('list 500d', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('day range between 1 and 365'),
      });
    });

    it('should show error for invalid date format', async () => {
      const payload = createCommandPayload('list 2025-13-01 2025-01-31', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Invalid date format'),
      });
    });

    it('should show error when start date is after end date', async () => {
      const payload = createCommandPayload('list 2025-01-31 2025-01-01', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Start date must be before end date'),
      });
    });

    it('should include action buttons for active polls', async () => {
      const polls = [
        createTestPoll({
          id: 'poll-1',
          status: 'active',
          messageTs: '1234567890.123456',
        }),
      ];

      jest.spyOn(pollService, 'getUserPolls').mockResolvedValue(polls);

      const payload = createCommandPayload('list', 'U123');

      await commandHandler(payload);

      const ephemeralCall = mockSlackClient.chat.postEphemeral.mock.calls[0][0];
      const blocksText = JSON.stringify(ephemeralCall.blocks);

      expect(blocksText).toContain('list_results');
      expect(blocksText).toContain('list_close');
    });

    it('should include repost buttons for closed polls', async () => {
      const polls = [
        createTestPoll({
          id: 'poll-1',
          status: 'closed',
        }),
      ];

      jest.spyOn(pollService, 'getUserPolls').mockResolvedValue(polls);

      const payload = createCommandPayload('list', 'U123');

      await commandHandler(payload);

      const ephemeralCall = mockSlackClient.chat.postEphemeral.mock.calls[0][0];
      const blocksText = JSON.stringify(ephemeralCall.blocks);

      expect(blocksText).toContain('repost_poll');
      expect(blocksText).toContain('schedule_repost');
    });
  });

  describe('templates subcommand', () => {
    it('should show empty message when no templates', async () => {
      jest.spyOn(templateService, 'getTemplates').mockResolvedValue([]);

      const payload = createCommandPayload('templates', 'U123');

      await commandHandler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: "You don't have any saved templates. Create a poll and save it as a template!",
      });
    });

    it('should list user templates', async () => {
      const templates = [
        {
          id: 'tmpl-1',
          userId: 'U123',
          name: 'Team Standup',
          config: {
            pollType: 'single_choice',
            options: ['Task A', 'Task B'],
            settings: { anonymous: false, allowVoteChange: true, liveResults: true },
            closeMethod: 'manual',
          },
          createdAt: new Date(),
        },
        {
          id: 'tmpl-2',
          userId: 'U123',
          name: 'Lunch Poll',
          config: {
            pollType: 'multi_select',
            options: ['Pizza', 'Sushi'],
            settings: { anonymous: false, allowVoteChange: true, liveResults: true },
            closeMethod: 'manual',
          },
          createdAt: new Date(),
        },
      ];

      jest.spyOn(templateService, 'getTemplates').mockResolvedValue(templates as any);

      const payload = createCommandPayload('templates', 'U123');

      await commandHandler(payload);

      expect(templateService.getTemplates).toHaveBeenCalledWith('U123');
      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'C123',
          user: 'U123',
          blocks: expect.any(Array),
        })
      );
    });

    it('should include use and delete buttons for templates', async () => {
      const templates = [
        {
          id: 'tmpl-1',
          userId: 'U123',
          name: 'Test Template',
          config: {
            pollType: 'yes_no',
            options: ['Yes', 'No', 'Maybe'],
            settings: { anonymous: false, allowVoteChange: true, liveResults: true },
            closeMethod: 'manual',
          },
          createdAt: new Date(),
        },
      ];

      jest.spyOn(templateService, 'getTemplates').mockResolvedValue(templates as any);

      const payload = createCommandPayload('templates', 'U123');

      await commandHandler(payload);

      const ephemeralCall = mockSlackClient.chat.postEphemeral.mock.calls[0][0];
      const blocksText = JSON.stringify(ephemeralCall.blocks);

      expect(blocksText).toContain('use_template_tmpl-1');
      expect(blocksText).toContain('delete_template_tmpl-1');
    });
  });

  describe('poll subcommand (inline)', () => {
    it('should show usage when no arguments', async () => {
      const payload = createCommandPayload('poll', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Inline Poll Usage'),
      });
    });

    it('should create inline poll with question and options', async () => {
      const poll = createTestPoll({
        id: 'poll-123',
        question: 'Lunch?',
        pollType: 'single_choice',
      });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(poll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const payload = createCommandPayload('poll "Lunch?" "Pizza" "Sushi"', 'U123', 'C123');

      await commandHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          creatorId: 'U123',
          channelId: 'C123',
          question: 'Lunch?',
          pollType: 'single_choice',
          options: ['Pizza', 'Sushi'],
        })
      );
    });

    it('should support --multi flag', async () => {
      const poll = createTestPoll({ pollType: 'multi_select' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(poll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const payload = createCommandPayload('poll "Question?" "A" "B" --multi', 'U123', 'C123');

      await commandHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          pollType: 'multi_select',
        })
      );
    });

    it('should support --yesno flag', async () => {
      const poll = createTestPoll({ pollType: 'yes_no' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(poll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const payload = createCommandPayload('poll "Go ahead?" --yesno', 'U123', 'C123');

      await commandHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          pollType: 'yes_no',
          options: ['Yes', 'No', 'Maybe'],
        })
      );
    });

    it('should support --anon flag', async () => {
      const poll = createTestPoll();

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(poll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const payload = createCommandPayload('poll "Q?" "A" "B" --anon', 'U123', 'C123');

      await commandHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            anonymous: true,
          }),
        })
      );
    });

    it('should support --close flag with duration', async () => {
      const poll = createTestPoll();

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(poll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const payload = createCommandPayload('poll "Q?" "A" "B" --close 2h', 'U123', 'C123');

      await commandHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          closesAt: expect.any(Date),
        })
      );
    });

    it('should show error for missing question', async () => {
      const payload = createCommandPayload('poll --multi', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Please provide a question in quotes'),
      });
    });

    it('should show error for insufficient options', async () => {
      const payload = createCommandPayload('poll "Question?" "Only One"', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('at least 2 options'),
      });
    });

    it('should show error for too many options', async () => {
      const manyOptions = Array.from({ length: 11 }, (_, i) => `"Option ${i + 1}"`).join(' ');
      const payload = createCommandPayload(`poll "Question?" ${manyOptions}`, 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.chat.postEphemeral).toHaveBeenCalledWith({
        channel: 'C123',
        user: 'U123',
        text: expect.stringContaining('Maximum 10 options'),
      });
    });

    it('should support --rating flag with custom scale', async () => {
      const poll = createTestPoll({ pollType: 'rating' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(poll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const payload = createCommandPayload('poll "Rate us" --rating 10', 'U123', 'C123');

      await commandHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          pollType: 'rating',
          settings: expect.objectContaining({
            ratingScale: 10,
          }),
        })
      );
    });

    it('should default to scale 5 for --rating without number', async () => {
      const poll = createTestPoll({ pollType: 'rating' });

      jest.spyOn(pollService, 'createPoll').mockResolvedValue(poll);
      jest.spyOn(pollService, 'updatePollMessageTs').mockResolvedValue(poll as any);
      jest.spyOn(pollMessage, 'buildPollMessage').mockReturnValue({
        blocks: [],
        text: 'Poll',
      });

      mockSlackClient.chat.postMessage.mockResolvedValue({ ts: '1234567890.123456' });

      const payload = createCommandPayload('poll "Rate us" --rating', 'U123', 'C123');

      await commandHandler(payload);

      expect(pollService.createPoll).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            ratingScale: 5,
          }),
        })
      );
    });
  });

  describe('default (no subcommand)', () => {
    it('should open poll creation modal', async () => {
      const payload = createCommandPayload('', 'U123');

      await commandHandler(payload);

      expect(mockAck).toHaveBeenCalled();
      expect(mockSlackClient.views.open).toHaveBeenCalledWith({
        trigger_id: 'trigger-123',
        view: expect.objectContaining({
          type: 'modal',
        }),
      });
    });

    it('should open modal for unrecognized subcommand', async () => {
      const payload = createCommandPayload('unknown', 'U123');

      await commandHandler(payload);

      expect(mockSlackClient.views.open).toHaveBeenCalled();
    });
  });
});
