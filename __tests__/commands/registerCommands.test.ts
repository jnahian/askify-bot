/**
 * Tests for commands index registration
 * Verifies registerCommands wires up the /askify command
 */

import { registerCommands } from '../../src/commands';

// Keep the Prisma client out of module loading — the command handler pulls in
// services which import the shared Prisma singleton.
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {},
}));

describe('registerCommands', () => {
  it('should register the /askify command handler', () => {
    const mockApp = { command: jest.fn() } as any;

    registerCommands(mockApp);

    expect(mockApp.command).toHaveBeenCalledTimes(1);
    expect(mockApp.command).toHaveBeenCalledWith('/askify', expect.any(Function));
  });
});
