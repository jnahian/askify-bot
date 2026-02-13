/**
 * Mock Prisma Client for testing
 * Provides a jest-mocked Prisma client with common operations
 */

export const mockPrismaClient: any = {
  poll: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  pollOption: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  vote: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  pollTemplate: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $transaction: jest.fn((fn: any) => fn(mockPrismaClient)),
};

/**
 * Reset all Prisma mock functions
 */
export function resetPrismaMocks() {
  Object.values(mockPrismaClient).forEach((model: any) => {
    if (typeof model === 'object' && model !== null) {
      Object.values(model).forEach((fn: any) => {
        if (typeof fn === 'function' && typeof fn.mockClear === 'function') {
          fn.mockClear();
        }
      });
    }
  });
}

// Mock the prisma module
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: mockPrismaClient,
}));
