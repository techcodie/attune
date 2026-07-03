import type { EvaluationReport } from '@cadence/types';
import { api } from '@/lib/api';

export const reportApi = {
  /** Fetches the report, generating it once on the server if needed. */
  get: (id: string) => api.get<EvaluationReport>(`/interviews/${id}/report`),
};
