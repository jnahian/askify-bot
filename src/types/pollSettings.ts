/**
 * Shared shape of the `Poll.settings` JSON column.
 */
export interface PollSettings {
  anonymous?: boolean;
  allowVoteChange?: boolean;
  liveResults?: boolean;
  ratingScale?: number;
  allowAddingOptions?: boolean;
  reminders?: boolean;
  description?: string;
  includeMaybe?: boolean;
}

/**
 * Read poll settings from a poll record, applying defaults
 * (`allowVoteChange: true`, `liveResults: true`).
 */
export function getSettings(poll: { settings: unknown }): PollSettings {
  const raw = (poll.settings ?? {}) as PollSettings;
  return {
    allowVoteChange: true,
    liveResults: true,
    ...raw,
  };
}
