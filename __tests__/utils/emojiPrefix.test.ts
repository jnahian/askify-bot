/**
 * Tests for emojiPrefix utility functions
 */

import { getNumberEmoji, getStarEmoji, getOptionEmoji } from '../../src/utils/emojiPrefix';

describe('emojiPrefix utilities', () => {
  describe('getNumberEmoji', () => {
    it('should return number emoji for indices 0-9', () => {
      expect(getNumberEmoji(0)).toBe('1️⃣');
      expect(getNumberEmoji(1)).toBe('2️⃣');
      expect(getNumberEmoji(2)).toBe('3️⃣');
      expect(getNumberEmoji(9)).toBe('🔟');
    });

    it('should return parenthesized number for indices >= 10', () => {
      expect(getNumberEmoji(10)).toBe('(11)');
      expect(getNumberEmoji(15)).toBe('(16)');
      expect(getNumberEmoji(99)).toBe('(100)');
    });
  });

  describe('getStarEmoji', () => {
    it('should return correct number of stars', () => {
      expect(getStarEmoji(1)).toBe('⭐');
      expect(getStarEmoji(3)).toBe('⭐⭐⭐');
      expect(getStarEmoji(5)).toBe('⭐⭐⭐⭐⭐');
    });

    it('should cap at 10 stars', () => {
      expect(getStarEmoji(10)).toBe('⭐'.repeat(10));
      expect(getStarEmoji(15)).toBe('⭐'.repeat(10));
      expect(getStarEmoji(100)).toBe('⭐'.repeat(10));
    });

    it('should return at least 1 star for values < 1', () => {
      expect(getStarEmoji(0)).toBe('⭐');
      expect(getStarEmoji(-5)).toBe('⭐');
    });
  });

  describe('getOptionEmoji', () => {
    it('should return yes/no emojis for yes_no poll type', () => {
      expect(getOptionEmoji('yes_no', 0, 'Yes')).toBe('✅');
      expect(getOptionEmoji('yes_no', 1, 'No')).toBe('❌');
      expect(getOptionEmoji('yes_no', 2, 'Maybe')).toBe('🤷');
    });

    it('should fallback to number emoji for unknown yes_no labels', () => {
      expect(getOptionEmoji('yes_no', 0, 'Unknown')).toBe('1️⃣');
    });

    it('should return star emojis for rating poll type', () => {
      expect(getOptionEmoji('rating', 0, '1')).toBe('⭐');
      expect(getOptionEmoji('rating', 2, '3')).toBe('⭐⭐⭐');
      expect(getOptionEmoji('rating', 4, '5')).toBe('⭐⭐⭐⭐⭐');
    });

    it('should fallback to number emoji for non-numeric rating labels', () => {
      expect(getOptionEmoji('rating', 0, 'Not a number')).toBe('1️⃣');
    });

    it('should return number emojis for single_choice poll type', () => {
      expect(getOptionEmoji('single_choice', 0, 'Option A')).toBe('1️⃣');
      expect(getOptionEmoji('single_choice', 1, 'Option B')).toBe('2️⃣');
      expect(getOptionEmoji('single_choice', 2, 'Option C')).toBe('3️⃣');
    });

    it('should return number emojis for multi_select poll type', () => {
      expect(getOptionEmoji('multi_select', 0, 'Feature A')).toBe('1️⃣');
      expect(getOptionEmoji('multi_select', 1, 'Feature B')).toBe('2️⃣');
    });
  });
});
