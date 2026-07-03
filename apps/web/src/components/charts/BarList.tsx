interface BarItem {
  label: string;
  value: number; // 0–100
  hint?: string;
}

interface BarListProps {
  items: BarItem[];
  /** Colour by score band (good/mid/low) instead of a flat accent. */
  banded?: boolean;
}

function colorFor(v: number, banded: boolean): string {
  if (!banded) return 'from-accent to-cyanic';
  if (v >= 75) return 'from-emerald-400 to-cyanic';
  if (v >= 55) return 'from-accent to-cyanic';
  return 'from-amber-400 to-rose-400';
}

/** Horizontal labelled bars — used for category scores and topic coverage. */
export function BarList({ items, banded = false }: BarListProps) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((it) => (
        <li key={it.label} className="grid grid-cols-[9rem_1fr_2.5rem] items-center gap-3">
          <span className="truncate text-xs text-slate-400" title={it.label}>
            {it.label}
          </span>
          <span className="h-2 overflow-hidden rounded-full bg-white/10">
            <span
              className={`block h-full rounded-full bg-gradient-to-r ${colorFor(it.value, banded)}`}
              style={{ width: `${Math.max(0, Math.min(100, it.value))}%` }}
            />
          </span>
          <span className="text-right text-xs font-medium tabular-nums text-slate-200">
            {it.hint ?? it.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
