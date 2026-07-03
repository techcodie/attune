import type { CandidateProfileDto, ProfileInput } from '@cadence/types';
import { api } from '@/lib/api';

export const profileApi = {
  /** Returns the profile or `null` when not yet completed. */
  get: () => api.get<CandidateProfileDto | null>('/profile'),
  save: (input: ProfileInput) => api.put<CandidateProfileDto>('/profile', input),
};
