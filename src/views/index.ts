import { App } from '@slack/bolt';
import { registerPollCreationSubmission } from './pollCreationSubmission';

export function registerViews(app: App): void {
  registerPollCreationSubmission(app);
}
