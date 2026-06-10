/**
 * Tests for pollSettings getSettings helper
 */

import { getSettings } from '../../src/types/pollSettings';

describe('getSettings', () => {
  it('should apply defaults when settings is null', () => {
    const result = getSettings({ settings: null });
    expect(result).toEqual({ allowVoteChange: true, liveResults: true });
  });

  it('should apply defaults when settings is undefined', () => {
    const result = getSettings({ settings: undefined });
    expect(result).toEqual({ allowVoteChange: true, liveResults: true });
  });

  it('should apply defaults when settings is an empty object', () => {
    const result = getSettings({ settings: {} });
    expect(result).toEqual({ allowVoteChange: true, liveResults: true });
  });

  it('should let stored values override defaults', () => {
    const result = getSettings({
      settings: { allowVoteChange: false, liveResults: false },
    });
    expect(result.allowVoteChange).toBe(false);
    expect(result.liveResults).toBe(false);
  });

  it('should preserve explicit false values from storage', () => {
    const result = getSettings({ settings: { allowVoteChange: false } });
    expect(result.allowVoteChange).toBe(false);
    expect(result.liveResults).toBe(true); // default still applied
  });

  it('should pass through extra settings fields', () => {
    const result = getSettings({
      settings: {
        anonymous: true,
        ratingScale: 5,
        allowAddingOptions: true,
        reminders: true,
        description: 'A poll',
        includeMaybe: false,
      },
    });

    expect(result).toEqual({
      allowVoteChange: true,
      liveResults: true,
      anonymous: true,
      ratingScale: 5,
      allowAddingOptions: true,
      reminders: true,
      description: 'A poll',
      includeMaybe: false,
    });
  });
});
