import { App } from '@slack/bolt';

export function registerDMHandler(app: App): void {
  app.event('message', async ({ event, client }) => {
    // Only handle DMs (im channel type)
    if (event.channel_type !== 'im') return;

    // Ignore bot messages and message subtypes (edits, deletes, etc.)
    if (event.subtype) return;

    const text = ('text' in event ? event.text?.toLowerCase().trim() : '') || '';

    // Determine response based on user message
    let reply: string;

    if (['hi', 'hello', 'hey', 'sup', 'yo'].some((g) => text === g)) {
      reply = `:wave: Hey there! I'm Askify — your team's poll bot.\n\nHere's what I can do:`;
    } else if (text === 'help') {
      reply = `:bulb: Here's everything you need to know:`;
    } else {
      reply = `:speech_balloon: I'm Askify — I help teams make decisions with polls.\n\nHere's how to get started:`;
    }

    reply += '\n\n'
      + '*Create a poll:*\n'
      + '`/askify` — Open the poll creation modal\n'
      + '`/askify poll "Question?" "Opt 1" "Opt 2"` — Quick inline poll\n\n'
      + '*Manage polls:*\n'
      + '`/askify list` — View your active & scheduled polls\n'
      + '`/askify templates` — Reuse saved poll configs\n'
      + '`/askify help` — Full usage guide\n\n'
      + '_Type any of these commands in a channel to get started!_';

    await client.chat.postMessage({
      channel: event.channel,
      text: reply,
    });
  });
}
