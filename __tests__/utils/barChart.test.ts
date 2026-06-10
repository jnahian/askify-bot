/**
 * Tests for barChart utility functions
 */

import { renderBar } from '../../src/utils/barChart';

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
});
