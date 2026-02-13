/**
 * Mock Slack client for testing
 * Provides mocked Slack Web API methods
 */

export const mockSlackClient = {
  chat: {
    postMessage: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    postEphemeral: jest.fn(),
  },
  views: {
    open: jest.fn(),
    update: jest.fn(),
    push: jest.fn(),
  },
  users: {
    info: jest.fn(),
    list: jest.fn(),
  },
  conversations: {
    info: jest.fn(),
    list: jest.fn(),
    members: jest.fn(),
  },
};

/**
 * Reset all Slack mock functions
 */
export function resetSlackMocks() {
  Object.values(mockSlackClient).forEach((namespace) => {
    Object.values(namespace).forEach((fn) => {
      if (typeof fn === 'function' && 'mockClear' in fn) {
        fn.mockClear();
      }
    });
  });
}

/**
 * Create a mock Slack user
 */
export function createMockUser(overrides: Partial<any> = {}) {
  return {
    id: 'U123456',
    name: 'testuser',
    real_name: 'Test User',
    is_bot: false,
    ...overrides,
  };
}

/**
 * Create a mock Slack channel
 */
export function createMockChannel(overrides: Partial<any> = {}) {
  return {
    id: 'C123456',
    name: 'test-channel',
    is_channel: true,
    is_private: false,
    ...overrides,
  };
}

/**
 * Create a mock Slack message response
 */
export function createMockMessageResponse(overrides: Partial<any> = {}) {
  return {
    ok: true,
    channel: 'C123456',
    ts: '1234567890.123456',
    message: {
      text: 'Test message',
      user: 'U123456',
      ts: '1234567890.123456',
      ...overrides.message,
    },
    ...overrides,
  };
}
