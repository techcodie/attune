import type { InterviewNote, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface CreateNoteInput {
  interviewId: string;
  atMs: number;
  content: string;
  evaluation?: Prisma.InputJsonValue;
  decision?: Prisma.InputJsonValue;
}

/**
 * Persistence for hidden interviewer notes. Written inside the turn transaction;
 * never read back during the interview — only the M6 report consumes these.
 */
export const noteRepository = {
  create(tx: Prisma.TransactionClient, input: CreateNoteInput) {
    return tx.interviewNote.create({
      data: {
        interviewId: input.interviewId,
        atMs: input.atMs,
        content: input.content,
        ...(input.evaluation !== undefined ? { evaluation: input.evaluation } : {}),
        ...(input.decision !== undefined ? { decision: input.decision } : {}),
      },
    });
  },

  listForInterview(interviewId: string): Promise<InterviewNote[]> {
    return prisma.interviewNote.findMany({
      where: { interviewId },
      orderBy: [{ atMs: 'asc' }, { createdAt: 'asc' }],
    });
  },
};
