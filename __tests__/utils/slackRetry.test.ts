/**
 * Tests for slackRetry utility
 */

import { withRetry } from '../../src/utils/slackRetry';

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should return result on successful call', async () => {
    const mockFn = jest.fn().mockResolvedValue({ ok: true, data: 'success' });
    
    const promise = withRetry(mockFn);
    const result = await promise;
    
    expect(result).toEqual({ ok: true, data: 'success' });
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should throw error immediately for non-rate-limit errors', async () => {
    const error = new Error('Network error');
    const mockFn = jest.fn().mockRejectedValue(error);
    
    await expect(withRetry(mockFn)).rejects.toThrow('Network error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on rate limit error', async () => {
    const rateLimitError = {
      data: { error: 'ratelimited' },
    };
    
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue({ ok: true });
    
    const promise = withRetry(mockFn, 3);
    
    // Fast forward through the delay
    await jest.advanceTimersByTimeAsync(1000);
    
    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should use retry_after from error if provided', async () => {
    const rateLimitError = {
      data: {
        error: 'ratelimited',
        response_metadata: { retry_after: 5 },
      },
    };
    
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue({ ok: true });
    
    const promise = withRetry(mockFn, 3);
    
    // Should wait 5 seconds (5000ms)
    await jest.advanceTimersByTimeAsync(5000);
    
    const result = await promise;
    expect(result).toEqual({ ok: true });
  });

  it('should use exponential backoff when retry_after not provided', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const rateLimitError = {
      data: { error: 'ratelimited' },
    };
    
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue({ ok: true });
    
    const promise = withRetry(mockFn, 3);
    
    // First retry: 2^0 = 1 second
    await jest.advanceTimersByTimeAsync(1000);
    
    // Second retry: 2^1 = 2 seconds
    await jest.advanceTimersByTimeAsync(2000);
    
    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(mockFn).toHaveBeenCalledTimes(3);
    
    consoleWarnSpy.mockRestore();
  });

  it('should throw error after max retries exceeded', async () => {
    const rateLimitError = {
      data: { error: 'ratelimited' },
    };
    
    const mockFn = jest.fn().mockRejectedValue(rateLimitError);
    
    // Use real timers for this test to avoid complexity
    jest.useRealTimers();
    
    await expect(withRetry(mockFn, 0)).rejects.toEqual(rateLimitError);
    expect(mockFn).toHaveBeenCalledTimes(1); // initial, no retries
    
    jest.useFakeTimers();
  });

  it('should handle slack_webapi_rate_limited error code', async () => {
    const rateLimitError = {
      code: 'slack_webapi_rate_limited',
      retryAfter: 3,
    };
    
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue({ ok: true });
    
    const promise = withRetry(mockFn, 3);
    
    await jest.advanceTimersByTimeAsync(3000);
    
    const result = await promise;
    expect(result).toEqual({ ok: true });
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should log retry warnings', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const rateLimitError = {
      data: { error: 'ratelimited' },
    };
    
    const mockFn = jest
      .fn()
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValue({ ok: true });
    
    const promise = withRetry(mockFn, 3);
    
    await jest.advanceTimersByTimeAsync(1000);
    await promise;
    
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Rate limited, retrying in 1000ms')
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('should respect maxRetries parameter', async () => {
    const rateLimitError = {
      data: { error: 'ratelimited' },
    };
    
    const mockFn = jest.fn().mockRejectedValue(rateLimitError);
    
    // Use real timers for this test
    jest.useRealTimers();
    
    await expect(withRetry(mockFn, 1)).rejects.toEqual(rateLimitError);
    expect(mockFn).toHaveBeenCalledTimes(2); // initial + 1 retry
    
    jest.useFakeTimers();
  });
});
