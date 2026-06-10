import prisma from '../lib/prisma';
import type { Prisma, PollType, PollStatus } from '../generated/prisma/client';

interface CreatePollInput {
  creatorId: string;
  channelId: string;
  question: string;
  pollType: 'single_choice' | 'multi_select' | 'yes_no' | 'rating';
  options: string[];
  settings: Prisma.InputJsonValue;
  closesAt: Date | null;
  scheduledAt?: Date | null;
  status?: 'active' | 'scheduled';
}

const pollInclude = {
  options: {
    orderBy: { position: 'asc' },
    include: { _count: { select: { votes: true } } },
  },
  _count: { select: { votes: true } },
} satisfies Prisma.PollInclude;

export type PollWithOptions = Prisma.PollGetPayload<{ include: typeof pollInclude }>;

export async function createPoll(input: CreatePollInput): Promise<PollWithOptions> {
  return prisma.poll.create({
    data: {
      creatorId: input.creatorId,
      channelId: input.channelId,
      question: input.question,
      pollType: input.pollType as PollType,
      settings: input.settings,
      status: (input.status || 'active') as PollStatus,
      closesAt: input.closesAt,
      scheduledAt: input.scheduledAt || null,
      options: {
        create: input.options.map((label, index) => ({
          label,
          position: index,
        })),
      },
    },
    include: pollInclude,
  });
}

export async function getPoll(pollId: string): Promise<PollWithOptions | null> {
  return prisma.poll.findUnique({
    where: { id: pollId },
    include: pollInclude,
  });
}

export async function closePoll(pollId: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { status: 'closed' },
  });
}

export async function deletePoll(pollId: string) {
  return prisma.poll.delete({
    where: { id: pollId },
  });
}

export async function updatePollMessageTs(pollId: string, messageTs: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { messageTs },
  });
}

export async function getExpiredPolls(): Promise<PollWithOptions[]> {
  return prisma.poll.findMany({
    where: {
      status: 'active',
      closesAt: { lte: new Date() },
    },
    include: pollInclude,
  });
}

export async function getScheduledPolls(): Promise<PollWithOptions[]> {
  return prisma.poll.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: new Date() },
    },
    include: pollInclude,
  });
}

export async function activatePoll(pollId: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { status: 'active' },
  });
}

/**
 * Atomically claim a scheduled poll for posting. Returns true only if this
 * caller flipped it scheduled → active; concurrent claimers get false.
 */
export async function claimScheduledPoll(pollId: string): Promise<boolean> {
  const result = await prisma.poll.updateMany({
    where: { id: pollId, status: 'scheduled' },
    data: { status: 'active' },
  });
  return result.count === 1;
}

/**
 * Atomically claim a poll for closing. Returns true only if this caller
 * flipped it active → closed; concurrent claimers get false.
 */
export async function claimPollClose(pollId: string): Promise<boolean> {
  const result = await prisma.poll.updateMany({
    where: { id: pollId, status: 'active' },
    data: { status: 'closed' },
  });
  return result.count === 1;
}

/**
 * Find active polls that were claimed for posting but never made it to Slack
 * (e.g. the bot crashed between claiming and chat.postMessage).
 */
