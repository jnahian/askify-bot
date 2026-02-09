import { App } from '@slack/bolt';
import { getPoll } from '../services/pollService';
import { saveTemplate, getTemplate, deleteTemplate, type TemplateConfig } from '../services/templateService';
import { buildPollCreationModal } from '../views/pollCreationModal';

export const SAVE_TEMPLATE_MODAL_ID = 'save_template_modal';

export function registerTemplateActions(app: App): void {
  // "Save as Template" button clicked from DM
  app.action('save_as_template', async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: {
        type: 'modal',
        callback_id: SAVE_TEMPLATE_MODAL_ID,
        private_metadata: pollId,
        title: { type: 'plain_text', text: 'Save as Template' },
        submit: { type: 'plain_text', text: 'Save' },
        close: { type: 'plain_text', text: 'Cancel' },
        blocks: [
          {
            type: 'input',
            block_id: 'template_name_block',
            label: { type: 'plain_text', text: 'Template Name' },
            element: {
              type: 'plain_text_input',
              action_id: 'template_name_input',
              placeholder: { type: 'plain_text', text: 'e.g. Weekly Standup Poll' },
              max_length: 100,
            },
          },
        ],
      },
    });
  });

  // "Use Template" button from /askify templates
  app.action(/^use_template_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const templateId = action.value!;
    const template = await getTemplate(templateId);
    if (!template) return;

    const config = template.config;

    await client.views.open({
      trigger_id: body.trigger_id!,
      view: buildPollCreationModal({
        pollType: config.pollType,
        closeMethod: config.closeMethod,
        initialOptions: config.options.length || 2,
        prefill: {
          options: config.options,
          anonymous: config.settings.anonymous,
          allowVoteChange: config.settings.allowVoteChange,
          liveResults: config.settings.liveResults,
          ratingScale: config.settings.ratingScale,
        },
      }),
    });
  });

  // "Delete Template" button from /askify templates
  app.action(/^delete_template_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const templateId = action.value!;
    const deleted = await deleteTemplate(templateId, body.user.id);

    await client.chat.postEphemeral({
      channel: body.channel?.id || '',
      user: body.user.id,
      text: deleted
        ? ':white_check_mark: Template deleted.'
        : ':x: Could not delete template.',
    });
  });
}

export function registerSaveTemplateSubmission(app: App): void {
  app.view(SAVE_TEMPLATE_MODAL_ID, async ({ ack, view, body, client }) => {
    const pollId = view.private_metadata;
    const templateName = view.state.values.template_name_block?.template_name_input?.value?.trim();

    if (!templateName) {
      await ack({ response_action: 'errors', errors: { template_name_block: 'Please enter a template name.' } });
      return;
    }

    await ack();

    const poll = await getPoll(pollId);
    if (!poll) {
      await client.chat.postMessage({
        channel: body.user.id,
        text: ':x: Could not find the poll to save as template.',
      });
      return;
    }

    const settings = poll.settings as TemplateConfig['settings'];
    const config: TemplateConfig = {
      pollType: poll.pollType,
      options: poll.options.map((o) => o.label),
      settings,
      closeMethod: 'manual',
    };

    await saveTemplate(body.user.id, templateName, config);

    await client.chat.postMessage({
      channel: body.user.id,
      text: `:white_check_mark: Template *"${templateName}"* saved! Use \`/askify templates\` to manage your templates.`,
    });
  });
}
