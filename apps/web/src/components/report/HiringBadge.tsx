import type { HiringRecommendation } from '@cadence/types';
import { recommendationLabel } from '@/features/report/export';

const STYLE: Record<HiringRecommendation, string> = {
  STRONG_HIRE: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
  HIRE: 'bg-cyanic/15 text-cyanic border-cyanic/30',
  LEAN_HIRE: 'bg-accent/15 text-accent-400 border-accent/30',
  LEAN_NO_HIRE: 'bg-amber-400/15 text-amber-300 border-amber-400/30',
  NO_HIRE: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
};

export function HiringBadge({ recommendation }: { recommendation: HiringRecommendation }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${STYLE[recommendation]}`}>
      {recommendationLabel(recommendation)}
    </span>
  );
}
