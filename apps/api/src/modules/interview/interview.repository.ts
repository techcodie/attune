import type { Interview, Prisma } from '@prisma/client';
import { InterviewStatus, type CreateInterviewInput } from '@cadence/types';
import { prisma } from '../../lib/prisma.js';

/** Interview with its 1:1 state and full timeline included. */
export type InterviewWithRelations = Prisma.InterviewGetPayload<{
  include: { state: true; timeline: true };
}>;

const withRelations = { state: true, timeline: true } as const;

export const interviewRepository = {
  /**
   * Atomically create the interview, its initial state, and the seed timeline
   * event in a single nested write (one implicit transaction).
   */
  create(
    userId: string,
    input: CreateInterviewInput,
    stateData: Prisma.InterviewStateCreateWithoutInterviewInput,
    seedEvent: Prisma.TimelineEventCreateWithoutInterviewInput,
  ): Promise<InterviewWithRelations> {
    return prisma.interview.create({
      data: {
        userId,
        interviewType: input.interviewType,
        interviewerPersonality: input.interviewerPersonality,
        targetRole: input.targetRole,
        difficulty: input.difficulty,
        baseDifficulty: input.difficulty,
        durationMinutes: input.durationMinutes,
        focusSkills: input.focusSkills,
        preferredLanguage: input.preferredLanguage,
        voicePreference: input.voicePreference ?? null,
        state: { create: stateData },
        timeline: { create: seedEvent },
      },
      include: withRelations,
    });
  },

  /** Detail view, scoped to the owner (returns null if not theirs). */
  findDetailForUser(userId: string, id: string): Promise<InterviewWithRelations | null> {
    return prisma.interview.findFirst({
      where: { id, userId },
      include: withRelations,
    });
  },

  listForUser(userId: string, take = 50): Promise<Interview[]> {
    return prisma.interview.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  },

  countForUser(userId: string): Promise<number> {
    return prisma.interview.count({ where: { userId } });
  },

  countForUserByStatus(userId: string, status: InterviewStatus): Promise<number> {
    return prisma.interview.count({ where: { userId, status } });
  },

  async totalPracticeSec(userId: string): Promise<number> {
    const agg = await prisma.interview.aggregate({
      where: { userId },
      _sum: { durationSec: true },
    });
    return agg._sum.durationSec ?? 0;
  },

  findLatestForUser(userId: string): Promise<Interview | null> {
    return prisma.interview.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  /** The interview a candidate can resume — newest that isn't finished. */
  findActiveForUser(userId: string): Promise<Interview | null> {
    return prisma.interview.findFirst({
      where: {
        userId,
        status: { in: [InterviewStatus.CREATED, InterviewStatus.IN_PROGRESS] },
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};
