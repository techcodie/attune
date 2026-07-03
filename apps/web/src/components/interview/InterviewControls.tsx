import { useState } from 'react';

interface InterviewControlsProps {
  paused: boolean;
  finished: boolean;
  onPause: () => void;
  onResume: () => void;
  onEnd: () => void;
  onRestart: () => void;
}

const base =
  'rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/5';

/** Lifecycle controls. Destructive actions require a second click to confirm. */
export function InterviewControls({
  paused,
  finished,
  onPause,
  onResume,
  onEnd,
  onRestart,
}: InterviewControlsProps) {
  const [confirm, setConfirm] = useState<'end' | 'restart' | null>(null);

  const guard = (action: 'end' | 'restart', run: () => void) => {
    if (confirm === action) {
      setConfirm(null);
      run();
    } else {
      setConfirm(action);
      window.setTimeout(() => setConfirm((c) => (c === action ? null : c)), 3000);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!finished &&
        (paused ? (
          <button onClick={onResume} className={`${base} text-emerald-300`}>
            ▶ Resume
          </button>
        ) : (
          <button onClick={onPause} className={`${base} text-slate-300`}>
            ⏸ Pause
          </button>
        ))}

      {!finished && (
        <button onClick={() => guard('end', onEnd)} className={`${base} text-amber-300`}>
          {confirm === 'end' ? 'Confirm end?' : '■ End early'}
        </button>
      )}

      <button onClick={() => guard('restart', onRestart)} className={`${base} text-slate-300`}>
        {confirm === 'restart' ? 'Confirm restart?' : '↺ Restart'}
      </button>
    </div>
  );
}
