import type { CoverageReport } from '@cadence/types';
import { ProgressBar } from '@/components/ui/ProgressBar';

/** Renders the Coverage Engine's report: required topics + covered/remaining. */
export function CoverageList({ coverage }: { coverage: CoverageReport }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">
          {coverage.coveredCount} of {coverage.totalCount} topics covered
        </span>
        <span className="text-sm font-semibold text-white">{coverage.coveragePct}%</span>
      </div>
      <ProgressBar value={coverage.coveragePct} />

      <ul className="mt-1 grid gap-2 sm:grid-cols-2">
        {coverage.topics.map((t) => (
          <li key={t.key} className="flex items-center gap-2.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] ${
                t.covered ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/5 text-slate-600'
              }`}
            >
              {t.covered ? '✓' : '○'}
            </span>
            <span className={`text-sm ${t.covered ? 'text-slate-200' : 'text-slate-500'}`}>
              {t.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
