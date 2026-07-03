import type { Interview } from '@prisma/client';
import type { Difficulty, InterviewDto } from '@cadence/types';

/** Map a persisted interview to its wire DTO (config + lifecycle only). */
export function toInterviewDto(row: Interview): InterviewDto {
  return {
    id: row.id,
    interviewType: row.interviewType,
    interviewerPersonality: row.interviewerPersonality,
    targetRole: row.targetRole,
    difficulty: row.difficulty as Difficulty,
    status: row.status,
    durationMinutes: row.durationMinutes,
    focusSkills: row.focusSkills,
    preferredLanguage: row.preferredLanguage,
    voicePreference: row.voicePreference,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    durationSec: row.durationSec,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
