import { useQuery } from '@tanstack/react-query';
import type { HealthStatus } from '@cadence/types';
import { api } from '@/lib/api';

/** Live API health probe — used to prove end-to-end wiring on the landing page. */
export function useHealth() {
  return useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: () => api.get<HealthStatus>('/health'),
    refetchInterval: 15_000,
  });
}
