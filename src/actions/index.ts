import { App } from '@slack/bolt';
import { registerModalActions } from './modalActions';
import { registerVoteAction } from './voteAction';
import { registerClosePollAction } from './closePollAction';
import { registerTemplateActions } from './templateActions';

export function registerActions(app: App): void {
  registerModalActions(app);
  registerVoteAction(app);
  registerClosePollAction(app);
  registerTemplateActions(app);
}
