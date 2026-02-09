import { App } from '@slack/bolt';
import { getPoll } from '../services/pollService';
import { handleSingleVote, handleMultiVote, getVotersByOption } from '../services/voteService';
import { buildPollMessage } from '../blocks/pollMessage';
import { withRetry } from '../utils/slackRetry';

export function registerVoteAction(app: App): void {
  // Match any action_id starting with "vote_"
  app.action(/^vote_.+$/, async ({ ack, action, body, client }) => {
    await ack();

    if (action.type !== 'button' || body.type !== 'block_actions') return;

    const [pollId, optionId] = action.value!.split(':');
    const voterId = body.user.id;

    try {
      const poll = await getPoll(pollId);
      if (!poll) return;

      if (poll.status === 'closed') {
        await client.chat.postEphemeral({
          channel: poll.channelId,
          user: voterId,
          text: ':no_entry_sign: This poll is closed.',
        });
        return;
      }

      const settings = poll.settings as {
        anonymous?: boolean;
        allowVoteChange?: boolean;
        liveResults?: boolean;
      };
      const allowVoteChange = settings.allowVoteChange !== false;

      // Handle vote based on poll type
      let result;
      if (poll.pollType === 'multi_select') {
        result = await handleMultiVote(pollId, optionId, voterId, allowVoteChange);
      } else {
        result = await handleSingleVote(pollId, optionId, voterId, allowVoteChange);
      }

      if (result.action === 'rejected') {
        await client.chat.postEphemeral({
          channel: poll.channelId,
          user: voterId,
          text: `:x: ${result.message}`,
        });
        return;
      }

      // Refresh poll data and update message
      const updatedPoll = await getPoll(pollId);
      if (!updatedPoll || !updatedPoll.messageTs) return;

      // Get voter names for non-anonymous polls
      let voterNames: Map<string, string[]> | undefined;
      if (!settings.anonymous) {
        voterNames = await getVotersByOption(pollId);
      }

      const message = buildPollMessage(updatedPoll, settings, voterNames);
      await withRetry(() =>
        client.chat.update({
          channel: updatedPoll.channelId,
          ts: updatedPoll.messageTs!,
          ...message,
        }),
      );
    } catch (error: any) {
      // Handle deleted message (message_not_found)
      if (error?.data?.error === 'message_not_found') {
        console.warn(`Poll message deleted for poll ${pollId}`);
        return;
      }
      // Handle channel errors (channel_not_found, not_in_channel)
      if (error?.data?.error === 'channel_not_found' || error?.data?.error === 'not_in_channel') {
        console.warn(`Bot not in channel for poll ${pollId}: ${error.data.error}`);
        return;
      }
      console.error('Vote action error:', error);
    }
  });
}
