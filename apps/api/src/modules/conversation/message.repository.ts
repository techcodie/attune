import type { Message, Prisma, Speaker } from '@prisma/client';
import type { MessageDto } from '@cadence/types';
import { prisma } from '../../lib/prisma.js';

export const messageRepository = {
  createMany(
    tx: Prisma.TransactionClient,
    rows: Array<{ interviewId: string; speaker: Speaker; content: string; atMs: number }>,
  ) {
    return tx.message.createMany({ data: rows });
  },

  listRecent(interviewId: string, take = 12): Promise<Message[]> {
    return prisma.message
      .findMany({ where: { interviewId }, orderBy: { atMs: 'desc' }, take })
      .then((rows) => rows.reverse());
  },

  listAll(interviewId: string): Promise<Message[]> {
    return prisma.message.findMany({ where: { interviewId }, orderBy: { atMs: 'asc' } });
  },
};

export function toMessageDto(row: Message): MessageDto {
  return { id: row.id, speaker: row.speaker, content: row.content, atMs: row.atMs };
}
