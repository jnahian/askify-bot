import type { Button, KnownBlock } from "@slack/types";
import type { PollWithOptions } from "../services/pollService";
import { POLL_TYPE_LABELS } from "../constants";
import type { PollSettings } from "../types/pollSettings";
import { renderBar } from "../utils/barChart";
import { getOptionEmoji } from "../utils/emojiPrefix";
import { escapeMrkdwn } from "../utils/escapeMrkdwn";
import { truncate } from "../utils/truncate";

export function buildPollMessage(
  poll: PollWithOptions,
  settings: PollSettings,
  voterNames?: Map<string, string[]>,
  uniqueVoters?: number,
) {
  const isClosed = poll.status === "closed";
  const showResults = settings.liveResults || isClosed;
  // For multi_select polls callers should pass the real unique-voter count
  // (poll._count.votes counts vote rows, not voters)
  const totalVoters = uniqueVoters ?? poll._count.votes;

  const blocks: KnownBlock[] = [];

  // Header
  blocks.push({
    type: "header",
    text: { type: "plain_text", text: truncate(poll.question), emoji: true },
  });

  // Description (optional)
  if (settings.description) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: escapeMrkdwn(settings.description) },
    });
  }

  // Context: poll type, creator, status
  const contextParts = [
    `*${POLL_TYPE_LABELS[poll.pollType] || poll.pollType}*`,
    `Posted by <@${poll.creatorId}>`,
    `${totalVoters} vote${totalVoters !== 1 ? "s" : ""}`,
  ];
  if (settings.anonymous) contextParts.push(":lock: Anonymous");
  if (isClosed) contextParts.push(":no_entry_sign: Closed");

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: contextParts.join("  |  ") }],
  });

  blocks.push({ type: "divider" });

  // Options with results and/or vote buttons
  for (let idx = 0; idx < poll.options.length; idx++) {
    const option = poll.options[idx];
    const voteCount = option._count.votes;
    const emoji = getOptionEmoji(poll.pollType, idx, option.label);
    const labelWithEmoji = `${emoji} ${escapeMrkdwn(option.label)}`;

    if (showResults) {
      // Show bar chart with color coding by position
      let text = `*${labelWithEmoji}*\n\n${renderBar(voteCount, totalVoters, idx)}`;

      // Show voter names (non-anonymous, non-closed or always for closed)
      if (!settings.anonymous && voterNames?.has(option.id)) {
        const names = voterNames.get(option.id)!;
        if (names.length > 0) {
          text += `\n${names.map((n) => `<@${n}>`).join(", ")}`;
        }
      }

      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text },
        ...(isClosed ?
          {}
        : {
            accessory: {
              type: "button",
              text: { type: "plain_text", text: emoji, emoji: true },
              action_id: `vote_${option.id}`,
              value: `${poll.id}:${option.id}`,
            } as Button,
          }),
      });
    } else {
      // No results shown — just buttons
      blocks.push({
        type: "section",
        text: { type: "mrkdwn", text: `*${labelWithEmoji}*` },
        accessory: {
          type: "button",
          text: { type: "plain_text", text: emoji, emoji: true },
          action_id: `vote_${option.id}`,
          value: `${poll.id}:${option.id}`,
        } as Button,
      });
    }
  }

  // Rating average (for rating polls)
  if (poll.pollType === "rating" && showResults && totalVoters > 0) {
    const weightedSum = poll.options.reduce(
      (sum, opt) => sum + parseInt(opt.label, 10) * opt._count.votes,
      0,
    );
    const avg = (weightedSum / totalVoters).toFixed(1);
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `:star: *Average Rating: ${avg}*` },
    });
  }

  // Action buttons (only for active polls)
  if (!isClosed) {
    const actionElements: Button[] = [];

    // Add Option button (when allowed)
    if (settings.allowAddingOptions) {
      actionElements.push({
        type: "button",
        text: {
          type: "plain_text",
          text: ":heavy_plus_sign: Add Option",
          emoji: true,
        },
        action_id: "add_option",
        value: poll.id,
      } as Button);
    }

    if (actionElements.length > 0) {
      blocks.push({ type: "divider" });
      blocks.push({
        type: "actions",
        block_id: "poll_actions",
        elements: actionElements,
      });
    }
  }

  return { blocks, text: escapeMrkdwn(poll.question) };
}
