import { useEffect, useState } from 'react';

/**
 * Ticks elapsed milliseconds from a fixed epoch while `active`. Freezes (keeps
 * the last value) when paused or inactive.
 */
export function useElapsed(active: boolean, startEpoch: number | null): number {
  const [ms, setMs] = useState(0);

  useEffect(() => {
    if (!active || !startEpoch) return;
    const tick = () => setMs(Date.now() - startEpoch);
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [active, startEpoch]);

  return ms;
}
