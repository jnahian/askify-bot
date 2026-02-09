import { App } from '@slack/bolt';
import { closePoll, cancelScheduledPoll, getPoll } from '../services/pollService';
import { getVotersByOption } from '../services/voteService';
import { buildPollMessage, buildResultsDM } from '../blocks/pollMessage';

export function registerListActions(app: App): void {
  // Close poll from /askify list
  app.action(/^list_close_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    await closePoll(pollId);

    const closedPoll = await getPoll(pollId);
    if (!closedPoll) return;

    const settings = closedPoll.settings as {
      anonymous?: boolean;
      allowVoteChange?: boolean;
      liveResults?: boolean;
    };

    // Update channel message if it exists
    if (closedPoll.messageTs) {
      let voterNames: Map<string, string[]> | undefined;
      if (!settings.anonymous) {
        voterNames = await getVotersByOption(pollId);
      }

      const message = buildPollMessage(closedPoll, { ...settings, liveResults: true }, voterNames);
      await client.chat.update({
        channel: closedPoll.channelId,
        ts: closedPoll.messageTs,
        ...message,
      });

      // DM results to creator
      const dmText = buildResultsDM(closedPoll, settings, voterNames);
      await client.chat.postMessage({
        channel: closedPoll.creatorId,
        text: dmText,
      });
    }

    // Notify in ephemeral
    await client.chat.postEphemeral({
      channel: body.channel?.id || closedPoll.channelId,
      user: body.user.id,
      text: `:white_check_mark: Poll *"${closedPoll.question}"* has been closed.`,
    });
  });

  // Cancel scheduled poll from /askify list
  app.action(/^list_cancel_.+$/, async ({ ack, action, body, client }) => {
    await ack();
    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    await cancelScheduledPoll(pollId);

    const poll = await getPoll(pollId);
    const question = poll?.question || 'Unknown poll';

    await client.chat.postEphemeral({
      channel: body.channel?.id || '',
      user: body.user.id,
      text: `:white_check_mark: Scheduled poll *"${question}"* has been cancelled.`,
    });
  });
}
