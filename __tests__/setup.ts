/**
 * Global test setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SLACK_BOT_TOKEN = 'xoxb-test-token';
process.env.SLACK_SIGNING_SECRET = 'test-signing-secret';
process.env.SLACK_APP_TOKEN = 'xapp-test-token';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

// Increase timeout for integration tests if needed
jest.setTimeout(10000);

// Silence console logs during tests (optional - comment out for debugging)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
