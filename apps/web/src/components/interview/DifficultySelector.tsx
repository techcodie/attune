import type { Difficulty } from '@cadence/types';
import { DIFFICULTY_META } from '@/features/interview/options';

interface DifficultySelectorProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

/** Segmented 1–5 difficulty control with a description of the current level. */
export function DifficultySelector({ value, onChange }: DifficultySelectorProps) {
  const current = DIFFICULTY_META.find((d) => d.value === value);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-5 gap-2">
        {DIFFICULTY_META.map((d) => {
          const selected = d.value === value;
          return (
            <button
              key={d.value}
              type="button"
              onClick={() => onChange(d.value)}
              aria-pressed={selected}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 transition
                ${
                  selected
                    ? 'border-accent/70 bg-accent/10'
                    : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                }`}
            >
              <span className={`text-lg font-bold ${selected ? 'text-white' : 'text-slate-400'}`}>
                {d.value}
              </span>
              <span className={`text-[11px] ${selected ? 'text-accent-400' : 'text-slate-500'}`}>
                {d.label}
              </span>
            </button>
          );
        })}
      </div>
      {current && <p className="text-sm text-slate-400">{current.description}</p>}
    </div>
  );
}
