/**
 * Tests for poll creation modal builder
 * Covers all poll types, close methods, schedules, and conditional blocks
 */

import {
  buildPollCreationModal,
  MODAL_CALLBACK_ID,
  EDIT_MODAL_CALLBACK_ID,
  POLL_TYPE_ACTION_ID,
  CLOSE_METHOD_ACTION_ID,
  SCHEDULE_METHOD_ACTION_ID,
  ADD_MODAL_OPTION_ACTION_ID,
  REMOVE_MODAL_OPTION_ACTION_ID,
} from '../../src/views/pollCreationModal';

describe('buildPollCreationModal', () => {
  describe('basic structure', () => {
    it('should build modal with default settings', () => {
      const modal = buildPollCreationModal() as any;

      expect(modal.type).toBe('modal');
      expect(modal.callback_id).toBe(MODAL_CALLBACK_ID);
      expect((modal as any).title.text).toBe('Create a Poll');
      expect((modal as any).submit.text).toBe('Create Poll');
      expect(modal.close.text).toBe('Cancel');
      expect(modal.blocks.length).toBeGreaterThan(0);
    });

    it('should include question input block', () => {
      const modal = buildPollCreationModal();
      const questionBlock = modal.blocks.find((b: any) => b.block_id === 'question_block');

      expect(questionBlock).toBeDefined();
      expect(questionBlock).toMatchObject({
        type: 'input',
        label: { type: 'plain_text', text: 'Poll Question' },
      });
    });

    it('should include description input block', () => {
      const modal = buildPollCreationModal();
      const descBlock = modal.blocks.find((b: any) => b.block_id === 'description_block');

      expect(descBlock).toBeDefined();
      expect(descBlock).toMatchObject({
        type: 'input',
        optional: true,
        label: { type: 'plain_text', text: 'Description' },
      });
    });

    it('should include poll type selector', () => {
      const modal = buildPollCreationModal();
      const typeBlock = modal.blocks.find((b: any) => b.block_id === 'poll_type_block');

      expect(typeBlock).toBeDefined();
      expect(typeBlock).toMatchObject({
        type: 'input',
        dispatch_action: true,
      });
      expect((typeBlock as any).element.action_id).toBe(POLL_TYPE_ACTION_ID);
    });

    it('should include channel selector', () => {
      const modal = buildPollCreationModal();
      const channelBlock = modal.blocks.find((b: any) => b.block_id === 'channel_block');

      expect(channelBlock).toBeDefined();
      expect(channelBlock).toMatchObject({
        type: 'input',
        label: { type: 'plain_text', text: 'Post to Channel' },
      });
    });

    it('should include settings checkboxes', () => {
      const modal = buildPollCreationModal();
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block');

      expect(settingsBlock).toBeDefined();
      expect(settingsBlock).toMatchObject({
        type: 'input',
        optional: true,
        label: { type: 'plain_text', text: 'Poll Settings' },
      });
    });
  });

  describe('poll types', () => {
    it('should show option inputs for single_choice', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice' });
      const option0 = modal.blocks.find((b: any) => b.block_id === 'option_block_0');
      const option1 = modal.blocks.find((b: any) => b.block_id === 'option_block_1');

      expect(option0).toBeDefined();
      expect(option1).toBeDefined();
    });

    it('should show option inputs for multi_select', () => {
      const modal = buildPollCreationModal({ pollType: 'multi_select' });
      const option0 = modal.blocks.find((b: any) => b.block_id === 'option_block_0');

      expect(option0).toBeDefined();
    });

    it('should NOT show option inputs for yes_no', () => {
      const modal = buildPollCreationModal({ pollType: 'yes_no' });
      const option0 = modal.blocks.find((b: any) => b.block_id === 'option_block_0');

      expect(option0).toBeUndefined();
    });

    it('should NOT show option inputs for rating', () => {
      const modal = buildPollCreationModal({ pollType: 'rating' });
      const option0 = modal.blocks.find((b: any) => b.block_id === 'option_block_0');

      expect(option0).toBeUndefined();
    });

    it('should show rating scale selector for rating type', () => {
      const modal = buildPollCreationModal({ pollType: 'rating' });
      const ratingBlock = modal.blocks.find((b: any) => b.block_id === 'rating_scale_block');

      expect(ratingBlock).toBeDefined();
      expect(ratingBlock).toMatchObject({
        type: 'input',
        label: { type: 'plain_text', text: 'Rating Scale' },
      });
    });

    it('should NOT show rating scale for non-rating types', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice' });
      const ratingBlock = modal.blocks.find((b: any) => b.block_id === 'rating_scale_block');

      expect(ratingBlock).toBeUndefined();
    });

    it('should show include maybe checkbox for yes_no type', () => {
      const modal = buildPollCreationModal({ pollType: 'yes_no' });
      const maybeBlock = modal.blocks.find((b: any) => b.block_id === 'include_maybe_block');

      expect(maybeBlock).toBeDefined();
      expect(maybeBlock).toMatchObject({
        type: 'input',
        optional: true,
        label: { type: 'plain_text', text: 'Maybe Option' },
      });
    });

    it('should NOT show include maybe for non-yes_no types', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice' });
      const maybeBlock = modal.blocks.find((b: any) => b.block_id === 'include_maybe_block');

      expect(maybeBlock).toBeUndefined();
    });
  });

  describe('option count', () => {
    it('should create 2 option inputs by default', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice' });
      const option0 = modal.blocks.find((b: any) => b.block_id === 'option_block_0');
      const option1 = modal.blocks.find((b: any) => b.block_id === 'option_block_1');
      const option2 = modal.blocks.find((b: any) => b.block_id === 'option_block_2');

      expect(option0).toBeDefined();
      expect(option1).toBeDefined();
      expect(option2).toBeUndefined();
    });

    it('should create specified number of option inputs', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice', initialOptions: 5 });
      const option4 = modal.blocks.find((b: any) => b.block_id === 'option_block_4');
      const option5 = modal.blocks.find((b: any) => b.block_id === 'option_block_5');

      expect(option4).toBeDefined();
      expect(option5).toBeUndefined();
    });

    it('should limit options to 10 maximum', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice', initialOptions: 15 });
      const option9 = modal.blocks.find((b: any) => b.block_id === 'option_block_9');
      const option10 = modal.blocks.find((b: any) => b.block_id === 'option_block_10');

      expect(option9).toBeDefined();
      expect(option10).toBeUndefined();
    });

    it('should show add option button when less than 10 options', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice', initialOptions: 5 });
      const actionsBlock = modal.blocks.find((b: any) => b.block_id === 'option_actions_block');

      expect(actionsBlock).toBeDefined();
      const addButton = (actionsBlock as any).elements.find((e: any) => e.action_id === ADD_MODAL_OPTION_ACTION_ID);
      expect(addButton).toBeDefined();
    });

    it('should NOT show add button when 10 options', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice', initialOptions: 10 });
      const actionsBlock = modal.blocks.find((b: any) => b.block_id === 'option_actions_block');

      if (actionsBlock) {
        const addButton = (actionsBlock as any).elements.find((e: any) => e.action_id === ADD_MODAL_OPTION_ACTION_ID);
        expect(addButton).toBeUndefined();
      } else {
        // If no actions block, that's also valid (no add/remove buttons)
        expect(actionsBlock).toBeUndefined();
      }
    });

    it('should show remove button when more than 2 options', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice', initialOptions: 5 });
      const actionsBlock = modal.blocks.find((b: any) => b.block_id === 'option_actions_block');

      expect(actionsBlock).toBeDefined();
      const removeButton = (actionsBlock as any).elements.find((e: any) => e.action_id === REMOVE_MODAL_OPTION_ACTION_ID);
      expect(removeButton).toBeDefined();
    });

    it('should NOT show remove button when 2 options', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice', initialOptions: 2 });
      const actionsBlock = modal.blocks.find((b: any) => b.block_id === 'option_actions_block');

      if (actionsBlock) {
        const removeButton = (actionsBlock as any).elements.find((e: any) => e.action_id === REMOVE_MODAL_OPTION_ACTION_ID);
        expect(removeButton).toBeUndefined();
      } else {
        // If no actions block, that's also valid (no add/remove buttons)
        expect(actionsBlock).toBeUndefined();
      }
    });

    it('should mark first 2 options as required', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice', initialOptions: 5 });
      const option0 = modal.blocks.find((b: any) => b.block_id === 'option_block_0') as any;
      const option1 = modal.blocks.find((b: any) => b.block_id === 'option_block_1') as any;
      const option2 = modal.blocks.find((b: any) => b.block_id === 'option_block_2') as any;

      expect(option0.optional).toBeFalsy();
      expect(option1.optional).toBeFalsy();
      expect(option2.optional).toBe(true);
    });
  });

  describe('close method', () => {
    it('should show close method selector', () => {
      const modal = buildPollCreationModal();
      const closeBlock = modal.blocks.find((b: any) => b.block_id === 'close_method_block');

      expect(closeBlock).toBeDefined();
      expect((closeBlock as any).element.action_id).toBe(CLOSE_METHOD_ACTION_ID);
    });

    it('should show duration input when closeMethod is duration', () => {
      const modal = buildPollCreationModal({ closeMethod: 'duration' });
      const durationBlock = modal.blocks.find((b: any) => b.block_id === 'duration_block');

      expect(durationBlock).toBeDefined();
      expect(durationBlock).toMatchObject({
        type: 'input',
        label: { type: 'plain_text', text: 'Duration (hours)' },
      });
    });

    it('should NOT show duration input for manual close', () => {
      const modal = buildPollCreationModal({ closeMethod: 'manual' });
      const durationBlock = modal.blocks.find((b: any) => b.block_id === 'duration_block');

      expect(durationBlock).toBeUndefined();
    });

    it('should show datetime picker when closeMethod is datetime', () => {
      const modal = buildPollCreationModal({ closeMethod: 'datetime' });
      const datetimeBlock = modal.blocks.find((b: any) => b.block_id === 'datetime_block');

      expect(datetimeBlock).toBeDefined();
      expect(datetimeBlock).toMatchObject({
        type: 'input',
        label: { type: 'plain_text', text: 'Close At' },
      });
    });

    it('should NOT show datetime picker for manual close', () => {
      const modal = buildPollCreationModal({ closeMethod: 'manual' });
      const datetimeBlock = modal.blocks.find((b: any) => b.block_id === 'datetime_block');

      expect(datetimeBlock).toBeUndefined();
    });
  });

  describe('schedule method', () => {
    it('should show schedule method selector', () => {
      const modal = buildPollCreationModal();
      const scheduleBlock = modal.blocks.find((b: any) => b.block_id === 'schedule_method_block');

      expect(scheduleBlock).toBeDefined();
      expect((scheduleBlock as any).element.action_id).toBe(SCHEDULE_METHOD_ACTION_ID);
    });

    it('should show schedule datetime picker when scheduled', () => {
      const modal = buildPollCreationModal({ scheduleMethod: 'scheduled' });
      const scheduleDateBlock = modal.blocks.find((b: any) => b.block_id === 'schedule_datetime_block');

      expect(scheduleDateBlock).toBeDefined();
      expect(scheduleDateBlock).toMatchObject({
        type: 'input',
        label: { type: 'plain_text', text: 'Schedule For' },
      });
    });

    it('should NOT show schedule datetime picker for immediate posting', () => {
      const modal = buildPollCreationModal({ scheduleMethod: 'now' });
      const scheduleDateBlock = modal.blocks.find((b: any) => b.block_id === 'schedule_datetime_block');

      expect(scheduleDateBlock).toBeUndefined();
    });

    it('should change submit text to "Schedule Poll" when scheduled', () => {
      const modal = buildPollCreationModal({ scheduleMethod: 'scheduled' });

      expect((modal as any).submit.text).toBe('Schedule Poll');
    });

    it('should use "Create Poll" submit text for immediate posting', () => {
      const modal = buildPollCreationModal({ scheduleMethod: 'now' });

      expect((modal as any).submit.text).toBe('Create Poll');
    });
  });

  describe('settings options', () => {
    it('should include allow adding options for single_choice', () => {
      const modal = buildPollCreationModal({ pollType: 'single_choice' });
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasAddOptions = settingsBlock.element.options.some(
        (opt: any) => opt.value === 'allow_adding_options'
      );

      expect(hasAddOptions).toBe(true);
    });

    it('should include allow adding options for multi_select', () => {
      const modal = buildPollCreationModal({ pollType: 'multi_select' });
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasAddOptions = settingsBlock.element.options.some(
        (opt: any) => opt.value === 'allow_adding_options'
      );

      expect(hasAddOptions).toBe(true);
    });

    it('should NOT include allow adding options for yes_no', () => {
      const modal = buildPollCreationModal({ pollType: 'yes_no' });
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasAddOptions = settingsBlock.element.options.some(
        (opt: any) => opt.value === 'allow_adding_options'
      );

      expect(hasAddOptions).toBe(false);
    });

    it('should NOT include allow adding options for rating', () => {
      const modal = buildPollCreationModal({ pollType: 'rating' });
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasAddOptions = settingsBlock.element.options.some(
        (opt: any) => opt.value === 'allow_adding_options'
      );

      expect(hasAddOptions).toBe(false);
    });

    it('should include common settings for all poll types', () => {
      const modal = buildPollCreationModal({ pollType: 'yes_no' });
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const options = settingsBlock.element.options.map((o: any) => o.value);

      expect(options).toContain('anonymous');
      expect(options).toContain('vote_change');
      expect(options).toContain('live_results');
      expect(options).toContain('reminders');
    });
  });

  describe('prefill values', () => {
    it('should prefill question', () => {
      const modal = buildPollCreationModal({
        prefill: { question: 'Prefilled Question?' },
      });
      const questionBlock = modal.blocks.find((b: any) => b.block_id === 'question_block') as any;

      expect(questionBlock.element.initial_value).toBe('Prefilled Question?');
    });

    it('should prefill description', () => {
      const modal = buildPollCreationModal({
        prefill: { description: 'Test description' },
      });
      const descBlock = modal.blocks.find((b: any) => b.block_id === 'description_block') as any;

      expect(descBlock.element.initial_value).toBe('Test description');
    });

    it('should prefill option values', () => {
      const modal = buildPollCreationModal({
        pollType: 'single_choice',
        prefill: { options: ['Option A', 'Option B', 'Option C'] },
      });
      const option0 = modal.blocks.find((b: any) => b.block_id === 'option_block_0') as any;
      const option1 = modal.blocks.find((b: any) => b.block_id === 'option_block_1') as any;
      const option2 = modal.blocks.find((b: any) => b.block_id === 'option_block_2') as any;

      expect(option0.element.initial_value).toBe('Option A');
      expect(option1.element.initial_value).toBe('Option B');
      expect(option2.element.initial_value).toBe('Option C');
    });

    it('should use prefill options length for option count', () => {
      const modal = buildPollCreationModal({
        pollType: 'single_choice',
        prefill: { options: ['A', 'B', 'C', 'D', 'E'] },
      });
      const option4 = modal.blocks.find((b: any) => b.block_id === 'option_block_4');

      expect(option4).toBeDefined();
    });

    it('should prefill rating scale', () => {
      const modal = buildPollCreationModal({
        pollType: 'rating',
        prefill: { ratingScale: 10 },
      });
      const ratingBlock = modal.blocks.find((b: any) => b.block_id === 'rating_scale_block') as any;

      expect(ratingBlock.element.initial_option.value).toBe('10');
    });

    it('should prefill anonymous setting', () => {
      const modal = buildPollCreationModal({
        prefill: { anonymous: true },
      });
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasAnonymous = settingsBlock.element.initial_options?.some(
        (opt: any) => opt.value === 'anonymous'
      );

      expect(hasAnonymous).toBe(true);
    });

    it('should default vote_change to true', () => {
      const modal = buildPollCreationModal();
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasVoteChange = settingsBlock.element.initial_options?.some(
        (opt: any) => opt.value === 'vote_change'
      );

      expect(hasVoteChange).toBe(true);
    });

    it('should default live_results to true', () => {
      const modal = buildPollCreationModal();
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasLiveResults = settingsBlock.element.initial_options?.some(
        (opt: any) => opt.value === 'live_results'
      );

      expect(hasLiveResults).toBe(true);
    });

    it('should prefill reminders setting', () => {
      const modal = buildPollCreationModal({
        prefill: { reminders: true },
      });
      const settingsBlock = modal.blocks.find((b: any) => b.block_id === 'settings_block') as any;
      const hasReminders = settingsBlock.element.initial_options?.some(
        (opt: any) => opt.value === 'reminders'
      );

      expect(hasReminders).toBe(true);
    });

    it('should prefill closesAt datetime', () => {
      const futureDate = new Date(Date.now() + 86400000);
      const modal = buildPollCreationModal({
        closeMethod: 'datetime',
        prefill: { closesAt: futureDate },
      });
      const datetimeBlock = modal.blocks.find((b: any) => b.block_id === 'datetime_block') as any;

      expect(datetimeBlock.element.initial_date_time).toBe(Math.floor(futureDate.getTime() / 1000));
    });

    it('should prefill scheduledAt datetime', () => {
      const futureDate = new Date(Date.now() + 86400000);
      const modal = buildPollCreationModal({
        scheduleMethod: 'scheduled',
        prefill: { scheduledAt: futureDate },
      });
      const scheduleBlock = modal.blocks.find((b: any) => b.block_id === 'schedule_datetime_block') as any;

      expect(scheduleBlock.element.initial_date_time).toBe(Math.floor(futureDate.getTime() / 1000));
    });

    it('should prefill includeMaybe as true by default for yes_no', () => {
      const modal = buildPollCreationModal({ pollType: 'yes_no' });
      const maybeBlock = modal.blocks.find((b: any) => b.block_id === 'include_maybe_block') as any;

      expect(maybeBlock.element.initial_options).toBeDefined();
      expect(maybeBlock.element.initial_options.length).toBe(1);
    });

    it('should respect includeMaybe false in prefill', () => {
      const modal = buildPollCreationModal({
        pollType: 'yes_no',
        prefill: { includeMaybe: false },
      });
      const maybeBlock = modal.blocks.find((b: any) => b.block_id === 'include_maybe_block') as any;

      expect(maybeBlock.element.initial_options).toBeUndefined();
    });
  });

  describe('edit mode', () => {
    it('should use edit callback ID when specified', () => {
      const modal = buildPollCreationModal({ callbackId: EDIT_MODAL_CALLBACK_ID });

      expect(modal.callback_id).toBe(EDIT_MODAL_CALLBACK_ID);
    });

    it('should change title to "Edit Poll" in edit mode', () => {
      const modal = buildPollCreationModal({ callbackId: EDIT_MODAL_CALLBACK_ID });

      expect((modal as any).title.text).toBe('Edit Poll');
    });

    it('should change submit text to "Save Changes" in edit mode', () => {
      const modal = buildPollCreationModal({ callbackId: EDIT_MODAL_CALLBACK_ID });

      expect((modal as any).submit.text).toBe('Save Changes');
    });

    it('should include private metadata when specified', () => {
      const modal = buildPollCreationModal({ privateMetadata: 'poll-123' });

      expect(modal.private_metadata).toBe('poll-123');
    });
  });

  describe('channel selection', () => {
    it('should default to current conversation when no initial channel', () => {
      const modal = buildPollCreationModal();
      const channelBlock = modal.blocks.find((b: any) => b.block_id === 'channel_block') as any;

      expect(channelBlock.element.default_to_current_conversation).toBe(true);
    });

    it('should use initial_conversation when initialChannel specified', () => {
      const modal = buildPollCreationModal({ initialChannel: 'C123' });
      const channelBlock = modal.blocks.find((b: any) => b.block_id === 'channel_block') as any;

      expect(channelBlock.element.initial_conversation).toBe('C123');
      expect(channelBlock.element.default_to_current_conversation).toBeUndefined();
    });
  });

  describe('complex combinations', () => {
    it('should handle edit mode + scheduled + duration close', () => {
      const modal = buildPollCreationModal({
        callbackId: EDIT_MODAL_CALLBACK_ID,
        scheduleMethod: 'scheduled',
        closeMethod: 'duration',
      });

      expect((modal as any).title.text).toBe('Edit Poll');
      expect((modal as any).submit.text).toBe('Save Changes');
      expect(modal.blocks.find((b: any) => b.block_id === 'schedule_datetime_block')).toBeDefined();
      expect(modal.blocks.find((b: any) => b.block_id === 'duration_block')).toBeDefined();
    });

    it('should handle rating poll with all settings', () => {
      const modal = buildPollCreationModal({
        pollType: 'rating',
        closeMethod: 'datetime',
        scheduleMethod: 'scheduled',
        prefill: {
          question: 'Rate us',
          ratingScale: 10,
          anonymous: true,
          reminders: true,
        },
      });

      expect(modal.blocks.find((b: any) => b.block_id === 'rating_scale_block')).toBeDefined();
      expect(modal.blocks.find((b: any) => b.block_id === 'option_block_0')).toBeUndefined();
      expect(modal.blocks.find((b: any) => b.block_id === 'datetime_block')).toBeDefined();
      expect(modal.blocks.find((b: any) => b.block_id === 'schedule_datetime_block')).toBeDefined();
    });

    it('should handle multi_select with 10 options', () => {
      const options = Array.from({ length: 10 }, (_, i) => `Option ${i + 1}`);
      const modal = buildPollCreationModal({
        pollType: 'multi_select',
        prefill: { options },
      });

      expect(modal.blocks.find((b: any) => b.block_id === 'option_block_9')).toBeDefined();

      const actionsBlock = modal.blocks.find((b: any) => b.block_id === 'option_actions_block');
      if (actionsBlock) {
        const addButton = (actionsBlock as any).elements.find((e: any) => e.action_id === ADD_MODAL_OPTION_ACTION_ID);
        expect(addButton).toBeUndefined();
      }
    });
  });
});
