import { App } from '@slack/bolt';
import { registerModalActions } from './modalActions';
import { registerVoteAction } from './voteAction';
import { registerClosePollAction } from './closePollAction';

export function registerActions(app: App): void {
  registerModalActions(app);
  registerVoteAction(app);
  registerClosePollAction(app);
}
