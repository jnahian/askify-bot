import prisma from '../lib/prisma';

export interface VoteResult {
  action: 'cast' | 'retracted' | 'switched' | 'rejected';
  message?: string;
}

/**
 * Handle a vote for single-choice, yes/no, and rating polls.
 * - Same option clicked again → retract
 * - Different option → switch (if vote change allowed)
 * - No existing vote → cast
 */
export async function handleSingleVote(
  pollId: string,
  optionId: string,
  voterId: string,
  allowVoteChange: boolean,
): Promise<VoteResult> {
  const existingVote = await prisma.vote.findFirst({
    where: { pollId, voterId },
  });

  if (existingVote) {
    if (existingVote.optionId === optionId) {
      // Retract vote
      if (!allowVoteChange) return { action: 'rejected', message: 'Vote changes are not allowed.' };
      await prisma.vote.delete({ where: { id: existingVote.id } });
      return { action: 'retracted' };
    } else {
      // Switch vote
      if (!allowVoteChange) return { action: 'rejected', message: 'Vote changes are not allowed.' };
      await prisma.vote.update({
        where: { id: existingVote.id },
        data: { optionId, votedAt: new Date() },
      });
      return { action: 'switched' };
    }
  }

  // New vote
  await prisma.vote.create({
    data: { pollId, optionId, voterId },
  });
  return { action: 'cast' };
}

/**
 * Handle a vote for multi-select polls.
 * - Option already voted → retract (toggle off)
 * - Option not voted → cast (toggle on)
 */
export async function handleMultiVote(
  pollId: string,
  optionId: string,
  voterId: string,
  allowVoteChange: boolean,
): Promise<VoteResult> {
  const existingVote = await prisma.vote.findFirst({
    where: { pollId, optionId, voterId },
  });

  if (existingVote) {
    if (!allowVoteChange) return { action: 'rejected', message: 'Vote changes are not allowed.' };
    await prisma.vote.delete({ where: { id: existingVote.id } });
    return { action: 'retracted' };
  }

  await prisma.vote.create({
    data: { pollId, optionId, voterId },
  });
  return { action: 'cast' };
}

/**
 * Get voter IDs grouped by option for a poll.
 */
export async function getVotersByOption(pollId: string): Promise<Map<string, string[]>> {
  const votes = await prisma.vote.findMany({
    where: { pollId },
    select: { optionId: true, voterId: true },
  });

  const map = new Map<string, string[]>();
  for (const vote of votes) {
    const list = map.get(vote.optionId) || [];
    list.push(vote.voterId);
    map.set(vote.optionId, list);
  }
  return map;
}

/**
 * Count unique voters for a poll.
 */
export async function countUniqueVoters(pollId: string): Promise<number> {
  const result = await prisma.vote.findMany({
    where: { pollId },
    distinct: ['voterId'],
    select: { voterId: true },
  });
  return result.length;
}
