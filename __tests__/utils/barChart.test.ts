/**
 * Tests for barChart utility functions
 */

import { renderBar, renderTextBar, renderResultsText } from '../../src/utils/barChart';

describe('barChart utilities', () => {
  describe('renderBar', () => {
    it('should render a full bar at 100%', () => {
      const result = renderBar(10, 10, 0);
      expect(result).toContain('100%');
      expect(result).toContain('(10)');
      expect(result).toContain(':large_green_square:');
      expect(result).not.toContain(':white_large_square:');
    });

    it('should render an empty bar at 0%', () => {
      const result = renderBar(0, 10, 0);
      expect(result).toContain('0%');
      expect(result).toContain('(0)');
      expect(result).toContain(':white_large_square:');
      expect(result).not.toContain(':large_green_square:');
    });

    it('should render a half bar at 50%', () => {
      const result = renderBar(5, 10, 0);
      expect(result).toContain('50%');
      expect(result).toContain('(5)');
      expect(result).toContain(':large_green_square:');
      expect(result).toContain(':white_large_square:');
    });

    it('should handle zero total voters', () => {
      const result = renderBar(0, 0, 0);
      expect(result).toContain('0%');
      expect(result).toContain('(0)');
    });

    it('should use different colors based on colorIndex', () => {
      const result0 = renderBar(10, 10, 0);
      const result1 = renderBar(10, 10, 1);
      const result2 = renderBar(10, 10, 2);
      
      expect(result0).toContain(':large_green_square:');
      expect(result1).toContain(':large_orange_square:');
      expect(result2).toContain(':large_blue_square:');
    });

    it('should cap colorIndex at maximum', () => {
      const result = renderBar(10, 10, 999);
      expect(result).toContain(':large_yellow_square:'); // Last color in array
    });

    it('should round percentages correctly', () => {
      const result = renderBar(1, 3, 0);
      expect(result).toContain('33%'); // 1/3 = 33.33% rounds to 33%
    });
  });

  describe('renderTextBar', () => {
    it('should render a full text bar at 100%', () => {
      const result = renderTextBar(10, 10);
      expect(result).toContain('100%');
      expect(result).toContain('(10)');
      expect(result).toContain('█'); // Filled character
      expect(result).not.toContain('░'); // Empty character
    });

    it('should render an empty text bar at 0%', () => {
      const result = renderTextBar(0, 10);
      expect(result).toContain('0%');
      expect(result).toContain('(0)');
      expect(result).toContain('░'); // Empty character
      expect(result).not.toContain('█'); // Filled character
    });

    it('should render a half text bar at 50%', () => {
      const result = renderTextBar(5, 10);
      expect(result).toContain('50%');
      expect(result).toContain('(5)');
      expect(result).toContain('█'); // Filled character
      expect(result).toContain('░'); // Empty character
    });

    it('should handle zero total voters', () => {
      const result = renderTextBar(0, 0);
      expect(result).toContain('0%');
      expect(result).toContain('(0)');
    });

    it('should render exactly 10 characters for the bar', () => {
      const result = renderTextBar(3, 10);
      const barMatch = result.match(/[█░]+/);
      expect(barMatch).not.toBeNull();
      expect(barMatch![0]).toHaveLength(10);
    });
  });

  describe('renderResultsText', () => {
    it('should render multiple options with bars', () => {
      const options = [
        { label: 'Option A', voteCount: 10 },
        { label: 'Option B', voteCount: 5 },
        { label: 'Option C', voteCount: 2 },
      ];
      const result = renderResultsText(options, 17);
      
      expect(result).toContain('Option A');
      expect(result).toContain('Option B');
      expect(result).toContain('Option C');
      expect(result).toContain('59%'); // 10/17
      expect(result).toContain('29%'); // 5/17
      expect(result).toContain('12%'); // 2/17
    });

    it('should use different colors for each option', () => {
      const options = [
        { label: 'Option A', voteCount: 10 },
        { label: 'Option B', voteCount: 5 },
        { label: 'Option C', voteCount: 2 },
      ];
      const result = renderResultsText(options, 17);
      
      expect(result).toContain(':large_green_square:');
      expect(result).toContain(':large_orange_square:');
      expect(result).toContain(':large_blue_square:');
    });

    it('should handle empty options array', () => {
      const result = renderResultsText([], 0);
      expect(result).toBe('');
    });

    it('should handle single option', () => {
      const options = [{ label: 'Only Option', voteCount: 5 }];
      const result = renderResultsText(options, 5);
      
      expect(result).toContain('Only Option');
      expect(result).toContain('100%');
    });
  });
});
