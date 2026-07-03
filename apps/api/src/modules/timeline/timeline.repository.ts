import type { Prisma, TimelineEvent } from '@prisma/client';
import type { TimelineEventDto } from '@cadence/types';
import { prisma } from '../../lib/prisma.js';

export interface AppendTimelineInput {
  interviewId: string;
  type: TimelineEventDto['type'];
  atMs: number;
  label: string;
  data?: Prisma.InputJsonValue;
}

/** Append-only timeline persistence. */
export const timelineRepository = {
  append(input: AppendTimelineInput): Promise<TimelineEvent> {
    return prisma.timelineEvent.create({
      data: {
        interviewId: input.interviewId,
        type: input.type,
        atMs: input.atMs,
        label: input.label,
        ...(input.data !== undefined ? { data: input.data } : {}),
      },
    });
  },

  listForInterview(interviewId: string): Promise<TimelineEvent[]> {
    return prisma.timelineEvent.findMany({
      where: { interviewId },
      orderBy: [{ atMs: 'asc' }, { createdAt: 'asc' }],
    });
  },
};

/** Map a persisted event to its DTO. */
export function toTimelineDto(row: TimelineEvent): TimelineEventDto {
  return {
    id: row.id,
    type: row.type,
    atMs: row.atMs,
    label: row.label,
    data: (row.data as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}
