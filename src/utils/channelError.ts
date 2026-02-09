const NOT_IN_CHANNEL_ERRORS = ['not_in_channel', 'channel_not_found'];

export function isNotInChannelError(err: unknown): boolean {
  return NOT_IN_CHANNEL_ERRORS.includes((err as any)?.data?.error);
}

export function notInChannelText(channelId: string): string {
  return `:warning: I couldn't post to <#${channelId}> because I'm not a member of that channel.\nPlease invite me by typing \`/invite @Askify\` in that channel, then try again.`;
}
