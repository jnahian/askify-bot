import { App } from '@slack/bolt';
import { registerAskifyCommand } from './askify';

export function registerCommands(app: App): void {
  registerAskifyCommand(app);
}
