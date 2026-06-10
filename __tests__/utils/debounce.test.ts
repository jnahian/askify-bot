/**
 * Tests for debounce utility
 */

import { debouncedUpdate, flushAll } from '../../src/utils/debounce';

describe('debouncedUpdate', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should execute function after delay', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    
    debouncedUpdate('test-key', mockFn, 500);
    
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(500);
    await Promise.resolve(); // Let promises resolve
    
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should cancel previous call when called multiple times', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    
    debouncedUpdate('test-key', mockFn, 500);
    jest.advanceTimersByTime(200);
    
    debouncedUpdate('test-key', mockFn, 500);
    jest.advanceTimersByTime(200);
    
    debouncedUpdate('test-key', mockFn, 500);
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    
    // Should only be called once (the last call)
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should handle different keys independently', async () => {
    const mockFn1 = jest.fn().mockResolvedValue(undefined);
    const mockFn2 = jest.fn().mockResolvedValue(undefined);
    
    debouncedUpdate('key1', mockFn1, 500);
    debouncedUpdate('key2', mockFn2, 500);
    
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    
    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });

  it('should use default delay of 500ms if not specified', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    
    debouncedUpdate('test-key', mockFn);
    
    jest.advanceTimersByTime(499);
    await Promise.resolve();
    expect(mockFn).not.toHaveBeenCalled();
    
    jest.advanceTimersByTime(1);
    await Promise.resolve();
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should catch and log errors from the function', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const mockFn = jest.fn().mockRejectedValue(new Error('Test error'));
    
    debouncedUpdate('test-key', mockFn, 500);
    
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Debounced update error for test-key'),
      expect.any(Error)
    );
    
    consoleErrorSpy.mockRestore();
  });

  it('should allow rapid updates to same key', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    
    // Simulate rapid voting
    for (let i = 0; i < 10; i++) {
      debouncedUpdate('poll-123', mockFn, 500);
      jest.advanceTimersByTime(100);
    }
    
    // Fast forward past the last call
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    
    // Should only execute once after all the rapid calls
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should execute multiple times if calls are spaced out', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);
    
    debouncedUpdate('test-key', mockFn, 500);
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    
    debouncedUpdate('test-key', mockFn, 500);
    jest.advanceTimersByTime(500);
    await Promise.resolve();
    
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('flushAll', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('should resolve when nothing is pending', async () => {
    await expect(flushAll()).resolves.toBeUndefined();
  });

  it('should immediately execute all pending callbacks', async () => {
    const mockFn1 = jest.fn().mockResolvedValue(undefined);
    const mockFn2 = jest.fn().mockResolvedValue(undefined);

    debouncedUpdate('flush-key1', mockFn1, 500);
    debouncedUpdate('flush-key2', mockFn2, 500);

    expect(mockFn1).not.toHaveBeenCalled();
    expect(mockFn2).not.toHaveBeenCalled();

    await flushAll();

    expect(mockFn1).toHaveBeenCalledTimes(1);
    expect(mockFn2).toHaveBeenCalledTimes(1);
  });

  it('should clear pending timers so callbacks do not fire again', async () => {
    const mockFn = jest.fn().mockResolvedValue(undefined);

    debouncedUpdate('flush-key', mockFn, 500);
    await flushAll();

    expect(mockFn).toHaveBeenCalledTimes(1);

    // Advance past the original delay — the timer must have been cancelled
    jest.advanceTimersByTime(1000);
    await Promise.resolve();

    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should only flush the latest callback for a debounced key', async () => {
    const firstFn = jest.fn().mockResolvedValue(undefined);
    const lastFn = jest.fn().mockResolvedValue(undefined);

    debouncedUpdate('flush-key', firstFn, 500);
    debouncedUpdate('flush-key', lastFn, 500);

    await flushAll();

    expect(firstFn).not.toHaveBeenCalled();
    expect(lastFn).toHaveBeenCalledTimes(1);
  });

  it('should log errors and continue flushing remaining callbacks', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const failingFn = jest.fn().mockRejectedValue(new Error('Flush failure'));
    const okFn = jest.fn().mockResolvedValue(undefined);

    debouncedUpdate('flush-bad', failingFn, 500);
    debouncedUpdate('flush-good', okFn, 500);

    await expect(flushAll()).resolves.toBeUndefined();

    expect(failingFn).toHaveBeenCalledTimes(1);
    expect(okFn).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Flush error for flush-bad'),
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
