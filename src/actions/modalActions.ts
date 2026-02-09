import { App } from '@slack/bolt';
import {
  POLL_TYPE_ACTION_ID,
  CLOSE_METHOD_ACTION_ID,
  SCHEDULE_METHOD_ACTION_ID,
  ADD_MODAL_OPTION_ACTION_ID,
  REMOVE_MODAL_OPTION_ACTION_ID,
  buildPollCreationModal,
} from '../views/pollCreationModal';

function extractModalState(values: Record<string, any>) {
  const pollType = values.poll_type_block?.poll_type_select?.selected_option?.value;
  const closeMethod = values.close_method_block?.close_method_select?.selected_option?.value;
  const scheduleMethod = values.schedule_method_block?.schedule_method_select?.selected_option?.value;

  let optionCount = 0;
  for (let i = 0; i < 10; i++) {
    if (values[`option_block_${i}`]) optionCount++;
  }

  return { pollType, closeMethod, scheduleMethod, optionCount: Math.max(2, optionCount) };
}

function rebuildModal(body: any, client: any, optionCountOverride?: number) {
  const { pollType, closeMethod, scheduleMethod, optionCount } = extractModalState(body.view.state.values);
  const finalCount = optionCountOverride ?? optionCount;

  return client.views.update({
    view_id: body.view.id,
    hash: body.view.hash,
    view: buildPollCreationModal({ initialOptions: finalCount, pollType, closeMethod, scheduleMethod }),
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
