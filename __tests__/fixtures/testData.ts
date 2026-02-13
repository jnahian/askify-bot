/**
 * Test data factories for creating test polls, votes, and templates
 */

import type { PollType, PollStatus } from '../../src/generated/prisma/client';

/**
 * Create a test poll with options
 */
export function createTestPoll(overrides: Partial<any> = {}) {
  const defaultPoll = {
    id: 'poll-123',
    creatorId: 'U123456',
    channelId: 'C123456',
    messageTs: '1234567890.123456',
    question: 'What is your favorite color?',
    pollType: 'single_choice' as PollType,
    settings: {
      anonymous: false,
      allowVoteChange: true,
      liveResults: true,
    },
    status: 'active' as PollStatus,
    scheduledAt: null,
    closesAt: null,
    reminderSentAt: null,
    createdAt: new Date('2024-01-01T12:00:00Z'),
    options: [
      {
        id: 'opt-1',
        pollId: 'poll-123',
        label: 'Red',
        position: 0,
        addedBy: null,
        _count: { votes: 0 },
      },
      {
        id: 'opt-2',
        pollId: 'poll-123',
        label: 'Blue',
        position: 1,
        addedBy: null,
        _count: { votes: 0 },
      },
      {
        id: 'opt-3',
        pollId: 'poll-123',
        label: 'Green',
        position: 2,
        addedBy: null,
        _count: { votes: 0 },
      },
    ],
    _count: { votes: 0 },
  };

  return {
    ...defaultPoll,
    ...overrides,
    settings: {
      ...defaultPoll.settings,
      ...(overrides.settings || {}),
    },
    options: overrides.options || defaultPoll.options,
  };
}

/**
 * Create a test poll option
 */
export function createTestOption(overrides: Partial<any> = {}) {
  return {
    id: 'opt-1',
    pollId: 'poll-123',
    label: 'Option 1',
    position: 0,
    addedBy: null,
    _count: { votes: 0 },
    ...overrides,
  };
}

/**
 * Create a test vote
 */
export function createTestVote(overrides: Partial<any> = {}) {
  return {
    id: 'vote-123',
    pollId: 'poll-123',
    optionId: 'opt-1',
    userId: 'U123456',
    createdAt: new Date('2024-01-01T12:00:00Z'),
    ...overrides,
  };
}

/**
 * Create a test template
 */
export function createTestTemplate(overrides: Partial<any> = {}) {
  return {
    id: 'tmpl-123',
    creatorId: 'U123456',
    name: 'Daily Standup',
    question: 'What are you working on today?',
    pollType: 'single_choice' as PollType,
    options: ['Task A', 'Task B', 'Task C'],
    settings: {
      anonymous: false,
      allowVoteChange: true,
      liveResults: true,
    },
    createdAt: new Date('2024-01-01T12:00:00Z'),
    ...overrides,
  };
}

/**
 * Create a multi-select poll
 */
export function createMultiSelectPoll(overrides: Partial<any> = {}) {
  return createTestPoll({
    pollType: 'multi_select' as PollType,
    question: 'Which features do you want?',
    ...overrides,
  });
}

/**
 * Create a yes/no poll
 */
export function createYesNoPoll(overrides: Partial<any> = {}) {
  return createTestPoll({
    pollType: 'yes_no' as PollType,
    question: 'Should we proceed with this plan?',
    options: [
      {
        id: 'opt-yes',
        pollId: 'poll-123',
        label: 'Yes',
        position: 0,
        addedBy: null,
        _count: { votes: 0 },
      },
      {
        id: 'opt-no',
        pollId: 'poll-123',
        label: 'No',
        position: 1,
        addedBy: null,
        _count: { votes: 0 },
      },
      {
        id: 'opt-maybe',
        pollId: 'poll-123',
        label: 'Maybe',
        position: 2,
        addedBy: null,
        _count: { votes: 0 },
      },
    ],
    ...overrides,
  });
}

/**
 * Create a rating poll
 */
export function createRatingPoll(overrides: Partial<any> = {}) {
  const ratingScale = overrides.settings?.ratingScale || 5;
  const options = Array.from({ length: ratingScale }, (_, i) => ({
    id: `opt-${i + 1}`,
    pollId: 'poll-123',
    label: `${i + 1}`,
    position: i,
    addedBy: null,
    _count: { votes: 0 },
  }));

  return createTestPoll({
    pollType: 'rating' as PollType,
    question: 'Rate our service',
    settings: {
      anonymous: false,
      allowVoteChange: true,
      liveResults: true,
      ratingScale: ratingScale,
    },
    options,
    ...overrides,
  });
}
