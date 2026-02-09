import type { View, KnownBlock } from '@slack/types';

export const MODAL_CALLBACK_ID = 'poll_creation_modal';
export const POLL_TYPE_ACTION_ID = 'poll_type_select';
export const CLOSE_METHOD_ACTION_ID = 'close_method_select';

export function buildPollCreationModal(
  initialOptions: number = 2,
  pollType?: string,
  closeMethod?: string,
): View {
  const blocks: KnownBlock[] = [];

  // Poll Question
  blocks.push({
    type: 'input',
    block_id: 'question_block',
    label: { type: 'plain_text', text: 'Poll Question' },
    element: {
      type: 'plain_text_input',
      action_id: 'question_input',
      placeholder: { type: 'plain_text', text: 'What would you like to ask?' },
      max_length: 300,
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
      },
    });
  }

  // Options (hidden for yes_no and rating)
  const showOptions = !pollType || (pollType !== 'yes_no' && pollType !== 'rating');
  if (showOptions) {
    const optionCount = Math.max(2, Math.min(10, initialOptions));
    for (let i = 0; i < optionCount; i++) {
      blocks.push({
        type: 'input',
        block_id: `option_block_${i}`,
        label: { type: 'plain_text', text: `Option ${i + 1}` },
        optional: i >= 2,
        element: {
          type: 'plain_text_input',
          action_id: `option_input_${i}`,
          placeholder: { type: 'plain_text', text: `Option ${i + 1}` },
          max_length: 200,
        },
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
  blocks.push({
    type: 'input',
    block_id: 'anonymous_block',
    optional: true,
    label: { type: 'plain_text', text: 'Anonymous Voting' },
    element: {
      type: 'checkboxes',
      action_id: 'anonymous_toggle',
      options: [
        {
          text: { type: 'plain_text', text: 'Hide voter identities' },
          value: 'anonymous',
        },
      ],
    },
  });

  // Allow Vote Change
  blocks.push({
    type: 'input',
    block_id: 'vote_change_block',
    optional: true,
    label: { type: 'plain_text', text: 'Allow Vote Change' },
    element: {
      type: 'checkboxes',
      action_id: 'vote_change_toggle',
      options: [
        {
          text: { type: 'plain_text', text: 'Let voters update their selection' },
          value: 'vote_change',
        },
      ],
      initial_options: [
        {
          text: { type: 'plain_text', text: 'Let voters update their selection' },
          value: 'vote_change',
        },
      ],
    },
  });

  // Show Live Results
  blocks.push({
    type: 'input',
    block_id: 'live_results_block',
    optional: true,
    label: { type: 'plain_text', text: 'Show Live Results' },
    element: {
      type: 'checkboxes',
      action_id: 'live_results_toggle',
      options: [
        {
          text: { type: 'plain_text', text: 'Show results as votes come in' },
          value: 'live_results',
        },
      ],
      initial_options: [
        {
          text: { type: 'plain_text', text: 'Show results as votes come in' },
          value: 'live_results',
        },
      ],
    },
  });

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

  return {
    type: 'modal',
    callback_id: MODAL_CALLBACK_ID,
    title: { type: 'plain_text', text: 'Create a Poll' },
    submit: { type: 'plain_text', text: 'Create Poll' },
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
