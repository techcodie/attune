import { DURATION_META } from '@/features/interview/options';

interface DurationSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

/** Chip group for the configured interview duration. */
export function DurationSelector({ value, onChange }: DurationSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DURATION_META.map((d) => {
        const selected = d.value === value;
        return (
          <button
            key={d.value}
            type="button"
            onClick={() => onChange(d.value)}
            aria-pressed={selected}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition
              ${
                selected
                  ? 'border-accent/70 bg-accent/10 text-white'
                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20'
              }`}
          >
            {d.label}
          </button>
        );
      })}
    </div>
  );
}
