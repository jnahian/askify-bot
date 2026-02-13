/**
 * Tests for channelError utility functions
 */

import { isNotInChannelError, notInChannelText } from '../../src/utils/channelError';

describe('channelError utilities', () => {
  describe('isNotInChannelError', () => {
    it('should return true for not_in_channel error', () => {
      const error = {
        data: {
          error: 'not_in_channel',
        },
      };
      expect(isNotInChannelError(error)).toBe(true);
    });

    it('should return true for channel_not_found error', () => {
      const error = {
        data: {
          error: 'channel_not_found',
        },
      };
      expect(isNotInChannelError(error)).toBe(true);
    });

    it('should return false for other errors', () => {
      const error = {
        data: {
          error: 'some_other_error',
        },
      };
      expect(isNotInChannelError(error)).toBe(false);
    });

    it('should return false for undefined error', () => {
      expect(isNotInChannelError(undefined)).toBe(false);
    });

    it('should return false for null error', () => {
      expect(isNotInChannelError(null)).toBe(false);
    });

    it('should return false for error without data', () => {
      const error = { message: 'Some error' };
      expect(isNotInChannelError(error)).toBe(false);
    });

    it('should return false for error without error field', () => {
      const error = { data: {} };
      expect(isNotInChannelError(error)).toBe(false);
    });
  });

  describe('notInChannelText', () => {
    it('should return formatted message with channel ID', () => {
      const channelId = 'C123456';
      const result = notInChannelText(channelId);
      
      expect(result).toContain(':warning:');
      expect(result).toContain(`<#${channelId}>`);
      expect(result).toContain('/invite @Askify');
    });

    it('should handle different channel IDs', () => {
      const channelId = 'C987654321';
      const result = notInChannelText(channelId);
      
      expect(result).toContain(`<#${channelId}>`);
    });

    it('should include helpful instructions', () => {
      const result = notInChannelText('C123');
      
      expect(result).toContain("I couldn't post");
      expect(result).toContain("not a member");
      expect(result).toContain("Please invite me");
      expect(result).toContain("try again");
    });
  });
});
