import { App } from '@slack/bolt';
import { registerDMHandler } from './dmHandler';
import { registerAppHomeHandler } from './appHomeHandler';

export function registerEvents(app: App): void {
  registerDMHandler(app);
  registerAppHomeHandler(app);
}
