# Testing Guide

This document provides comprehensive guidance for testing the Askify bot.

## Table of Contents

- [Overview](#overview)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Test Utilities](#test-utilities)
- [Best Practices](#best-practices)
- [CI/CD Integration](#cicd-integration)

## Overview

Askify uses **Jest** as its testing framework with **ts-jest** for TypeScript support. The test suite includes:

- **Unit Tests**: Testing individual functions and modules in isolation
- **Integration Tests**: Testing how components work together
- **Mock Utilities**: Simulating external dependencies (Slack API, Prisma)

### Coverage Goals

We aim for minimum 60% coverage across:
- Branches
- Functions
- Lines
- Statements

Current coverage is tracked in CI and reported on pull requests.

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (useful during development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, coverage enabled)
npm run test:ci

# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="renderBar"

# Run tests for a specific directory
npm test -- __tests__/utils
```

### Debug Tests

To debug tests, add `--runInBand` to run tests serially:

```bash
npm test -- --runInBand
```

Or use Node.js debugging:

```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Test Structure

```
__tests__/
├── setup.ts                 # Global test setup
├── fixtures/
│   └── testData.ts         # Test data factories
├── mocks/
│   ├── prisma.ts           # Prisma client mock
│   └── slack.ts            # Slack client mock
├── utils/
│   ├── barChart.test.ts    # Utility function tests
│   ├── debounce.test.ts
│   ├── emojiPrefix.test.ts
│   └── slackRetry.test.ts
├── services/               # Service layer tests (coming soon)
├── blocks/                 # Block builder tests (coming soon)
├── actions/                # Action handler tests (coming soon)
└── commands/               # Command handler tests (coming soon)
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions in isolation.

#### Example: Testing a Utility Function

```typescript
// __tests__/utils/barChart.test.ts
import { renderBar } from '../../src/utils/barChart';

describe('renderBar', () => {
  it('should render a full bar at 100%', () => {
    const result = renderBar(10, 10, 0);
    expect(result).toContain('100%');
    expect(result).toContain('(10)');
  });

  it('should handle zero total voters', () => {
    const result = renderBar(0, 0, 0);
    expect(result).toContain('0%');
  });
});
```

### Service Tests (with Mocks)

Service tests use mocked dependencies to test business logic.

#### Example: Testing Poll Service

```typescript
// __tests__/services/pollService.test.ts
import { mockPrismaClient } from '../mocks/prisma';
import { createPoll } from '../../src/services/pollService';
import { createTestPoll } from '../fixtures/testData';

describe('pollService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPoll', () => {
    it('should create a poll with options', async () => {
      const mockPoll = createTestPoll();
      mockPrismaClient.poll.create.mockResolvedValue(mockPoll);

      const result = await createPoll({
        creatorId: 'U123',
        channelId: 'C123',
        question: 'Test?',
        pollType: 'single_choice',
        options: ['A', 'B', 'C'],
        settings: {},
        closesAt: null,
      });

      expect(mockPrismaClient.poll.create).toHaveBeenCalled();
      expect(result).toEqual(mockPoll);
    });
  });
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

```typescript
// __tests__/actions/voteAction.test.ts
import { mockSlackClient } from '../mocks/slack';
import { mockPrismaClient } from '../mocks/prisma';
import { createTestPoll, createTestVote } from '../fixtures/testData';

describe('Vote Action Handler', () => {
  it('should handle vote cast and update message', async () => {
    const poll = createTestPoll();
    mockPrismaClient.poll.findUnique.mockResolvedValue(poll);
    mockSlackClient.chat.update.mockResolvedValue({ ok: true });

    // Test vote action logic here
  });
});
```

## Test Utilities

### Mock Utilities

#### Prisma Mock

Located in `__tests__/mocks/prisma.ts`, provides mocked Prisma operations:

```typescript
import { mockPrismaClient, resetPrismaMocks } from '../mocks/prisma';

// Mock a database query
mockPrismaClient.poll.findUnique.mockResolvedValue(mockPoll);

// Reset all mocks between tests
resetPrismaMocks();
```

#### Slack Client Mock

Located in `__tests__/mocks/slack.ts`, provides mocked Slack API methods:

```typescript
import { mockSlackClient, createMockUser, createMockChannel } from '../mocks/slack';

// Mock Slack API calls
mockSlackClient.chat.postMessage.mockResolvedValue({ ok: true, ts: '123.456' });

// Create test users and channels
const user = createMockUser({ id: 'U123', name: 'alice' });
const channel = createMockChannel({ id: 'C123', name: 'general' });
```

### Test Data Factories

Located in `__tests__/fixtures/testData.ts`, provides factory functions for creating test data:

```typescript
import {
  createTestPoll,
  createTestOption,
  createTestVote,
  createTestTemplate,
  createMultiSelectPoll,
  createYesNoPoll,
  createRatingPoll,
} from '../fixtures/testData';

// Create a basic poll
const poll = createTestPoll();

// Create a poll with custom properties
const customPoll = createTestPoll({
  question: 'Custom question?',
  pollType: 'multi_select',
  status: 'closed',
});

// Create specialized poll types
const yesNoPoll = createYesNoPoll();
const ratingPoll = createRatingPoll({ settings: { ratingScale: 10 } });
```

### Jest Utilities

#### Timer Mocking

For testing debounced functions or delays:

```typescript
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

it('should debounce calls', async () => {
  debouncedUpdate('key', mockFn, 500);
  
  jest.advanceTimersByTime(500);
  await Promise.resolve();
  
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

#### Async Testing

For testing promises and async functions:

```typescript
it('should handle async operations', async () => {
  const result = await asyncFunction();
  expect(result).toBe(expected);
});

it('should handle rejected promises', async () => {
  await expect(asyncFunction()).rejects.toThrow('Error message');
});
```

## Best Practices

### 1. Test Organization

- **One test file per source file**: `src/utils/barChart.ts` → `__tests__/utils/barChart.test.ts`
- **Group related tests**: Use `describe` blocks to organize tests by function or feature
- **Clear test names**: Use descriptive names that explain what is being tested

### 2. Test Independence

- **Isolate tests**: Each test should be independent and not rely on others
- **Clean up**: Use `beforeEach` and `afterEach` to reset state
- **Mock external dependencies**: Don't make real API calls or database queries

### 3. Test Coverage

- **Test happy paths**: Verify normal, expected behavior
- **Test edge cases**: Handle boundary conditions, empty inputs, null values
- **Test error paths**: Verify error handling and validation

### 4. Assertions

- **Be specific**: Use precise expectations (`toBe`, `toEqual`, `toContain`)
- **Test one thing**: Each test should verify one behavior
- **Use meaningful messages**: Add custom messages to assertions when needed

```typescript
expect(result).toBe(expected, 'Result should match expected value');
```

### 5. Mocking

- **Mock external dependencies**: Use mocks for Prisma, Slack API, etc.
- **Reset mocks**: Clear mock state between tests
- **Verify mock calls**: Check that mocks were called correctly

```typescript
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith(expectedArg);
```

### 6. Readability

- **Use descriptive variable names**: Make tests easy to understand
- **Keep tests short**: Break complex tests into smaller ones
- **Add comments**: Explain complex logic or setup

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Pull requests to `main` or `develop` branches
- Pushes to `main` or `develop` branches

The CI workflow:
1. Checks out code
2. Sets up Node.js 22
3. Installs dependencies
4. Generates Prisma Client
5. Runs type checking
6. Runs tests with coverage
7. Uploads coverage to Codecov
8. Comments coverage on PR

### Coverage Requirements

- **Minimum coverage**: 60% for branches, functions, lines, and statements
- **Coverage reporting**: Automated on all PRs
- **Coverage trends**: Tracked over time via Codecov

### Local Coverage Reports

After running `npm run test:coverage`, open the coverage report:

```bash
open coverage/lcov-report/index.html
```

## Troubleshooting

### Tests Timeout

If tests are timing out, increase the timeout:

```typescript
jest.setTimeout(15000); // 15 seconds
```

Or set timeout for individual tests:

```typescript
it('should handle long operation', async () => {
  // test code
}, 15000);
```

### Mock Not Working

Make sure mocks are set up before importing the module under test:

```typescript
// Mock first
jest.mock('../../src/lib/prisma');

// Import after
import { createPoll } from '../../src/services/pollService';
```

### Console Output Cluttering

The global test setup silences console logs. To enable them for debugging:

```typescript
// In __tests__/setup.ts, comment out:
// global.console = { ... }
```

Or temporarily restore console in a specific test:

```typescript
const consoleLog = jest.spyOn(console, 'log').mockImplementation();
// ... test code ...
consoleLog.mockRestore();
```

## Contributing Tests

When adding new features:

1. **Write tests first** (TDD) or alongside your implementation
2. **Ensure all tests pass**: Run `npm test` before committing
3. **Maintain coverage**: Don't decrease overall coverage percentage
4. **Follow patterns**: Match the style of existing tests
5. **Document complex tests**: Add comments explaining test setup or expectations

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [Slack Bolt Testing](https://slack.dev/bolt-js/tutorial/getting-started)

## Future Improvements

- [ ] Add E2E tests for complete user flows
- [ ] Add contract tests for Slack API interactions
- [ ] Add performance benchmarks
- [ ] Add visual regression tests for Block Kit messages
- [ ] Increase coverage to 80%+
