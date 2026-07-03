import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateInterviewInput,
  DashboardStats,
  InterviewDetailDto,
  InterviewDto,
} from '@cadence/types';
import { interviewApi } from './interview.api';

export const interviewKeys = {
  all: ['interviews'] as const,
  list: () => [...interviewKeys.all, 'list'] as const,
  detail: (id: string) => [...interviewKeys.all, 'detail', id] as const,
  dashboard: () => ['dashboard'] as const,
};

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: interviewKeys.dashboard(),
    queryFn: interviewApi.dashboard,
  });
}

export function useInterviewList() {
  return useQuery<InterviewDto[]>({
    queryKey: interviewKeys.list(),
    queryFn: interviewApi.list,
  });
}

export function useInterview(id: string) {
  return useQuery<InterviewDetailDto>({
    queryKey: interviewKeys.detail(id),
    queryFn: () => interviewApi.get(id),
    enabled: Boolean(id),
  });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation<InterviewDetailDto, Error, CreateInterviewInput>({
    mutationFn: interviewApi.create,
    onSuccess: (detail) => {
      // Prime the detail cache and refresh lists/dashboard.
      queryClient.setQueryData(interviewKeys.detail(detail.interview.id), detail);
      void queryClient.invalidateQueries({ queryKey: interviewKeys.list() });
      void queryClient.invalidateQueries({ queryKey: interviewKeys.dashboard() });
    },
  });
}
