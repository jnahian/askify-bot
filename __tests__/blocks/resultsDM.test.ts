/**
 * Tests for resultsDM and creatorNotifyDM block builders
 * Coverage of DM message generation for results and notifications
 */

import { buildResultsDMBlocks } from '../../src/blocks/resultsDM';
import { buildCreatorNotifyDM } from '../../src/blocks/creatorNotifyDM';
import { createTestPoll, createTestOption } from '../fixtures/testData';

describe('resultsDM blocks', () => {
  describe('buildResultsDMBlocks', () => {
    it('should build blocks with header and results', () => {
      const poll = createTestPoll({ question: 'Favorite Color?' });

      const result = buildResultsDMBlocks(poll, { liveResults: true });

      expect(result.blocks).toBeDefined();
      expect(result.text).toBe('Poll Results: Favorite Color?');

      // Check header
      const headerBlock = result.blocks[0];
      expect(headerBlock.type).toBe('header');
      expect((headerBlock as any).text.text).toBe('Poll Results: Favorite Color?');
    });

    it('should include context with vote count and channel', () => {
      const poll = createTestPoll({
        channelId: 'C123456',
        _count: { votes: 15 },
      });

      const result = buildResultsDMBlocks(poll, { liveResults: true });

      const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;
      expect(contextBlock).toBeDefined();
      expect(contextBlock.elements[0].text).toContain('15 total votes');
      expect(contextBlock.elements[0].text).toContain('<#C123456>');
    });

    it('should use singular "vote" for 1 vote', () => {
      const poll = createTestPoll({ _count: { votes: 1 } });

      const result = buildResultsDMBlocks(poll, { liveResults: true });

      const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;
      expect(contextBlock.elements[0].text).toContain('1 total vote');
      expect(contextBlock.elements[0].text).not.toContain('votes');
    });

    it('should include description when provided', () => {
      const poll = createTestPoll();

      const result = buildResultsDMBlocks(poll, {
        description: 'Team preferences survey',
        liveResults: true,
      });

      const descriptionBlock = result.blocks.find(
        (b: any) => b.type === 'section' && b.text?.text?.includes('Team preferences')
      );
      expect(descriptionBlock).toBeDefined();
    });

    it('should show options with bar charts', () => {
      const poll = createTestPoll({
        _count: { votes: 10 },
        options: [
          createTestOption({ label: 'Red', _count: { votes: 7 } }),
          createTestOption({ label: 'Blue', _count: { votes: 3 } }),
        ],
      });

      const result = buildResultsDMBlocks(poll, { liveResults: true });

      const optionBlocks = result.blocks.filter(
        (b: any) => b.type === 'section' && b.text?.text?.includes('%')
      );
      expect(optionBlocks.length).toBeGreaterThanOrEqual(2);

      const redBlock = result.blocks.find(
        (b: any) => b.type === 'section' && b.text?.text?.includes('Red')
      );
      expect(redBlock).toBeDefined();
    });

    it('should show voter names when not anonymous', () => {
      const poll = createTestPoll();
      const voterNames = new Map<string, string[]>();
      voterNames.set('opt-1', ['U123', 'U456', 'U789']);

      const result = buildResultsDMBlocks(poll, { liveResults: true }, voterNames);

      const blockWithVoters = result.blocks.find(
        (b: any) => b.type === 'section' && b.text?.text?.includes('Voters:')
      );
      expect(blockWithVoters).toBeDefined();
      expect((blockWithVoters as any).text.text).toContain('<@U123>');
      expect((blockWithVoters as any).text.text).toContain('<@U456>');
    });

    it('should not show voter names when anonymous', () => {
      const poll = createTestPoll();
      const voterNames = new Map<string, string[]>();
      voterNames.set('opt-1', ['U123', 'U456']);

      const result = buildResultsDMBlocks(poll, { anonymous: true }, voterNames);

      const blockWithVoters = result.blocks.find(
        (b: any) => b.type === 'section' && b.text?.text?.includes('Voters:')
      );
      expect(blockWithVoters).toBeUndefined();
    });

    it('should not show voter names when no voters', () => {
      const poll = createTestPoll();
      const voterNames = new Map<string, string[]>();
      voterNames.set('opt-1', []);

      const result = buildResultsDMBlocks(poll, { liveResults: true }, voterNames);

      const blockWithVoters = result.blocks.find(
        (b: any) => b.type === 'section' && b.text?.text?.includes('Voters:')
      );
      expect(blockWithVoters).toBeUndefined();
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

        const result = buildResultsDMBlocks(poll, { liveResults: true });

        const avgBlock = result.blocks.find(
          (b: any) => b.type === 'section' && b.text?.text?.includes('Average Rating')
        );
        expect(avgBlock).toBeDefined();
      });

      it('should calculate correct average rating', () => {
        // Average: (1*2 + 2*3 + 3*5) / 10 = 2.3
        const poll = createTestPoll({
          pollType: 'rating',
          _count: { votes: 10 },
          options: [
            createTestOption({ label: '1', _count: { votes: 2 } }),
            createTestOption({ label: '2', _count: { votes: 3 } }),
            createTestOption({ label: '3', _count: { votes: 5 } }),
          ],
        });

        const result = buildResultsDMBlocks(poll, { liveResults: true });

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

        const result = buildResultsDMBlocks(poll, { liveResults: true });

        const avgBlock = result.blocks.find(
          (b: any) => b.text?.text?.includes('Average Rating')
        );
        expect(avgBlock).toBeUndefined();
      });

      it('should not show average rating for non-rating polls', () => {
        const poll = createTestPoll({
          pollType: 'single_choice',
          _count: { votes: 10 },
        });

        const result = buildResultsDMBlocks(poll, { liveResults: true });

        const avgBlock = result.blocks.find(
          (b: any) => b.text?.text?.includes('Average Rating')
        );
        expect(avgBlock).toBeUndefined();
      });
    });

    describe('action buttons', () => {
      it('should include Share Results button', () => {
        const poll = createTestPoll({ id: 'poll-123' });

        const result = buildResultsDMBlocks(poll, { liveResults: true });

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        expect(actionsBlock).toBeDefined();

        const shareButton = actionsBlock.elements.find(
          (e: any) => e.action_id === 'share_results'
        );
        expect(shareButton).toBeDefined();
        expect(shareButton.text.text).toContain('Share Results');
        expect(shareButton.value).toBe('poll-123');
        expect(shareButton.style).toBe('primary');
      });

      it('should include Repost button', () => {
        const poll = createTestPoll({ id: 'poll-456' });

        const result = buildResultsDMBlocks(poll, { liveResults: true });

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        const repostButton = actionsBlock.elements.find(
          (e: any) => e.action_id === 'repost_poll_poll-456'
        );
        expect(repostButton).toBeDefined();
        expect(repostButton.text.text).toContain('Repost');
        expect(repostButton.value).toBe('poll-456');
      });

      it('should include Schedule Repost button', () => {
        const poll = createTestPoll({ id: 'poll-789' });

        const result = buildResultsDMBlocks(poll, { liveResults: true });

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        const scheduleButton = actionsBlock.elements.find(
          (e: any) => e.action_id === 'schedule_repost_poll-789'
        );
        expect(scheduleButton).toBeDefined();
        expect(scheduleButton.text.text).toContain('Schedule Repost');
      });

      it('should have all three action buttons', () => {
        const poll = createTestPoll();

        const result = buildResultsDMBlocks(poll, { liveResults: true });

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        expect(actionsBlock.elements).toHaveLength(3);
      });
    });

    it('should handle polls with zero votes', () => {
      const poll = createTestPoll({ _count: { votes: 0 } });

      const result = buildResultsDMBlocks(poll, { liveResults: true });

      expect(result.blocks).toBeDefined();
      const contextBlock = result.blocks.find((b: any) => b.type === 'context') as any;
      expect(contextBlock.elements[0].text).toContain('0 total votes');
    });

    it('should include dividers for structure', () => {
      const poll = createTestPoll();

      const result = buildResultsDMBlocks(poll, { liveResults: true });

      const dividers = result.blocks.filter((b: any) => b.type === 'divider');
      expect(dividers.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('buildCreatorNotifyDM', () => {
    it('should build notification with live message', () => {
      const poll = createTestPoll({
        question: 'Team Lunch?',
        channelId: 'C123',
      });

      const result = buildCreatorNotifyDM(poll);

      expect(result.blocks).toBeDefined();
      expect(result.text).toBe('Your poll "Team Lunch?" is now live!');

      const sectionBlock = result.blocks.find((b: any) => b.type === 'section') as any;
      expect(sectionBlock).toBeDefined();
      expect(sectionBlock.text.text).toContain('Team Lunch?');
      expect(sectionBlock.text.text).toContain('is now live');
      expect(sectionBlock.text.text).toContain('<#C123>');
    });

    it('should show recovery note when isRecovery is true', () => {
      const poll = createTestPoll({ question: 'Test Poll?' });

      const result = buildCreatorNotifyDM(poll, { isRecovery: true });

      const sectionBlock = result.blocks.find((b: any) => b.type === 'section') as any;
      expect(sectionBlock.text.text).toContain('posted on startup recovery');
    });

    it('should not show recovery note when isRecovery is false', () => {
      const poll = createTestPoll({ question: 'Test Poll?' });

      const result = buildCreatorNotifyDM(poll, { isRecovery: false });

      const sectionBlock = result.blocks.find((b: any) => b.type === 'section') as any;
      expect(sectionBlock.text.text).not.toContain('startup recovery');
    });

    it('should not show recovery note by default', () => {
      const poll = createTestPoll({ question: 'Test Poll?' });

      const result = buildCreatorNotifyDM(poll);

      const sectionBlock = result.blocks.find((b: any) => b.type === 'section') as any;
      expect(sectionBlock.text.text).not.toContain('startup recovery');
    });

    describe('action buttons', () => {
      it('should include Save as Template button', () => {
        const poll = createTestPoll({ id: 'poll-123' });

        const result = buildCreatorNotifyDM(poll);

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        expect(actionsBlock).toBeDefined();

        const saveButton = actionsBlock.elements.find(
          (e: any) => e.action_id === 'save_as_template'
        );
        expect(saveButton).toBeDefined();
        expect(saveButton.text.text).toContain('Save as Template');
        expect(saveButton.value).toBe('poll-123');
        expect(saveButton.style).toBe('primary');
      });

      it('should include Close Poll button', () => {
        const poll = createTestPoll({ id: 'poll-456' });

        const result = buildCreatorNotifyDM(poll);

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        const closeButton = actionsBlock.elements.find(
          (e: any) => e.action_id === 'close_poll'
        );
        expect(closeButton).toBeDefined();
        expect(closeButton.text.text).toContain('Close Poll');
        expect(closeButton.value).toBe('poll-456');
        expect(closeButton.style).toBe('danger');
      });

      it('should have confirmation dialog on Close Poll button', () => {
        const poll = createTestPoll();

        const result = buildCreatorNotifyDM(poll);

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        const closeButton = actionsBlock.elements.find(
          (e: any) => e.action_id === 'close_poll'
        );
        expect(closeButton.confirm).toBeDefined();
        expect(closeButton.confirm.title.text).toContain('Close this poll?');
        expect(closeButton.confirm.text.text).toContain('end voting');
      });

      it('should have both action buttons', () => {
        const poll = createTestPoll();

        const result = buildCreatorNotifyDM(poll);

        const actionsBlock = result.blocks.find((b: any) => b.type === 'actions') as any;
        expect(actionsBlock.elements).toHaveLength(2);
      });
    });

    it('should handle long poll questions', () => {
      const poll = createTestPoll({
        question: 'What is your opinion on the new company policy regarding remote work and flexible hours?',
        channelId: 'C999',
      });

      const result = buildCreatorNotifyDM(poll);

      expect(result.text).toBe('Your poll "What is your opinion on the new company policy regarding remote work and flexible hours?" is now live!');
      const sectionBlock = result.blocks.find((b: any) => b.type === 'section') as any;
      expect(sectionBlock.text.text).toContain('regarding remote work');
    });

    it('should use checkmark emoji in notification', () => {
      const poll = createTestPoll();

      const result = buildCreatorNotifyDM(poll);

      const sectionBlock = result.blocks.find((b: any) => b.type === 'section') as any;
      expect(sectionBlock.text.text).toContain(':white_check_mark:');
    });

    it('should handle isScheduled option', () => {
      const poll = createTestPoll();

      // isScheduled is in the interface but not currently used in the implementation
      const result = buildCreatorNotifyDM(poll, { isScheduled: true });

      expect(result.blocks).toBeDefined();
      expect(result.blocks.length).toBeGreaterThan(0);
    });
  });
});
