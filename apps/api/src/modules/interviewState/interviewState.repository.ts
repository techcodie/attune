import type { InterviewState, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

/**
 * Persistence for the interview brain-state. Creation happens as a nested write
 * inside the interview transaction (see interview.repository), so this layer
 * covers the reads and the incremental updates the M3 engine will make.
 */
export const interviewStateRepository = {
  findByInterviewId(interviewId: string): Promise<InterviewState | null> {
    return prisma.interviewState.findUnique({ where: { interviewId } });
  },

  update(interviewId: string, data: Prisma.InterviewStateUpdateInput): Promise<InterviewState> {
    return prisma.interviewState.update({ where: { interviewId }, data });
  },
};
