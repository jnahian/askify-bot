/**
 * Tests for the actions registration entry point
 * Verifies registerActions wires every handler module onto the app
 */

import '../mocks/prisma';
import { registerActions } from '../../src/actions';

describe('registerActions', () => {
  let mockApp: any;

  beforeEach(() => {
    mockApp = {
      action: jest.fn(),
      view: jest.fn(),
    };
  });

  it('should register all action handlers', () => {
    registerActions(mockApp);

    const registeredIds = mockApp.action.mock.calls.map((call: any[]) => String(call[0]));

    // Static action IDs
    expect(registeredIds).toContain('close_poll');
    expect(registeredIds).toContain('add_option');
    expect(registeredIds).toContain('save_as_template');
    expect(registeredIds).toContain('share_results');
    expect(registeredIds).toContain('schedule_repost_close_method_select');

    // Modal select actions
    expect(registeredIds).toContain('poll_type_select');
    expect(registeredIds).toContain('close_method_select');
    expect(registeredIds).toContain('schedule_method_select');
    expect(registeredIds).toContain('add_modal_option');
    expect(registeredIds).toContain('remove_modal_option');

    // Regex-matched patterns
    expect(registeredIds).toContain(String(/^vote_.+$/));
    expect(registeredIds).toContain(String(/^use_template_.+$/));
    expect(registeredIds).toContain(String(/^delete_template_.+$/));
    expect(registeredIds).toContain(String(/^list_close_.+$/));
    expect(registeredIds).toContain(String(/^list_cancel_.+$/));
    expect(registeredIds).toContain(String(/^list_results_.+$/));
    expect(registeredIds).toContain(String(/^edit_scheduled_.+$/));
    expect(registeredIds).toContain(String(/^repost_poll_.+$/));
    expect(registeredIds).toContain(String(/^schedule_repost_.+$/));
  });

  it('should register every handler with a function', () => {
    registerActions(mockApp);

    for (const call of mockApp.action.mock.calls) {
      expect(typeof call[1]).toBe('function');
    }
  });
});
