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
  closesAt: Date | null;
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
      status: 'active',
      closesAt: input.closesAt,
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
