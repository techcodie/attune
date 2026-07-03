import type { Profile } from '@prisma/client';
import type {
  CandidateProfileDto,
  ExperienceLevel,
  InterviewType,
  ProfileInput,
} from '@cadence/types';
import { profileRepository } from './profile.repository.js';

/** Map a Prisma row to the wire DTO (dates → ISO strings, enums → unions). */
function toDto(p: Profile): CandidateProfileDto {
  return {
    id: p.id,
    targetRole: p.targetRole,
    experienceLevel: p.experienceLevel as ExperienceLevel,
    yearsExperience: p.yearsExperience,
    preferredType: p.preferredType as InterviewType,
    focusSkills: p.focusSkills,
    careerGoal: p.careerGoal ?? undefined,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const profileService = {
  async get(userId: string): Promise<CandidateProfileDto | null> {
    const profile = await profileRepository.findByUserId(userId);
    return profile ? toDto(profile) : null;
  },

  async save(userId: string, input: ProfileInput): Promise<CandidateProfileDto> {
    const saved = await profileRepository.upsert(userId, input);
    return toDto(saved);
  },
};
