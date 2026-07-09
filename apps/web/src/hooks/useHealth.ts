import { useQuery } from '@tanstack/react-query';
import type { HealthStatus } from '@cadence/types';
import { api } from '@/lib/api';

/**
 * Live API health probe — used to prove end-to-end wiring on the landing page.
 *
 * The free-tier backend spins down when idle and takes ~50s to cold-start, so the
 * probe is given a generous 70s timeout (longer than the default) and retries a
 * couple of times. While it's inflight the query stays `pending` (an amber
 * "warming up" pill) rather than flipping the pills red — red is reserved for a
 * genuine failure after the server has had time to wake.
 */
export function useHealth() {
  return useQuery<HealthStatus>({
    queryKey: ['health'],
    queryFn: () => api.get<HealthStatus>('/health', { timeoutMs: 70_000 }),
    refetchInterval: 15_000,
    retry: 2,
    retryDelay: 3_000,
  });
}
