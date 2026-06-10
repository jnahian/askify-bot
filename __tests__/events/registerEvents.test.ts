/**
 * Tests for events index registration
 * Verifies registerEvents wires up all event handlers
 */

import { registerEvents } from '../../src/events';

// Keep the Prisma client out of module loading
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));

describe('registerEvents', () => {
  it('should register the DM message and App Home handlers', () => {
    const mockApp = { event: jest.fn() } as any;

    registerEvents(mockApp);

    expect(mockApp.event).toHaveBeenCalledTimes(2);
    expect(mockApp.event).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockApp.event).toHaveBeenCalledWith('app_home_opened', expect.any(Function));
  });
});
