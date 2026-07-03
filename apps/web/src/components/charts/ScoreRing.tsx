interface ScoreRingProps {
  value: number; // 0–100
  size?: number;
  label?: string;
}

function bandColor(v: number): string {
  if (v >= 75) return '#37e6d0';
  if (v >= 55) return '#7c6cff';
  if (v >= 40) return '#fbbf24';
  return '#fb7185';
}

/** Circular overall-score gauge. */
export function ScoreRing({ value, size = 128, label = 'Overall' }: ScoreRingProps) {
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = c - (clamped / 100) * c;
  const color = bandColor(clamped);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-white">{clamped}</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">{label}</span>
      </div>
    </div>
  );
}
