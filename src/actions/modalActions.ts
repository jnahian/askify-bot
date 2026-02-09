import { App } from '@slack/bolt';
import {
  POLL_TYPE_ACTION_ID,
  CLOSE_METHOD_ACTION_ID,
  buildPollCreationModal,
} from '../views/pollCreationModal';

export function registerModalActions(app: App): void {
  // Update modal when poll type changes
  app.action(POLL_TYPE_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;

    const values = body.view.state.values;
    const pollType = values.poll_type_block?.poll_type_select?.selected_option?.value;
    const closeMethod = values.close_method_block?.close_method_select?.selected_option?.value;

    // Count current options
    let optionCount = 0;
    for (let i = 0; i < 10; i++) {
      if (values[`option_block_${i}`]) optionCount++;
    }

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: buildPollCreationModal(Math.max(2, optionCount), pollType, closeMethod),
    });
  });

  // Update modal when close method changes
  app.action(CLOSE_METHOD_ACTION_ID, async ({ ack, body, client }) => {
    await ack();
    if (body.type !== 'block_actions' || !body.view) return;

    const values = body.view.state.values;
    const pollType = values.poll_type_block?.poll_type_select?.selected_option?.value;
    const closeMethod = values.close_method_block?.close_method_select?.selected_option?.value;

    let optionCount = 0;
    for (let i = 0; i < 10; i++) {
      if (values[`option_block_${i}`]) optionCount++;
    }

    await client.views.update({
      view_id: body.view.id,
      hash: body.view.hash,
      view: buildPollCreationModal(Math.max(2, optionCount), pollType, closeMethod),
    });
  });
}
