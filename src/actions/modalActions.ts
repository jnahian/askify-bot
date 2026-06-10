import { App } from '@slack/bolt';
import {
  POLL_TYPE_ACTION_ID,
  CLOSE_METHOD_ACTION_ID,
  SCHEDULE_METHOD_ACTION_ID,
  ADD_MODAL_OPTION_ACTION_ID,
  REMOVE_MODAL_OPTION_ACTION_ID,
  buildPollCreationModal,
  type ModalOptions,
} from '../views/pollCreationModal';

/**
 * Modal private_metadata carries the edit-flow poll ID and, across rebuilds,
 * the last-known option texts (option inputs vanish from view state when the
 * poll type switches to yes_no/rating, so they must be persisted out-of-band).
 * Supports the legacy plain-pollId form used when the edit modal first opens.
 */
export interface ModalMetadata {
  pollId?: string;
  savedOptions?: string[];
}

export function parseModalMetadata(raw: string | undefined): ModalMetadata {
  if (!raw) return {};
  if (raw.startsWith('{')) {
    try {
      return JSON.parse(raw) as ModalMetadata;
    } catch {
      return {};
    }
  }
  return { pollId: raw };
}

function extractModalState(values: Record<string, any>) {
  const pollType = values.poll_type_block?.poll_type_select?.selected_option?.value;
  const closeMethod = values.close_method_block?.close_method_select?.selected_option?.value;
  const scheduleMethod = values.schedule_method_block?.schedule_method_select?.selected_option?.value;

  let optionCount = 0;
  const options: string[] = [];
  for (let i = 0; i < 10; i++) {
    if (values[`option_block_${i}`]) {
      optionCount++;
      options.push(values[`option_block_${i}`]?.[`option_input_${i}`]?.value || '');
    }
  }

  // Capture currently-typed values so rebuilding the modal doesn't discard user input
  const settingsValues: string[] = (values.settings_block?.settings_checkboxes?.selected_options || [])
    .map((o: any) => o.value);
  const ratingScaleValue = values.rating_scale_block?.rating_scale_select?.selected_option?.value;
  const closesAtTs = values.datetime_block?.datetime_input?.selected_date_time;
  const scheduledAtTs = values.schedule_datetime_block?.schedule_datetime_input?.selected_date_time;

  const prefill: NonNullable<ModalOptions['prefill']> = {
    question: values.question_block?.question_input?.value || undefined,
    description: values.description_block?.description_input?.value || undefined,
    options,
    anonymous: settingsValues.includes('anonymous'),
    allowVoteChange: settingsValues.includes('vote_change'),
    liveResults: settingsValues.includes('live_results'),
    reminders: settingsValues.includes('reminders'),
    allowAddingOptions: settingsValues.includes('allow_adding_options'),
    ...(ratingScaleValue ? { ratingScale: parseInt(ratingScaleValue, 10) } : {}),
    ...(values.include_maybe_block
      ? { includeMaybe: (values.include_maybe_block?.include_maybe_toggle?.selected_options || []).length > 0 }
      : {}),
    ...(values.duration_block?.duration_input?.value
      ? { duration: values.duration_block.duration_input.value }
      : {}),
    ...(closesAtTs ? { closesAt: new Date(closesAtTs * 1000) } : {}),
    ...(scheduledAtTs ? { scheduledAt: new Date(scheduledAtTs * 1000) } : {}),
  };

  const initialChannel = values.channel_block?.channel_select?.selected_conversation || undefined;

  return { pollType, closeMethod, scheduleMethod, optionCount: Math.max(2, optionCount), prefill, initialChannel };
}

function rebuildModal(body: any, client: any, optionCountOverride?: number) {
  const { pollType, closeMethod, scheduleMethod, optionCount, prefill, initialChannel } =
    extractModalState(body.view.state.values);
  const finalCount = optionCountOverride ?? optionCount;

  const metadata = parseModalMetadata(body.view.private_metadata);
  const optionsVisible = Object.keys(body.view.state.values || {}).some((key) =>
    key.startsWith('option_block_'),
  );
  if (optionsVisible) {
    // When removing an option, drop its typed value too so the builder doesn't re-add it
    prefill.options = (prefill.options || []).slice(0, finalCount);
    metadata.savedOptions = prefill.options;
  } else if (metadata.savedOptions?.length) {
    // Option inputs were hidden (yes_no/rating); restore the previously typed options
    prefill.options = metadata.savedOptions;
  }
  const newMetadata =
    metadata.pollId || metadata.savedOptions?.length ? JSON.stringify(metadata) : undefined;

  return client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: buildPollCreationModal({
      // Preserve edit/template context so a select interaction doesn't
      // convert the edit modal back into a creation modal
      callbackId: body.view.callback_id,
      privateMetadata: newMetadata,
      initialOptions: finalCount,
      pollType,
      closeMethod,
      scheduleMethod,
      initialChannel,
      prefill,
    }),
  });
}

export function registerModalActions(app: App): void {
  // Update modal when poll type changes
  app.action(POLL_TYPE_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;
    await rebuildModal(body, client);
  });

  // Update modal when close method changes
  app.action(CLOSE_METHOD_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;
    await rebuildModal(body, client);
  });

  // Update modal when schedule method changes
  app.action(SCHEDULE_METHOD_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;
    await rebuildModal(body, client);
  });

  // Add an option field
  app.action(ADD_MODAL_OPTION_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;
    const { optionCount } = extractModalState(body.view.state.values);
    if (optionCount < 10) {
      await rebuildModal(body, client, optionCount + 1);
    }
  });

  // Remove the last option field
  app.action(REMOVE_MODAL_OPTION_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;
    const { optionCount } = extractModalState(body.view.state.values);
    if (optionCount > 2) {
      await rebuildModal(body, client, optionCount - 1);
    }
  });
}
