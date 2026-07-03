import { memo, useState } from 'react';
import type { CoverageReport, InterviewStateDto, TurnResult } from '@cadence/types';

interface DebugPanelProps {
  state: InterviewStateDto | null;
  coverage: CoverageReport | null;
  lastTurn: TurnResult | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1 text-xs">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

/**
 * Developer-only AI transparency panel. Renders the live InterviewState, the
 * LangGraph node that ran last, and the reason the next question was chosen —
 * exactly the signals the engine used. Gated behind VITE_DEBUG_AI by the room.
 */
export const DebugPanel = memo(function DebugPanel({ state, coverage, lastTurn }: DebugPanelProps) {
  const [showState, setShowState] = useState(false);
  const debug = lastTurn?.debug;

  return (
    <aside className="glass flex flex-col gap-4 rounded-2xl p-5">
      <div className="flex items-center gap-2">
        <span className="rounded-md bg-cyanic/15 px-2 py-0.5 text-[10px] font-bold uppercase text-cyanic">
          Debug · AI
        </span>
        <span className="text-xs text-slate-500">{debug?.provider ?? 'engine'}</span>
      </div>

      <div>
        <Row label="Current node" value={debug?.currentNode ?? '—'} />
        <Row label="Stage" value={state?.currentStage ?? '—'} />
        <Row label="Objective" value={state?.currentObjective ?? '—'} />
        <Row label="Active topic" value={state?.activeTopic ?? '—'} />
        <Row label="Difficulty" value={lastTurn?.decision?.difficulty ?? '—'} />
        <Row label="Coverage" value={coverage ? `${coverage.coveragePct}%` : '—'} />
        <Row label="Progress" value={state ? `${state.interviewProgress}%` : '—'} />
        <Row label="Tech / Comm" value={state ? `${Math.round(state.technicalAccuracy)} / ${Math.round(state.communicationScore)}` : '—'} />
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Why this question
        </p>
        <p className="rounded-lg bg-white/5 p-2.5 text-xs text-slate-300">
          {debug?.action ? (
            <>
              <span className="font-semibold text-cyanic">{debug.action}</span>
              {debug.focusTopic ? ` → ${debug.focusTopic}` : ''} · {debug.reason}
            </>
          ) : (
            debug?.reason ?? 'Waiting for the first answer…'
          )}
        </p>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Graph trail
        </p>
        <div className="flex flex-wrap gap-1">
          {(debug?.nodeTrail ?? []).map((n, i) => (
            <span key={`${n}-${i}`} className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
              {n}
            </span>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Summary
        </p>
        <p className="text-xs text-slate-400">{state?.conversationSummary || '(none yet)'}</p>
      </div>

      <button
        onClick={() => setShowState((s) => !s)}
        className="text-left text-[11px] font-medium text-accent-400 hover:text-accent-500"
      >
        {showState ? 'Hide' : 'Show'} raw InterviewState
      </button>
      {showState && (
        <pre className="max-h-64 overflow-auto rounded-lg bg-black/40 p-3 text-[10px] leading-relaxed text-slate-400">
          {JSON.stringify(state, null, 2)}
        </pre>
      )}
    </aside>
  );
});
