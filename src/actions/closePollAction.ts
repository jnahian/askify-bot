import { App } from '@slack/bolt';
import { getPoll, closePoll } from '../services/pollService';
import { getVotersByOption } from '../services/voteService';
import { buildPollMessage } from '../blocks/pollMessage';
import { buildResultsDMBlocks } from '../blocks/resultsDM';

export function registerClosePollAction(app: App): void {
  app.action('close_poll', async ({ ack, action, body, client }) => {
    await ack();

    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const pollId = action.value!;
    const userId = body.user.id;

    const poll = await getPoll(pollId);
    if (!poll) return;

    // Only creator can close the poll
    if (poll.creatorId !== userId) {
      await client.chat.postEphemeral({
        channel: poll.channelId,
        user: userId,
        text: ':x: Only the poll creator can close this poll.',
      });
      return;
    }

    if (poll.status === 'closed') return;

    // Close the poll
    await closePoll(pollId);

    // Refresh and update message
    const closedPoll = await getPoll(pollId);
    if (!closedPoll || !closedPoll.messageTs) return;

    const settings = closedPoll.settings as {
      anonymous?: boolean;
      allowVoteChange?: boolean;
      liveResults?: boolean;
    };

    let voterNames: Map<string, string[]> | undefined;
    if (!settings.anonymous) {
      voterNames = await getVotersByOption(pollId);
    }

    // Update channel message with final results
    const message = buildPollMessage(closedPoll, { ...settings, liveResults: true }, voterNames);
    await client.chat.update({
      channel: closedPoll.channelId,
      ts: closedPoll.messageTs,
      ...message,
    });

    // DM results to creator with "Share Results" button
    const dm = buildResultsDMBlocks(closedPoll, settings, voterNames);
    await client.chat.postMessage({
      channel: closedPoll.creatorId,
      ...dm,
    });
  });
}
