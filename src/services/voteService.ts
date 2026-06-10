import prisma from '../lib/prisma';
import { Prisma } from '../generated/prisma/client';

export interface VoteResult {
  action: 'cast' | 'retracted' | 'switched' | 'rejected';
  message?: string;
}

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

const POLL_NOT_ACTIVE: VoteResult = {
  action: 'rejected',
  message: 'This poll is no longer accepting votes.',
};

/**
 * Handle a vote for single-choice, yes/no, and rating polls.
 * - Same option clicked again → retract
 * - Different option → switch (if vote change allowed)
 * - No existing vote → cast
 *
 * Runs in a transaction so concurrent clicks can't produce double votes:
 * cast/switch atomically deletes any existing votes before creating the new
 * one, and the poll status is re-checked so votes can't land after close.
 */
export async function handleSingleVote(
  pollId: string,
  optionId: string,
  voterId: string,
  allowVoteChange: boolean,
): Promise<VoteResult> {
  return prisma.$transaction(async (tx) => {
    // Re-check poll status inside the transaction (guards vote-after-close race)
    const poll = await tx.poll.findUnique({
      where: { id: pollId },
      select: { status: true },
    });
    if (!poll || poll.status !== 'active') return POLL_NOT_ACTIVE;

    const existingVote = await tx.vote.findFirst({
      where: { pollId, voterId },
    });

    if (existingVote) {
      if (!allowVoteChange) return { action: 'rejected', message: 'Vote changes are not allowed.' };

      if (existingVote.optionId === optionId) {
        // Retract vote — conditional delete in case it was removed concurrently
        await tx.vote.deleteMany({ where: { id: existingVote.id } });
        return { action: 'retracted' };
      }

      // Switch vote — atomically clear all of this voter's votes, then create
      await tx.vote.deleteMany({ where: { pollId, voterId } });
      try {
        await tx.vote.create({ data: { pollId, optionId, voterId } });
      } catch (err) {
        // Concurrent click already created this exact vote — treat as idempotent
        if (isUniqueViolation(err)) return { action: 'cast' };
        throw err;
      }
      return { action: 'switched' };
    }

    // New vote — clear any vote a concurrent request may have created, then create
    await tx.vote.deleteMany({ where: { pollId, voterId } });
    try {
      await tx.vote.create({ data: { pollId, optionId, voterId } });
    } catch (err) {
      // Same-option double-click raced us — treat as idempotent cast
      if (isUniqueViolation(err)) return { action: 'cast' };
      throw err;
    }
    return { action: 'cast' };
  });
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
  return prisma.$transaction(async (tx) => {
    // Re-check poll status inside the transaction (guards vote-after-close race)
    const poll = await tx.poll.findUnique({
      where: { id: pollId },
      select: { status: true },
    });
    if (!poll || poll.status !== 'active') return POLL_NOT_ACTIVE;

    const existingVote = await tx.vote.findFirst({
      where: { pollId, optionId, voterId },
    });

    if (existingVote) {
      if (!allowVoteChange) return { action: 'rejected', message: 'Vote changes are not allowed.' };
      await tx.vote.deleteMany({ where: { id: existingVote.id } });
      return { action: 'retracted' };
    }

    try {
      await tx.vote.create({ data: { pollId, optionId, voterId } });
    } catch (err) {
      // Concurrent double-click already created this vote — treat as idempotent
      if (isUniqueViolation(err)) return { action: 'cast' };
      throw err;
    }
    return { action: 'cast' };
  });
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

/**
 * Resolve the unique-voter count for a poll. For multi-select polls a voter
 * can hold multiple vote rows, so the poll-level `_count.votes` overcounts;
 * query the distinct voter count instead. Other poll types have one vote
 * per voter, so `_count.votes` is already correct.
 */
export async function getUniqueVoterCount(poll: {
  id: string;
  pollType: string;
  _count: { votes: number };
}): Promise<number> {
  if (poll.pollType !== 'multi_select') return poll._count.votes;
  return countUniqueVoters(poll.id);
}