export async function getStrandedActivePolls() {
  return prisma.poll.findMany({
    where: {
      status: 'active',
      messageTs: null,
      scheduledAt: { not: null },
    },
    include: {
      options: {
        orderBy: { position: 'asc' },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
  });
}

export interface GetUserPollsOptions {
  from?: Date;
  to?: Date;
  limit?: number;
}

export async function getUserPolls(userId: string, opts: GetUserPollsOptions = {}): Promise<PollWithOptions[]> {
  const { from, to, limit = 10 } = opts;

  const createdAtFilter: Record<string, Date> = {};
  if (from) createdAtFilter.gte = from;
  if (to) createdAtFilter.lte = to;

  return prisma.poll.findMany({
    where: {
      creatorId: userId,
      ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
    },
    include: pollInclude,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

interface UpdatePollInput {
  question: string;
  pollType: 'single_choice' | 'multi_select' | 'yes_no' | 'rating';
  channelId: string;
  options: string[];
  settings: Prisma.InputJsonValue;
  closesAt: Date | null;
  scheduledAt: Date | null;
  status: 'active' | 'scheduled';
}

/** Thrown when an edit targets a poll the scheduler has already posted. */
export class PollNotEditableError extends Error {
  constructor(pollId: string) {
    super(`Poll ${pollId} is no longer scheduled and cannot be edited`);
    this.name = 'PollNotEditableError';
  }
}

export async function updatePoll(pollId: string, input: UpdatePollInput): Promise<PollWithOptions> {
  return prisma.$transaction(async (tx) => {
    // Conditionally lock in the edit: bail if the cron already posted this poll
    const claimed = await tx.poll.updateMany({
      where: { id: pollId, status: 'scheduled' },
      data: { status: 'scheduled' },
    });
    if (claimed.count !== 1) {
      throw new PollNotEditableError(pollId);
    }

    // Delete existing options (cascade deletes votes too)
    await tx.pollOption.deleteMany({ where: { pollId } });

    return tx.poll.update({
      where: { id: pollId },
      data: {
        question: input.question,
        pollType: input.pollType as PollType,
        channelId: input.channelId,
        settings: input.settings,
        closesAt: input.closesAt,
        scheduledAt: input.scheduledAt,
        status: input.status as PollStatus,
        options: {
          create: input.options.map((label, index) => ({
            label,
            position: index,
          })),
        },
      },
      include: pollInclude,
    });
  });
}

interface RepostPollInput {
  channelId?: string;
  scheduledAt?: Date | null;
  closesAt?: Date | null;
}

export async function repostPoll(sourcePollId: string, creatorId: string, opts: RepostPollInput = {}): Promise<PollWithOptions> {
  const source = await getPoll(sourcePollId);
  if (!source) throw new Error('Source poll not found');

  const isScheduled = !!opts.scheduledAt;

  return prisma.poll.create({
    data: {
      creatorId,
      channelId: opts.channelId || source.channelId,
      question: source.question,
      pollType: source.pollType,
      settings: JSON.parse(JSON.stringify(source.settings)),
      status: (isScheduled ? 'scheduled' : 'active') as PollStatus,
      closesAt: opts.closesAt || null,
      scheduledAt: opts.scheduledAt || null,
      options: {
        create: source.options.map((opt) => ({
          label: opt.label,
          position: opt.position,
        })),
      },
    },
    include: pollInclude,
  });
}

/**
 * Cancel a scheduled poll. Conditional on it still being scheduled — returns
 * false if the cron already posted it (or it was cancelled elsewhere).
 */
export async function cancelScheduledPoll(pollId: string): Promise<boolean> {
  const result = await prisma.poll.updateMany({
    where: { id: pollId, status: 'scheduled' },
    data: { status: 'closed' },
  });
  return result.count === 1;
}

export async function getPollsNeedingReminders(): Promise<PollWithOptions[]> {
  const now = new Date();
  // Find active polls with closesAt set, reminders not yet sent
  const polls = await prisma.poll.findMany({
    where: {
      status: 'active',
      closesAt: { not: null },
      reminderSentAt: null,
    },
    include: pollInclude,
  });

  // Filter by smart timing:
  // - Closes within 2 hours → remind now (1 hour before)
  // - Closes within 1-3 days → remind 24 hours before
  return polls.filter((poll) => {
    if (!poll.closesAt) return false;
    const msUntilClose = poll.closesAt.getTime() - now.getTime();
    const hoursUntilClose = msUntilClose / (1000 * 60 * 60);

    // Closing within 1-2 hours → send reminder
    if (hoursUntilClose > 0 && hoursUntilClose <= 1) return true;
    // Closing within 23-25 hours → send 24h reminder
    if (hoursUntilClose >= 23 && hoursUntilClose <= 25) return true;

    return false;
  });
}

/**
 * Atomically claim the reminder send for a poll. Returns true only if this
 * caller marked it; concurrent claimers (or repeat ticks) get false.
 */
export async function claimReminderSend(pollId: string): Promise<boolean> {
  const result = await prisma.poll.updateMany({
    where: { id: pollId, reminderSentAt: null },
    data: { reminderSentAt: new Date() },
  });
  return result.count === 1;
}
