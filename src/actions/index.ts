import { App } from '@slack/bolt';
import { registerModalActions } from './modalActions';
import { registerVoteAction } from './voteAction';
import { registerClosePollAction } from './closePollAction';
import { registerTemplateActions } from './templateActions';
import { registerAddOptionAction } from './addOptionAction';
import { registerListActions } from './listActions';
import { registerShareResultsAction } from './shareResultsAction';
import { registerEditPollAction } from './editPollAction';
import { registerRepostAction } from './repostAction';

export function registerActions(app: App): void {
  registerModalActions(app);
  registerVoteAction(app);
  registerClosePollAction(app);
  registerTemplateActions(app);
  registerAddOptionAction(app);
  registerListActions(app);
  registerShareResultsAction(app);
  registerEditPollAction(app);
  registerRepostAction(app);
}
