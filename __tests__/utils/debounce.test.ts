/**
 * Tests for debounce utility
 */

import { debouncedUpdate } from '../../src/utils/debounce';

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
