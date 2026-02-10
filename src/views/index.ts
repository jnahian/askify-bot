import { App } from '@slack/bolt';
import { registerPollCreationSubmission } from './pollCreationSubmission';
import { registerPollEditSubmission } from './pollEditSubmission';
import { registerSaveTemplateSubmission } from '../actions/templateActions';
import { registerAddOptionSubmission } from '../actions/addOptionAction';
import { registerShareResultsSubmission } from '../actions/shareResultsAction';

export function registerViews(app: App): void {
  registerPollCreationSubmission(app);
  registerPollEditSubmission(app);
  registerSaveTemplateSubmission(app);
  registerAddOptionSubmission(app);
  registerShareResultsSubmission(app);
}
