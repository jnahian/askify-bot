/**
 * Tests for health server
 * Covers health check endpoint and server startup
 */

import { startHealthServer } from '../../src/lib/healthServer';
import prisma from '../../src/lib/prisma';

// Mock dependencies
jest.mock('../../src/lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

jest.mock('express', () => {
  const mockApp = {
    get: jest.fn(),
    listen: jest.fn((port: number, callback: Function) => {
      callback();
      return { close: jest.fn() };
    }),
  };
  return jest.fn(() => mockApp);
});

describe('healthServer', () => {
  let mockSlackClient: any;
  let mockExpress: any;
  let mockApp: any;
  let healthHandler: Function;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSlackClient = {
      auth: {
        test: jest.fn(),
      },
    };

    mockExpress = require('express');
    mockApp = mockExpress();

    // Capture the health endpoint handler
    mockApp.get.mockImplementation((path: string, handler: Function) => {
      if (path === '/health') {
        healthHandler = handler;
      }
    });
  });

  describe('server startup', () => {
    it('should create Express app and register health endpoint', () => {
      startHealthServer(mockSlackClient);

      expect(mockApp.get).toHaveBeenCalledWith('/health', expect.any(Function));
    });

    it('should start server on default port 3000', () => {
      startHealthServer(mockSlackClient);

      expect(mockApp.listen).toHaveBeenCalledWith(3000, expect.any(Function));
    });

    it('should start server on PORT from environment', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '8080';

      startHealthServer(mockSlackClient);

      expect(mockApp.listen).toHaveBeenCalledWith('8080', expect.any(Function));

      // Restore
      if (originalPort) {
        process.env.PORT = originalPort;
      } else {
        delete process.env.PORT;
      }
    });
  });

  describe('health endpoint - success', () => {
    it('should return 200 when all checks pass', async () => {
      startHealthServer(mockSlackClient);

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockSlackClient.auth.test.mockResolvedValue({ ok: true });

      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'ok',
        timestamp: expect.any(String),
        checks: {
          database: 'connected',
          slack: 'connected',
        },
      });
    });

    it('should check database connectivity', async () => {
      startHealthServer(mockSlackClient);

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockSlackClient.auth.test.mockResolvedValue({ ok: true });

      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(prisma.$queryRaw).toHaveBeenCalled();
    });

    it('should check Slack connectivity', async () => {
      startHealthServer(mockSlackClient);

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockSlackClient.auth.test.mockResolvedValue({ ok: true });

      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockSlackClient.auth.test).toHaveBeenCalled();
    });

    it('should include ISO timestamp in response', async () => {
      startHealthServer(mockSlackClient);

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockSlackClient.auth.test.mockResolvedValue({ ok: true });

      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthHandler(mockReq, mockRes);

      const response = mockRes.json.mock.calls[0][0];
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('health endpoint - failures', () => {
    it('should return 503 when database check fails', async () => {
      startHealthServer(mockSlackClient);

      (prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection failed'));
      mockSlackClient.auth.test.mockResolvedValue({ ok: true });

      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        timestamp: expect.any(String),
        error: 'Database connection failed',
      });
    });

    it('should return 503 when Slack check fails', async () => {
      startHealthServer(mockSlackClient);

      (prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }]);
      mockSlackClient.auth.test.mockRejectedValue(new Error('Slack auth failed'));

      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        timestamp: expect.any(String),
        error: 'Slack auth failed',
      });
    });

    it('should handle non-Error exceptions', async () => {
      startHealthServer(mockSlackClient);

      (prisma.$queryRaw as jest.Mock).mockRejectedValue('String error');

      const mockReq = {} as any;
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await healthHandler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(503);
      expect(mockRes.json).toHaveBeenCalledWith({
        status: 'error',
        timestamp: expect.any(String),
        error: 'Unknown error',
      });
    });
  });
});
