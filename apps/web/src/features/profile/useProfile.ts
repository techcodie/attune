import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CandidateProfileDto, ProfileInput } from '@cadence/types';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { profileApi } from './profile.api';

const PROFILE_KEY = ['profile'] as const;

/** The current user's profile (null until completed). */
export function useProfileQuery() {
  return useQuery<CandidateProfileDto | null>({
    queryKey: PROFILE_KEY,
    queryFn: profileApi.get,
  });
}

/** Save (create or update) the profile and keep auth + cache in sync. */
export function useSaveProfile() {
  const queryClient = useQueryClient();
  const patchUser = useAuthStore((s) => s.patchUser);

  return useMutation<CandidateProfileDto, Error, ProfileInput>({
    mutationFn: profileApi.save,
    onSuccess: (profile) => {
      queryClient.setQueryData(PROFILE_KEY, profile);
      // Completing the profile flips the routing gate.
      patchUser({ hasProfile: true });
    },
  });
}
