import { App } from '@slack/bolt';
import { registerPollCreationSubmission } from './pollCreationSubmission';
import { registerSaveTemplateSubmission } from '../actions/templateActions';

export function registerViews(app: App): void {
  registerPollCreationSubmission(app);
  registerSaveTemplateSubmission(app);
}
