import type { Evaluation, Interview, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export type EvaluationWithInterview = Evaluation & {
  interview: Pick<
    Interview,
    'id' | 'targetRole' | 'interviewType' | 'completedAt' | 'createdAt' | 'durationSec'
  >;
};

export const evaluationRepository = {
  findByInterviewId(interviewId: string): Promise<Evaluation | null> {
    return prisma.evaluation.findUnique({ where: { interviewId } });
  },

  create(data: {
    interviewId: string;
    overallScore: number;
    recommendation: string;
    report: Prisma.InputJsonValue;
  }): Promise<Evaluation> {
    return prisma.evaluation.create({ data });
  },

  /** All evaluations for a user's interviews, oldest first — powers the dashboard. */
  listForUser(userId: string): Promise<EvaluationWithInterview[]> {
    return prisma.evaluation.findMany({
      where: { interview: { userId } },
      include: {
        interview: {
          select: {
            id: true,
            targetRole: true,
            interviewType: true,
            completedAt: true,
            createdAt: true,
            durationSec: true,
          },
        },
      },
      orderBy: { generatedAt: 'asc' },
    });
  },
};
