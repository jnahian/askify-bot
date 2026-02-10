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

export interface PollWithOptions {
  id: string;
  creatorId: string;
  channelId: string;
  messageTs: string | null;
  question: string;
  pollType: PollType;
  settings: Record<string, unknown>;
  status: PollStatus;
  scheduledAt: Date | null;
  closesAt: Date | null;
  reminderSentAt: Date | null;
  createdAt: Date;
  options: {
    id: string;
    label: string;
    position: number;
    addedBy: string | null;
    _count: { votes: number };
  }[];
  _count: { votes: number };
}

export async function createPoll(input: CreatePollInput) {
  const poll = await prisma.poll.create({
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
    include: {
      options: {
        orderBy: { position: 'asc' },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
  });

  return poll as unknown as PollWithOptions;
}

export async function getPoll(pollId: string): Promise<PollWithOptions | null> {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        orderBy: { position: 'asc' },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
  });

  return poll as unknown as PollWithOptions | null;
}

export async function closePoll(pollId: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { status: 'closed' },
  });
}

export async function updatePollMessageTs(pollId: string, messageTs: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { messageTs },
  });
}

export async function getExpiredPolls() {
  return prisma.poll.findMany({
    where: {
      status: 'active',
      closesAt: { lte: new Date() },
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

export async function getScheduledPolls() {
  return prisma.poll.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: new Date() },
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

export async function activatePoll(pollId: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { status: 'active' },
  });
}

export interface GetUserPollsOptions {
  from?: Date;
  to?: Date;
  limit?: number;
}

export async function getUserPolls(userId: string, opts: GetUserPollsOptions = {}) {
  const { from, to, limit = 10 } = opts;

  const createdAtFilter: Record<string, Date> = {};
  if (from) createdAtFilter.gte = from;
  if (to) createdAtFilter.lte = to;

  const polls = await prisma.poll.findMany({
    where: {
      creatorId: userId,
      ...(Object.keys(createdAtFilter).length > 0 ? { createdAt: createdAtFilter } : {}),
    },
    include: {
      options: {
        orderBy: { position: 'asc' },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return polls as unknown as PollWithOptions[];
}

export async function cancelScheduledPoll(pollId: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { status: 'closed' },
  });
}

export async function getPollsNeedingReminders() {
  const now = new Date();
  // Find active polls with closesAt set, reminders not yet sent
  const polls = await prisma.poll.findMany({
    where: {
      status: 'active',
      closesAt: { not: null },
      reminderSentAt: null,
    },
    include: {
      options: {
        orderBy: { position: 'asc' },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
  });

  // Filter by smart timing:
  // - Closes within 2 hours → remind now (1 hour before)
  // - Closes within 1-3 days → remind 24 hours before
  return (polls as unknown as PollWithOptions[]).filter((poll) => {
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

export async function markReminderSent(pollId: string) {
  return prisma.poll.update({
    where: { id: pollId },
    data: { reminderSentAt: new Date() },
  });
}
