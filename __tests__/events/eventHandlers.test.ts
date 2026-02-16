/**
 * Tests for event handlers
 * Covers DM messages and App Home tab
 */

import { registerDMHandler } from '../../src/events/dmHandler';
import { registerAppHomeHandler } from '../../src/events/appHomeHandler';
import { mockSlackClient } from '../mocks/slack';

describe('event handlers', () => {
  let mockApp: any;
  let eventHandlers: Map<string, Function>;

  beforeEach(() => {
    jest.clearAllMocks();
    eventHandlers = new Map();

    mockApp = {
      event: jest.fn((eventType: string, handler: Function) => {
        eventHandlers.set(eventType, handler);
      }),
    };
  });

  describe('DM handler', () => {
    beforeEach(() => {
      registerDMHandler(mockApp);
    });

    it('should register message event', () => {
      expect(mockApp.event).toHaveBeenCalledWith('message', expect.any(Function));
    });

    it('should ignore non-DM messages', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'C123',
        channel_type: 'channel',
        user: 'U123',
        text: 'hello',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).not.toHaveBeenCalled();
    });

    it('should respond with default message when text is missing', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('/askify'),
      });
    });

    it('should respond to "hi" greeting', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'hi',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('Hey there!'),
      });
    });

    it('should respond to "hello" greeting', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'hello',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('Hey there!'),
      });
    });

    it('should respond to "hey" greeting', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'hey',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('Hey there!'),
      });
    });

    it('should respond to "sup" greeting', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'sup',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('Hey there!'),
      });
    });

    it('should respond to "yo" greeting', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'yo',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('Hey there!'),
      });
    });

    it('should respond to case-insensitive greetings', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'HELLO',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('Hey there!'),
      });
    });

    it('should respond to help request', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'help',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('/askify'),
      });
    });

    it('should include slash command in help response', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'help',
      };

      await handler!({ event, client: mockSlackClient });

      const callArg = mockSlackClient.chat.postMessage.mock.calls[0][0];
      expect(callArg.text).toContain('/askify');
    });

    it('should respond with default message for unrecognized text', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'random message',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.chat.postMessage).toHaveBeenCalledWith({
        channel: 'D123',
        text: expect.stringContaining('/askify'),
      });
    });

    it('should include usage info in default response', async () => {
      const handler = eventHandlers.get('message');
      const event = {
        type: 'message',
        channel: 'D123',
        channel_type: 'im',
        user: 'U123',
        text: 'anything else',
      };

      await handler!({ event, client: mockSlackClient });

      const callArg = mockSlackClient.chat.postMessage.mock.calls[0][0];
      expect(callArg.text).toContain('help teams make decisions with polls');
    });
  });

  describe('App Home handler', () => {
    beforeEach(() => {
      registerAppHomeHandler(mockApp);
    });

    it('should register app_home_opened event', () => {
      expect(mockApp.event).toHaveBeenCalledWith('app_home_opened', expect.any(Function));
    });

    it('should publish home view when home tab is opened', async () => {
      const handler = eventHandlers.get('app_home_opened');
      const event = {
        type: 'app_home_opened',
        user: 'U123',
        tab: 'home',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.views.publish).toHaveBeenCalledWith({
        user_id: 'U123',
        view: {
          type: 'home',
          blocks: expect.any(Array),
        },
      });
    });

    it('should not publish when messages tab is opened', async () => {
      const handler = eventHandlers.get('app_home_opened');
      const event = {
        type: 'app_home_opened',
        user: 'U123',
        tab: 'messages',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.views.publish).not.toHaveBeenCalled();
    });

    it('should not publish when about tab is opened', async () => {
      const handler = eventHandlers.get('app_home_opened');
      const event = {
        type: 'app_home_opened',
        user: 'U123',
        tab: 'about',
      };

      await handler!({ event, client: mockSlackClient });

      expect(mockSlackClient.views.publish).not.toHaveBeenCalled();
    });
  });

  describe('home view content', () => {
    beforeEach(() => {
      registerAppHomeHandler(mockApp);
    });

    it('should publish view with blocks array', async () => {
      const handler = eventHandlers.get('app_home_opened');
      const event = {
        type: 'app_home_opened',
        user: 'U123',
        tab: 'home',
      };

      await handler!({ event, client: mockSlackClient });

      const callArg = mockSlackClient.views.publish.mock.calls[0][0];
      expect(Array.isArray(callArg.view.blocks)).toBe(true);
      expect(callArg.view.blocks.length).toBeGreaterThan(0);
    });

    it('should include welcome message in blocks', async () => {
      const handler = eventHandlers.get('app_home_opened');
      const event = {
        type: 'app_home_opened',
        user: 'U123',
        tab: 'home',
      };

      await handler!({ event, client: mockSlackClient });

      const callArg = mockSlackClient.views.publish.mock.calls[0][0];
      const blocksText = JSON.stringify(callArg.view.blocks);

      expect(blocksText).toContain('Askify — Slack Poll Bot');
    });

    it('should include command examples in blocks', async () => {
      const handler = eventHandlers.get('app_home_opened');
      const event = {
        type: 'app_home_opened',
        user: 'U123',
        tab: 'home',
      };

      await handler!({ event, client: mockSlackClient });

      const callArg = mockSlackClient.views.publish.mock.calls[0][0];
      const blocksText = JSON.stringify(callArg.view.blocks);

      expect(blocksText).toContain('/askify');
    });

    it('should include poll type descriptions in blocks', async () => {
      const handler = eventHandlers.get('app_home_opened');
      const event = {
        type: 'app_home_opened',
        user: 'U123',
        tab: 'home',
      };

      await handler!({ event, client: mockSlackClient });

      const callArg = mockSlackClient.views.publish.mock.calls[0][0];
      const blocksText = JSON.stringify(callArg.view.blocks);

      expect(blocksText).toContain('Single Choice');
      expect(blocksText).toContain('Multi-Select');
    });
  });
});
