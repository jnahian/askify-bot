/**
 * Tests for request logger middleware
 * Covers logging of commands, actions, views, and events
 */

import { registerRequestLogger } from '../../src/middleware/requestLogger';

describe('requestLogger', () => {
  let mockApp: any;
  let middlewareHandler: Function;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockApp = {
      use: jest.fn((handler: Function) => {
        middlewareHandler = handler;
      }),
    };

    registerRequestLogger(mockApp);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('registration', () => {
    it('should register middleware', () => {
      expect(mockApp.use).toHaveBeenCalledWith(expect.any(Function));
    });
  });

  describe('command logging', () => {
    it('should log slash command', async () => {
      const body = {
        command: '/askify',
        text: 'help',
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [command] /askify help');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('<-- [command] /askify help'));
    });

    it('should log command without arguments', async () => {
      const body = {
        command: '/askify',
        text: '',
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [command] /askify');
    });
  });

  describe('action logging', () => {
    it('should log block action', async () => {
      const body = {
        type: 'block_actions',
        actions: [{ action_id: 'vote_option-123' }],
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [action] vote_option-123');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('<-- [action] vote_option-123'));
    });
  });

  describe('view logging', () => {
    it('should log view submission', async () => {
      const body = {
        type: 'view_submission',
        view: { callback_id: 'poll_creation_modal' },
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [view] poll_creation_modal');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('<-- [view] poll_creation_modal'));
    });

    it('should log view closed', async () => {
      const body = {
        type: 'view_closed',
        view: { callback_id: 'poll_creation_modal' },
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [view_closed] poll_creation_modal');
    });

    it('should handle view without callback_id', async () => {
      const body = {
        type: 'view_submission',
        view: {},
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [view] unknown');
    });

    it('should handle view_closed without callback_id', async () => {
      const body = {
        type: 'view_closed',
        view: {},
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [view_closed] unknown');
    });
  });

  describe('event logging', () => {
    it('should log event callback', async () => {
      const body = {
        type: 'event_callback',
        event: { type: 'message' },
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [event] message');
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('<-- [event] message'));
    });

    it('should handle event without type', async () => {
      const body = {
        event: {},
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [event] unknown');
    });
  });

  describe('shortcut logging', () => {
    it('should log shortcut', async () => {
      const body = {
        type: 'shortcut',
        callback_id: 'quick_poll',
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [shortcut] quick_poll');
    });

    it('should log message_action', async () => {
      const body = {
        type: 'message_action',
        callback_id: 'create_poll_from_message',
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [shortcut] create_poll_from_message');
    });

    it('should handle shortcut without callback_id', async () => {
      const body = {
        type: 'shortcut',
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [shortcut] unknown');
    });
  });

  describe('timing', () => {
    it('should log request duration on success', async () => {
      const body = {
        command: '/askify',
        text: 'list',
      };

      const next = jest.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 50))
      );

      await middlewareHandler({ body, next });

      const completionLog = consoleLogSpy.mock.calls.find((call) =>
        call[0].includes('<--')
      );
      expect(completionLog[0]).toMatch(/\(\d+ms\)/);
    });

    it('should log request duration on error', async () => {
      const body = {
        command: '/askify',
      };

      const error = new Error('Test error');
      const next = jest.fn().mockRejectedValue(error);

      await expect(middlewareHandler({ body, next })).rejects.toThrow('Test error');

      const errorLog = consoleErrorSpy.mock.calls.find((call) =>
        call[0].includes('FAILED')
      );
      expect(errorLog[0]).toMatch(/\(\d+ms\)/);
    });
  });

  describe('error handling', () => {
    it('should log error and re-throw', async () => {
      const body = {
        command: '/askify',
      };

      const error = new Error('Handler failed');
      const next = jest.fn().mockRejectedValue(error);

      await expect(middlewareHandler({ body, next })).rejects.toThrow('Handler failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('FAILED'),
        error
      );
    });

    it('should include request type in error log', async () => {
      const body = {
        type: 'block_actions',
        actions: [{ action_id: 'close_poll' }],
      };

      const error = new Error('Action failed');
      const next = jest.fn().mockRejectedValue(error);

      await expect(middlewareHandler({ body, next })).rejects.toThrow('Action failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[action] close_poll'),
        error
      );
    });
  });

  describe('unknown request types', () => {
    it('should handle unknown request type', async () => {
      const body = {
        type: 'unknown_type',
      };

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [unknown_type] ');
    });

    it('should handle body without type', async () => {
      const body = {};

      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(consoleLogSpy).toHaveBeenCalledWith('--> [unknown] ');
    });
  });

  describe('middleware execution', () => {
    it('should call next() to continue middleware chain', async () => {
      const body = { command: '/askify' };
      const next = jest.fn().mockResolvedValue(undefined);

      await middlewareHandler({ body, next });

      expect(next).toHaveBeenCalled();
    });

    it('should await next() before logging completion', async () => {
      const body = { command: '/askify' };
      let nextCompleted = false;

      const next = jest.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        nextCompleted = true;
      });

      await middlewareHandler({ body, next });

      expect(nextCompleted).toBe(true);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('<--'));
    });
  });
});
