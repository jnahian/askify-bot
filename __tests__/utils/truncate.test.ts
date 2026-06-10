/**
 * Tests for truncate utility
 */

import { truncate } from '../../src/utils/truncate';

describe('truncate', () => {
  it('should return text unchanged when shorter than max', () => {
    expect(truncate('hello', 150)).toBe('hello');
  });

  it('should return text unchanged when exactly max length', () => {
    const text = 'a'.repeat(150);
    expect(truncate(text)).toBe(text);
  });

  it('should truncate long text and append an ellipsis', () => {
    const text = 'a'.repeat(200);
    const result = truncate(text, 150);
    expect(result).toHaveLength(150);
    expect(result).toBe('a'.repeat(149) + '…');
  });

  it('should use a default max of 150', () => {
    const text = 'b'.repeat(151);
    const result = truncate(text);
    expect(result).toHaveLength(150);
    expect(result.endsWith('…')).toBe(true);
  });

  it('should return an empty string when max is less than 1', () => {
    expect(truncate('hello', 0)).toBe('');
    expect(truncate('hello', -5)).toBe('');
  });

  it('should return only an ellipsis when max is 1', () => {
    expect(truncate('hello', 1)).toBe('…');
  });

  it('should handle empty string input', () => {
    expect(truncate('', 10)).toBe('');
  });
});
