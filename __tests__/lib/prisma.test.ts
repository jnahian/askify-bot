/**
 * Tests for the Prisma client singleton
 *
 * The generated client and pg adapter are mocked, so no real database
 * connection is required — these tests only cover module initialization.
 */

const mockPrismaClientInstance = { $queryRaw: jest.fn() };
const mockPrismaClient = jest.fn(() => mockPrismaClientInstance);
const mockPrismaPgInstance = { name: 'mock-adapter' };
const mockPrismaPg = jest.fn(() => mockPrismaPgInstance);

jest.mock('../../src/generated/prisma/client', () => ({
  PrismaClient: mockPrismaClient,
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: mockPrismaPg,
}));

describe('lib/prisma', () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalDatabaseUrl;
  });

  it('should throw a helpful error when DATABASE_URL is not set', () => {
    delete process.env.DATABASE_URL;

    expect(() => {
      jest.isolateModules(() => {
        require('../../src/lib/prisma');
      });
    }).toThrow('DATABASE_URL environment variable is not set');

    expect(mockPrismaPg).not.toHaveBeenCalled();
    expect(mockPrismaClient).not.toHaveBeenCalled();
  });

  it('should construct the PrismaPg adapter with the connection string', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    jest.isolateModules(() => {
      require('../../src/lib/prisma');
    });

    expect(mockPrismaPg).toHaveBeenCalledWith({
      connectionString: 'postgresql://test:test@localhost:5432/test',
    });
  });

  it('should instantiate PrismaClient with the adapter and export it as default', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    let exported: any;
    jest.isolateModules(() => {
      exported = require('../../src/lib/prisma').default;
    });

    expect(mockPrismaClient).toHaveBeenCalledWith({ adapter: mockPrismaPgInstance });
    expect(exported).toBe(mockPrismaClientInstance);
  });
});
