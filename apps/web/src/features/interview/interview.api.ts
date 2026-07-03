import type {
  CoverageReport,
  CreateInterviewInput,
  DashboardStats,
  InterviewDetailDto,
  InterviewDto,
} from '@cadence/types';
import { api } from '@/lib/api';

export const interviewApi = {
  create: (input: CreateInterviewInput) =>
    api.post<InterviewDetailDto>('/interviews', input),
  list: () => api.get<InterviewDto[]>('/interviews'),
  get: (id: string) => api.get<InterviewDetailDto>(`/interviews/${id}`),
  coverage: (id: string) => api.get<CoverageReport>(`/interviews/${id}/coverage`),
  dashboard: () => api.get<DashboardStats>('/interviews/dashboard'),
};
