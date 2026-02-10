import type { View, KnownBlock } from '@slack/types';

export const MODAL_CALLBACK_ID = 'poll_creation_modal';
export const POLL_TYPE_ACTION_ID = 'poll_type_select';
export const CLOSE_METHOD_ACTION_ID = 'close_method_select';
export const SCHEDULE_METHOD_ACTION_ID = 'schedule_method_select';
export const ADD_MODAL_OPTION_ACTION_ID = 'add_modal_option';
export const REMOVE_MODAL_OPTION_ACTION_ID = 'remove_modal_option';

export interface ModalOptions {
  initialOptions?: number;
  pollType?: string;
  closeMethod?: string;
  scheduleMethod?: string;
  prefill?: {
    question?: string;
    description?: string;
    options?: string[];
    ratingScale?: number;
    anonymous?: boolean;
    allowVoteChange?: boolean;
    liveResults?: boolean;
    allowAddingOptions?: boolean;
    reminders?: boolean;
    includeMaybe?: boolean;
  };
}

export function buildPollCreationModal(opts: ModalOptions = {}): View {
  const {
    initialOptions = 2,
    pollType,
    closeMethod,
    scheduleMethod,
    prefill,
  } = opts;

  const blocks: KnownBlock[] = [];

  // Poll Question
  blocks.push({
    type: 'input',
    block_id: 'question_block',
    label: { type: 'plain_text', text: 'Poll Question' },
    hint: { type: 'plain_text', text: 'Tip: Use :emoji_codes: like :fire: :rocket: :tada:' },
    element: {
      type: 'plain_text_input',
      action_id: 'question_input',
      placeholder: { type: 'plain_text', text: 'What would you like to ask?' },
      max_length: 150,
      ...(prefill?.question ? { initial_value: prefill.question } : {}),
    },
  });

  // Poll Description (optional)
  blocks.push({
    type: 'input',
    block_id: 'description_block',
    optional: true,
    label: { type: 'plain_text', text: 'Description' },
    element: {
      type: 'plain_text_input',
      action_id: 'description_input',
      placeholder: { type: 'plain_text', text: 'Add context or instructions for your poll (optional)' },
      multiline: true,
      max_length: 500,
      ...(prefill?.description ? { initial_value: prefill.description } : {}),
    },
  });

  // Poll Type
  blocks.push({
    type: 'input',
    block_id: 'poll_type_block',
    dispatch_action: true,
    label: { type: 'plain_text', text: 'Poll Type' },
    element: {
      type: 'static_select',
      action_id: POLL_TYPE_ACTION_ID,
      placeholder: { type: 'plain_text', text: 'Select poll type' },
      options: [
        { text: { type: 'plain_text', text: 'Single Choice' }, value: 'single_choice' },
        { text: { type: 'plain_text', text: 'Multi-Select' }, value: 'multi_select' },
        { text: { type: 'plain_text', text: 'Yes / No / Maybe' }, value: 'yes_no' },
        { text: { type: 'plain_text', text: 'Rating Scale' }, value: 'rating' },
      ],
      ...(pollType ? { initial_option: getPollTypeOption(pollType) } : {}),
    },
  });

  // Rating Scale Range (only for rating type)
  if (pollType === 'rating') {
    const ratingVal = prefill?.ratingScale ? String(prefill.ratingScale) : undefined;
    blocks.push({
      type: 'input',
      block_id: 'rating_scale_block',
      label: { type: 'plain_text', text: 'Rating Scale' },
      element: {
        type: 'static_select',
        action_id: 'rating_scale_select',
        placeholder: { type: 'plain_text', text: 'Select scale' },
        options: [
          { text: { type: 'plain_text', text: '1–5' }, value: '5' },
          { text: { type: 'plain_text', text: '1–10' }, value: '10' },
        ],
        ...(ratingVal ? { initial_option: { text: { type: 'plain_text' as const, text: ratingVal === '10' ? '1–10' : '1–5' }, value: ratingVal } } : {}),
      },
    });
  }

  // Include Maybe option (only for yes_no type)
  if (pollType === 'yes_no') {
    const includeMaybeOption = {
      text: { type: 'plain_text' as const, text: 'Include "Maybe" option' },
      value: 'include_maybe',
    };
    const includeMaybeDefault = prefill ? prefill.includeMaybe !== false : true;
    blocks.push({
      type: 'input',
      block_id: 'include_maybe_block',
      optional: true,
      label: { type: 'plain_text', text: 'Maybe Option' },
      element: {
        type: 'checkboxes',
        action_id: 'include_maybe_toggle',
        options: [includeMaybeOption],
        ...(includeMaybeDefault ? { initial_options: [includeMaybeOption] } : {}),
      },
    });
  }

  // Options (hidden for yes_no and rating)
  const showOptions = !pollType || (pollType !== 'yes_no' && pollType !== 'rating');
  if (showOptions) {
    const prefillOpts = prefill?.options || [];
    const optionCount = Math.max(2, Math.min(10, Math.max(initialOptions, prefillOpts.length)));
    for (let i = 0; i < optionCount; i++) {
      blocks.push({
        type: 'input',
        block_id: `option_block_${i}`,
        label: { type: 'plain_text', text: `Option ${i + 1}` },
        optional: i >= 2,
        hint: i === 0 ? { type: 'plain_text', text: 'Emoji codes like :fire: work here too!' } : undefined,
        element: {
          type: 'plain_text_input',
          action_id: `option_input_${i}`,
          placeholder: { type: 'plain_text', text: `Option ${i + 1}` },
          max_length: 200,
          ...(prefillOpts[i] ? { initial_value: prefillOpts[i] } : {}),
        },
      });
    }

    // Add/Remove option buttons
    const optionActions: any[] = [];
    if (optionCount < 10) {
      optionActions.push({
        type: 'button',
        text: { type: 'plain_text', text: '➕ Add Option', emoji: true },
        action_id: ADD_MODAL_OPTION_ACTION_ID,
      });
    }
    if (optionCount > 2) {
      optionActions.push({
        type: 'button',
        text: { type: 'plain_text', text: '➖ Remove Last', emoji: true },
        action_id: REMOVE_MODAL_OPTION_ACTION_ID,
      });
    }
    if (optionActions.length > 0) {
      blocks.push({
        type: 'actions',
        block_id: 'option_actions_block',
        elements: optionActions,
      });
    }
  }

  // Target Channel
  blocks.push({
    type: 'input',
    block_id: 'channel_block',
    label: { type: 'plain_text', text: 'Post to Channel' },
    element: {
      type: 'conversations_select',
      action_id: 'channel_select',
      default_to_current_conversation: true,
      filter: { include: ['public', 'private'], exclude_bot_users: true },
    },
  });

  // Settings divider
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '*Poll Settings*' },
  });

  // Anonymous Voting
  const anonymousOption = {
    text: { type: 'plain_text' as const, text: 'Hide voter identities' },
    value: 'anonymous',
  };
  blocks.push({
    type: 'input',
    block_id: 'anonymous_block',
    optional: true,
    label: { type: 'plain_text', text: 'Anonymous Voting' },
    element: {
      type: 'checkboxes',
      action_id: 'anonymous_toggle',
      options: [anonymousOption],
      ...(prefill?.anonymous ? { initial_options: [anonymousOption] } : {}),
    },
  });

  // Allow Vote Change
  const voteChangeOption = {
    text: { type: 'plain_text' as const, text: 'Let voters update their selection' },
    value: 'vote_change',
  };
  const voteChangeDefault = prefill ? prefill.allowVoteChange : true;
  blocks.push({
    type: 'input',
    block_id: 'vote_change_block',
    optional: true,
    label: { type: 'plain_text', text: 'Allow Vote Change' },
    element: {
      type: 'checkboxes',
      action_id: 'vote_change_toggle',
      options: [voteChangeOption],
      ...(voteChangeDefault !== false ? { initial_options: [voteChangeOption] } : {}),
    },
  });

  // Show Live Results
  const liveResultsOption = {
    text: { type: 'plain_text' as const, text: 'Show results as votes come in' },
    value: 'live_results',
  };
  const liveResultsDefault = prefill ? prefill.liveResults : true;
  blocks.push({
    type: 'input',
    block_id: 'live_results_block',
    optional: true,
    label: { type: 'plain_text', text: 'Show Live Results' },
    element: {
      type: 'checkboxes',
      action_id: 'live_results_toggle',
      options: [liveResultsOption],
      ...(liveResultsDefault !== false ? { initial_options: [liveResultsOption] } : {}),
    },
  });

  // Send Reminders (only useful when poll has a close time)
  const remindersOption = {
    text: { type: 'plain_text' as const, text: 'DM non-voters before the poll closes' },
    value: 'reminders',
  };
  blocks.push({
    type: 'input',
    block_id: 'reminders_block',
    optional: true,
    label: { type: 'plain_text', text: 'Send Reminders' },
    element: {
      type: 'checkboxes',
      action_id: 'reminders_toggle',
      options: [remindersOption],
      ...(prefill?.reminders ? { initial_options: [remindersOption] } : {}),
    },
  });

  // Allow Adding Options (only for single_choice and multi_select)
  if (pollType === 'single_choice' || pollType === 'multi_select') {
    const addOptionsOption = {
      text: { type: 'plain_text' as const, text: 'Let voters add new options' },
      value: 'allow_adding_options',
    };
    blocks.push({
      type: 'input',
      block_id: 'add_options_block',
      optional: true,
      label: { type: 'plain_text', text: 'Voter-Added Options' },
      element: {
        type: 'checkboxes',
        action_id: 'add_options_toggle',
        options: [addOptionsOption],
        ...(prefill?.allowAddingOptions ? { initial_options: [addOptionsOption] } : {}),
      },
    });
  }

  // Close Method
  blocks.push({
    type: 'input',
    block_id: 'close_method_block',
    dispatch_action: true,
    optional: true,
    label: { type: 'plain_text', text: 'Close Method' },
    element: {
      type: 'static_select',
      action_id: CLOSE_METHOD_ACTION_ID,
      placeholder: { type: 'plain_text', text: 'Manual (default)' },
      options: [
        { text: { type: 'plain_text', text: 'Manual' }, value: 'manual' },
        { text: { type: 'plain_text', text: 'After Duration' }, value: 'duration' },
        { text: { type: 'plain_text', text: 'At Date/Time' }, value: 'datetime' },
      ],
      ...(closeMethod ? { initial_option: getCloseMethodOption(closeMethod) } : {}),
    },
  });

  // Duration input (conditional)
  if (closeMethod === 'duration') {
    blocks.push({
      type: 'input',
      block_id: 'duration_block',
      label: { type: 'plain_text', text: 'Duration (hours)' },
      element: {
        type: 'plain_text_input',
        action_id: 'duration_input',
        placeholder: { type: 'plain_text', text: 'e.g. 24' },
      },
    });
  }

  // Datetime picker (conditional)
  if (closeMethod === 'datetime') {
    blocks.push({
      type: 'input',
      block_id: 'datetime_block',
      label: { type: 'plain_text', text: 'Close At' },
      element: {
        type: 'datetimepicker',
        action_id: 'datetime_input',
      },
    });
  }

  // Scheduling divider
  blocks.push({ type: 'divider' });
  blocks.push({
    type: 'section',
    text: { type: 'mrkdwn', text: '*Scheduling*' },
  });

  // Post Timing
  blocks.push({
    type: 'input',
    block_id: 'schedule_method_block',
    dispatch_action: true,
    optional: true,
    label: { type: 'plain_text', text: 'Post Timing' },
    element: {
      type: 'static_select',
      action_id: SCHEDULE_METHOD_ACTION_ID,
      placeholder: { type: 'plain_text', text: 'Post Immediately (default)' },
      options: [
        { text: { type: 'plain_text', text: 'Post Immediately' }, value: 'now' },
        { text: { type: 'plain_text', text: 'Schedule for Later' }, value: 'scheduled' },
      ],
      ...(scheduleMethod ? { initial_option: getScheduleMethodOption(scheduleMethod) } : {}),
    },
  });

  // Schedule datetime picker (conditional)
  if (scheduleMethod === 'scheduled') {
    blocks.push({
      type: 'input',
      block_id: 'schedule_datetime_block',
      label: { type: 'plain_text', text: 'Schedule For' },
      element: {
        type: 'datetimepicker',
        action_id: 'schedule_datetime_input',
      },
    });
  }

  const isScheduled = scheduleMethod === 'scheduled';

  return {
    type: 'modal',
    callback_id: MODAL_CALLBACK_ID,
    title: { type: 'plain_text', text: 'Create a Poll' },
    submit: { type: 'plain_text', text: isScheduled ? 'Schedule Poll' : 'Create Poll' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks,
  };
}

function getPollTypeOption(value: string) {
  const map: Record<string, string> = {
    single_choice: 'Single Choice',
    multi_select: 'Multi-Select',
    yes_no: 'Yes / No / Maybe',
    rating: 'Rating Scale',
  };
  return { text: { type: 'plain_text' as const, text: map[value] || value }, value };
}

function getCloseMethodOption(value: string) {
  const map: Record<string, string> = {
    manual: 'Manual',
    duration: 'After Duration',
    datetime: 'At Date/Time',
  };
  return { text: { type: 'plain_text' as const, text: map[value] || value }, value };
}

function getScheduleMethodOption(value: string) {
  const map: Record<string, string> = {
    now: 'Post Immediately',
    scheduled: 'Schedule for Later',
  };
  return { text: { type: 'plain_text' as const, text: map[value] || value }, value };
}
