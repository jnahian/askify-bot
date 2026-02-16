/**
 * Tests for pollMessage block builders
 * Comprehensive coverage of Block Kit message generation
 */

import { buildPollMessage, buildResultsDM } from '../../src/blocks/pollMessage';
import { createTestPoll, createTestOption } from '../fixtures/testData';
import type { PollWithOptions } from '../../src/services/pollService';

describe('pollMessage blocks', () => {
  describe('buildPollMessage', () => {
    describe('basic structure', () => {
      it('should build message with header, context, and divider', () => {
        const poll = createTestPoll({
          question: 'What is your favorite color?',
          pollType: 'single_choice',
          status: 'active',
        });

        const result = buildPollMessage(poll, { liveResults: true });

        expect(result.blocks).toBeDefined();
        expect(result.text).toBe('What is your favorite color?');

        // Check header block
        const headerBlock = result.blocks[0];
        expect(headerBlock.type).toBe('header');
        expect((headerBlock as any).text.text).toBe('What is your favorite color?');

        // Check context block exists
        const contextBlock = result.blocks.find((b: any) => b.type === 'context');
        expect(contextBlock).toBeDefined();

        // Check divider exists
        const dividerBlock = result.blocks.find((b: any) => b.type === 'divider');
        expect(dividerBlock).toBeDefined();
      });

      it('should include description when provided', () => {
        const poll = createTestPoll();
        const result = buildPollMessage(poll, {
          description: 'Please select your preference',
          liveResults: true,
        });

        const descriptionBlock = result.blocks.find(
          (b: any) => b.type === 'section' && b.text?.text?.includes('Please select your preference')
        );
        expect(descriptionBlock).toBeDefined();
      });

      it('should not include description block when not provided', () => {
        const poll = createTestPoll();
        const result = buildPollMessage(poll, { liveResults: true });

        const descriptionBlocks = result.blocks.filter(
          (b: any) => b.type === 'section' && b.text?.text?.includes('Please')
        );
        expect(descriptionBlocks.length).toBe(0);
      });
    });

    describe('context line', () => {
      it('should show poll type, creator, and vote count', () => {
        const poll = createTestPoll({
          creatorId: 'U123',
          pollType: 'single_choice',
          _count: { votes: 5 },
        });

        const result = buildPollMessage(poll, { liveResults: true });
        const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;

        expect(contextBlock).toBeDefined();
        expect(contextBlock.elements[0].text).toContain('Single Choice');
        expect(contextBlock.elements[0].text).toContain('<@U123>');
        expect(contextBlock.elements[0].text).toContain('5 votes');
      });

      it('should show singular "vote" for 1 vote', () => {
        const poll = createTestPoll({ _count: { votes: 1 } });
        const result = buildPollMessage(poll, { liveResults: true });
        const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;

        expect(contextBlock.elements[0].text).toContain('1 vote');
        expect(contextBlock.elements[0].text).not.toContain('votes');
      });

      it('should show anonymous indicator when enabled', () => {
        const poll = createTestPoll();
        const result = buildPollMessage(poll, { anonymous: true, liveResults: true });
        const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;

        expect(contextBlock.elements[0].text).toContain(':lock: Anonymous');
      });

      it('should show closed indicator for closed polls', () => {
        const poll = createTestPoll({ status: 'closed' });
        const result = buildPollMessage(poll, { liveResults: true });
        const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;

        expect(contextBlock.elements[0].text).toContain(':no_entry_sign: Closed');
      });

      it('should show different poll type labels', () => {
        const pollTypes = [
          { type: 'single_choice', label: 'Single Choice' },
          { type: 'multi_select', label: 'Multi-Select' },
          { type: 'yes_no', label: 'Yes / No / Maybe' },
          { type: 'rating', label: 'Rating Scale' },
        ];

        pollTypes.forEach(({ type, label }) => {
          const poll = createTestPoll({ pollType: type as any });
          const result = buildPollMessage(poll, { liveResults: true });
          const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;

          expect(contextBlock.elements[0].text).toContain(label);
        });
      });
    });

    describe('options with live results', () => {
      it('should show results with bar charts when liveResults enabled', () => {
        const poll = createTestPoll({
          pollType: 'single_choice',
          _count: { votes: 10 },
        });

        const result = buildPollMessage(poll, { liveResults: true });

        // Should have section blocks for each option with results
        const optionBlocks = result.blocks.filter(
          (b: any) => b.type === 'section' && b.text?.text?.includes('%')
        );
        expect(optionBlocks.length).toBeGreaterThan(0);
      });

      it('should show results for closed polls regardless of liveResults setting', () => {
        const poll = createTestPoll({ status: 'closed', _count: { votes: 5 } });

        const result = buildPollMessage(poll, { liveResults: false });

        // Closed polls should always show results
        const optionBlocks = result.blocks.filter(
          (b: any) => b.type === 'section' && b.text?.text?.includes('%')
        );
        expect(optionBlocks.length).toBeGreaterThan(0);
      });

      it('should include vote buttons for active polls with live results', () => {
        const poll = createTestPoll({ status: 'active' });

        const result = buildPollMessage(poll, { liveResults: true });

        const buttonsFound = result.blocks.some(
          (b: any) => b.type === 'section' && b.accessory?.type === 'button'
        );
        expect(buttonsFound).toBe(true);
      });

      it('should not include vote buttons for closed polls', () => {
        const poll = createTestPoll({ status: 'closed' });

        const result = buildPollMessage(poll, { liveResults: true });

        const buttonsFound = result.blocks.some(
          (b: any) => b.type === 'section' && b.accessory?.type === 'button'
        );
        expect(buttonsFound).toBe(false);
      });

      it('should show voter names when not anonymous', () => {
        const poll = createTestPoll();
        const voterNames = new Map<string, string[]>();
        voterNames.set('opt-1', ['U123', 'U456']);

        const result = buildPollMessage(poll, { liveResults: true }, voterNames);

        const blockWithVoters = result.blocks.find(
          (b: any) => b.type === 'section' && b.text?.text?.includes('<@U123>')
        );
        expect(blockWithVoters).toBeDefined();
      });

      it('should not show voter names when anonymous', () => {
        const poll = createTestPoll();
        const voterNames = new Map<string, string[]>();
        voterNames.set('opt-1', ['U123', 'U456']);

        const result = buildPollMessage(poll, { anonymous: true, liveResults: true }, voterNames);

        const blockWithVoters = result.blocks.find(
          (b: any) => b.type === 'section' && b.text?.text?.includes('<@U123>')
        );
        expect(blockWithVoters).toBeUndefined();
      });
    });

    describe('options without live results', () => {
      it('should show only buttons without results when liveResults disabled', () => {
        const poll = createTestPoll({ status: 'active' });

        const result = buildPollMessage(poll, { liveResults: false });

        // Should have buttons
        const buttonsFound = result.blocks.some(
          (b: any) => b.type === 'section' && b.accessory?.type === 'button'
        );
        expect(buttonsFound).toBe(true);

        // Should not show percentage results
        const resultsFound = result.blocks.some(
          (b: any) => b.type === 'section' && b.text?.text?.includes('%')
        );
        expect(resultsFound).toBe(false);
      });
    });

    describe('rating polls', () => {
      it('should show average rating for rating polls with votes', () => {
        const poll = createTestPoll({
          pollType: 'rating',
          _count: { votes: 10 },
          options: [
            createTestOption({ label: '1', _count: { votes: 2 } }),
            createTestOption({ label: '2', _count: { votes: 3 } }),
            createTestOption({ label: '3', _count: { votes: 5 } }),
          ],
        });

        const result = buildPollMessage(poll, { liveResults: true });

        const avgBlock = result.blocks.find(
          (b: any) => b.type === 'section' && b.text?.text?.includes('Average Rating')
        );
        expect(avgBlock).toBeDefined();
      });

      it('should calculate correct average rating', () => {
        // Average: (1*2 + 2*3 + 3*5) / 10 = (2 + 6 + 15) / 10 = 2.3
        const poll = createTestPoll({
          pollType: 'rating',
          _count: { votes: 10 },
          options: [
            createTestOption({ label: '1', _count: { votes: 2 } }),
            createTestOption({ label: '2', _count: { votes: 3 } }),
            createTestOption({ label: '3', _count: { votes: 5 } }),
          ],
        });

        const result = buildPollMessage(poll, { liveResults: true });

        const avgBlock = result.blocks.find(
          (b: any) => b.text?.text?.includes('Average Rating')
        ) as any;
        expect(avgBlock.text.text).toContain('2.3');
      });

      it('should not show average rating when no votes', () => {
        const poll = createTestPoll({
          pollType: 'rating',
          _count: { votes: 0 },
        });

        const result = buildPollMessage(poll, { liveResults: true });

        const avgBlock = result.blocks.find(
          (b: any) => b.type === 'section' && b.text?.text?.includes('Average Rating')
        );
        expect(avgBlock).toBeUndefined();
      });

      it('should not show average rating for non-rating polls', () => {
        const poll = createTestPoll({
          pollType: 'single_choice',
          _count: { votes: 10 },
        });

        const result = buildPollMessage(poll, { liveResults: true });

        const avgBlock = result.blocks.find(
          (b: any) => b.text?.text?.includes('Average Rating')
        );
        expect(avgBlock).toBeUndefined();
      });
    });

    describe('action buttons', () => {
      it('should show Add Option button when allowAddingOptions is true', () => {
        const poll = createTestPoll({ status: 'active' });

        const result = buildPollMessage(poll, { allowAddingOptions: true, liveResults: true });

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions');
        expect(actionsBlock).toBeDefined();
        expect((actionsBlock as any).elements[0].text.text).toContain('Add Option');
      });

      it('should not show Add Option button when allowAddingOptions is false', () => {
        const poll = createTestPoll({ status: 'active' });

        const result = buildPollMessage(poll, { allowAddingOptions: false, liveResults: true });

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions');
        expect(actionsBlock).toBeUndefined();
      });

      it('should not show action buttons for closed polls', () => {
        const poll = createTestPoll({ status: 'closed' });

        const result = buildPollMessage(poll, { allowAddingOptions: true, liveResults: true });

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions');
        expect(actionsBlock).toBeUndefined();
      });
    });

    describe('vote button values', () => {
      it('should set correct action_id and value for vote buttons', () => {
        const poll = createTestPoll({
          id: 'poll-123',
          options: [
            createTestOption({ id: 'opt-1', label: 'Red' }),
            createTestOption({ id: 'opt-2', label: 'Blue' }),
          ],
        });

        const result = buildPollMessage(poll, { liveResults: true });

        const buttonBlocks = result.blocks.filter(
          (b: any) => b.type === 'section' && b.accessory?.type === 'button'
        );

        expect(buttonBlocks.length).toBe(2);
        expect((buttonBlocks[0] as any).accessory.action_id).toBe('vote_opt-1');
        expect((buttonBlocks[0] as any).accessory.value).toBe('poll-123:opt-1');
        expect((buttonBlocks[1] as any).accessory.action_id).toBe('vote_opt-2');
        expect((buttonBlocks[1] as any).accessory.value).toBe('poll-123:opt-2');
      });
    });
  });

  describe('buildResultsDM', () => {
    it('should build plain text results with header', () => {
      const poll = createTestPoll({ question: 'Favorite Color?' });

      const result = buildResultsDM(poll, { liveResults: true });

      expect(result).toContain(':bar_chart:');
      expect(result).toContain('Favorite Color?');
    });

    it('should include description when provided', () => {
      const poll = createTestPoll();

      const result = buildResultsDM(poll, {
        description: 'Select your preference',
        liveResults: true,
      });

      expect(result).toContain('Select your preference');
    });

    it('should show options with bar charts', () => {
      const poll = createTestPoll({
        _count: { votes: 10 },
        options: [
          createTestOption({ label: 'Red', _count: { votes: 7 } }),
          createTestOption({ label: 'Blue', _count: { votes: 3 } }),
        ],
      });

      const result = buildResultsDM(poll, { liveResults: true });

      expect(result).toContain('Red');
      expect(result).toContain('Blue');
      expect(result).toContain('%');
    });

    it('should show voter names when not anonymous', () => {
      const poll = createTestPoll();
      const voterNames = new Map<string, string[]>();
      voterNames.set('opt-1', ['U123', 'U456']);

      const result = buildResultsDM(poll, { liveResults: true }, voterNames);

      expect(result).toContain('Voters:');
      expect(result).toContain('<@U123>');
      expect(result).toContain('<@U456>');
    });

    it('should not show voter names when anonymous', () => {
      const poll = createTestPoll();
      const voterNames = new Map<string, string[]>();
      voterNames.set('opt-1', ['U123', 'U456']);

      const result = buildResultsDM(poll, { anonymous: true }, voterNames);

      expect(result).not.toContain('Voters:');
      expect(result).not.toContain('<@U123>');
    });

    it('should show average rating for rating polls', () => {
      const poll = createTestPoll({
        pollType: 'rating',
        _count: { votes: 10 },
        options: [
          createTestOption({ label: '1', _count: { votes: 2 } }),
          createTestOption({ label: '2', _count: { votes: 3 } }),
          createTestOption({ label: '3', _count: { votes: 5 } }),
        ],
      });

      const result = buildResultsDM(poll, { liveResults: true });

      expect(result).toContain('Average Rating');
      expect(result).toContain('2.3');
    });

    it('should not show average rating for non-rating polls', () => {
      const poll = createTestPoll({ pollType: 'single_choice', _count: { votes: 10 } });

      const result = buildResultsDM(poll, { liveResults: true });

      expect(result).not.toContain('Average Rating');
    });

    it('should show total vote count', () => {
      const poll = createTestPoll({ _count: { votes: 15 } });

      const result = buildResultsDM(poll, { liveResults: true });

      expect(result).toContain('Total votes: 15');
    });

    it('should handle polls with zero votes', () => {
      const poll = createTestPoll({ _count: { votes: 0 } });

      const result = buildResultsDM(poll, { liveResults: true });

      expect(result).toContain('Total votes: 0');
      expect(result).toContain('0%');
    });

    it('should format all options with emojis', () => {
      const poll = createTestPoll({
        pollType: 'yes_no',
        options: [
          createTestOption({ label: 'Yes', position: 0 }),
          createTestOption({ label: 'No', position: 1 }),
          createTestOption({ label: 'Maybe', position: 2 }),
        ],
      });

      const result = buildResultsDM(poll, { liveResults: true });

      // Yes/No polls use specific emojis
      expect(result).toContain('Yes');
      expect(result).toContain('No');
      expect(result).toContain('Maybe');
    });
  });
});
