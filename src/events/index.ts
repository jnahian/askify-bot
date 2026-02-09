import { App } from '@slack/bolt';
import { registerDMHandler } from './dmHandler';

export function registerEvents(app: App): void {
  registerDMHandler(app);
}
