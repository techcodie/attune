import { memo } from 'react';
import type { CoverageReport, InterviewStateDto, InterviewStatus } from '@cadence/types';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/Badge';

interface LiveStatusPanelProps {
  state: InterviewStateDto | null;
  coverage: CoverageReport | null;
  elapsedMs: number;
  difficulty: number;
  status: InterviewStatus;
}

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const prettyStage = (s: string): string =>
  s.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

/**
 * Live interview HUD — every field reads straight from InterviewState and
 * updates each turn. Memoised so the high-frequency waveform re-renders don't
 * touch it.
 */
export const LiveStatusPanel = memo(function LiveStatusPanel({
  state,
  coverage,
  elapsedMs,
  difficulty,
  status,
}: LiveStatusPanelProps) {
  return (
    <aside className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Live status</h2>
        <StatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-xs text-slate-500">Stage</p>
          <p className="mt-0.5 font-medium text-slate-200">
            {state ? prettyStage(state.currentStage) : '—'}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Elapsed</p>
          <p className="mt-0.5 font-medium text-slate-200 tabular-nums">{fmt(elapsedMs)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Difficulty</p>
          <p className="mt-0.5 font-medium text-slate-200">{difficulty} / 5</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Topics</p>
          <p className="mt-0.5 font-medium text-slate-200">
            {coverage ? `${coverage.coveredCount}/${coverage.totalCount}` : '—'}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1.5 flex justify-between text-xs text-slate-500">
          <span>Progress</span>
          <span>{state?.interviewProgress ?? 0}%</span>
        </div>
        <ProgressBar value={state?.interviewProgress ?? 0} />
      </div>

      {coverage && coverage.coveredCount > 0 && (
        <div>
          <p className="mb-2 text-xs text-slate-500">Covered</p>
          <div className="flex flex-wrap gap-1.5">
            {coverage.topics
              .filter((t) => t.covered)
              .map((t) => (
                <span
                  key={t.key}
                  className="rounded-md bg-emerald-400/15 px-2 py-0.5 text-[11px] text-emerald-300"
                >
                  {t.label}
                </span>
              ))}
          </div>
        </div>
      )}
    </aside>
  );
});
