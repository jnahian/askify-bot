import type { App, Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';

function getEventInfo(body: any): { type: string; name: string } {
  if (body.command) {
    const args = body.text ? ` ${body.text.split(/\s+/)[0]}` : '';
    return { type: 'command', name: `${body.command}${args}` };
  }

  if (body.type === 'block_actions' && body.actions?.length > 0) {
    return { type: 'action', name: body.actions[0].action_id };
  }

  if (body.type === 'view_submission') {
    return { type: 'view', name: body.view?.callback_id || 'unknown' };
  }

  if (body.type === 'view_closed') {
    return { type: 'view_closed', name: body.view?.callback_id || 'unknown' };
  }

  if (body.type === 'event_callback' || body.event) {
    return { type: 'event', name: body.event?.type || 'unknown' };
  }

  if (body.type === 'shortcut' || body.type === 'message_action') {
    return { type: 'shortcut', name: body.callback_id || 'unknown' };
  }

  return { type: body.type || 'unknown', name: '' };
}

export function registerRequestLogger(app: App): void {
  app.use(async (args) => {
    const { body, next } = args as any;
    const start = Date.now();
    const { type, name } = getEventInfo(body);
    const label = `[${type}] ${name}`;

    console.log(`--> ${label}`);

    try {
      await next();
      const ms = Date.now() - start;
      console.log(`<-- ${label} (${ms}ms)`);
    } catch (err) {
      const ms = Date.now() - start;
      console.error(`<-- ${label} FAILED (${ms}ms)`, err);
      throw err;
    }
  });
}
