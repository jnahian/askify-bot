/**
 * Tests for views index registration
 * Verifies registerViews wires up all modal submission handlers
 */

import { registerViews } from '../../src/views';

// Keep the Prisma client out of module loading — the view handlers pull in
// services which import the shared Prisma singleton.
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));

describe('registerViews', () => {
  it('should register all modal submission handlers', () => {
    const mockApp = { view: jest.fn() } as any;

    registerViews(mockApp);

    const registeredCallbackIds = mockApp.view.mock.calls.map((call: any[]) => call[0]);

    expect(registeredCallbackIds).toEqual(
      expect.arrayContaining([
        'poll_creation_modal',
        'poll_edit_modal',
        'save_template_modal',
        'add_option_modal',
        'share_results_modal',
        'repost_poll_modal',
        'schedule_repost_modal',
      ])
    );
    expect(mockApp.view).toHaveBeenCalledTimes(7);

    mockApp.view.mock.calls.forEach((call: any[]) => {
      expect(call[1]).toEqual(expect.any(Function));
    });
  });
});
