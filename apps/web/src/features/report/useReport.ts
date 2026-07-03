import { useQuery } from '@tanstack/react-query';
import type { EvaluationReport } from '@cadence/types';
import { reportApi } from './report.api';

/** The persisted evaluation report. Generated once server-side, then cached. */
export function useReport(interviewId: string) {
  return useQuery<EvaluationReport>({
    queryKey: ['report', interviewId],
    queryFn: () => reportApi.get(interviewId),
    enabled: Boolean(interviewId),
    staleTime: Infinity,
    retry: 1,
  });
}
