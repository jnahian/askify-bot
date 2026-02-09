import { App } from '@slack/bolt';
import {
  POLL_TYPE_ACTION_ID,
  CLOSE_METHOD_ACTION_ID,
  SCHEDULE_METHOD_ACTION_ID,
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

export function registerModalActions(app: App): void {
  // Update modal when poll type changes
  app.action(POLL_TYPE_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;

    const { pollType, closeMethod, scheduleMethod, optionCount } = extractModalState(body.view.state.values);

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: buildPollCreationModal(optionCount, pollType, closeMethod, scheduleMethod),
    });
  });

  // Update modal when close method changes
  app.action(CLOSE_METHOD_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;

    const { pollType, closeMethod, scheduleMethod, optionCount } = extractModalState(body.view.state.values);

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: buildPollCreationModal(optionCount, pollType, closeMethod, scheduleMethod),
    });
  });

  // Update modal when schedule method changes
  app.action(SCHEDULE_METHOD_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;

    const { pollType, closeMethod, scheduleMethod, optionCount } = extractModalState(body.view.state.values);

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: buildPollCreationModal(optionCount, pollType, closeMethod, scheduleMethod),
    });
  });
}
