import type { Profile } from '@prisma/client';
import type { ProfileInput } from '@cadence/types';
import { prisma } from '../../lib/prisma.js';

/** Profile persistence. Upsert keeps "complete" and "edit" as one operation. */
export const profileRepository = {
  findByUserId(userId: string): Promise<Profile | null> {
    return prisma.profile.findUnique({ where: { userId } });
  },

  upsert(userId: string, input: ProfileInput): Promise<Profile> {
    const data = {
      targetRole: input.targetRole,
      experienceLevel: input.experienceLevel,
      yearsExperience: input.yearsExperience,
      preferredType: input.preferredType,
      focusSkills: input.focusSkills,
      careerGoal: input.careerGoal ?? null,
    };
    return prisma.profile.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  },
};
