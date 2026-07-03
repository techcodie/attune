interface LineChartProps {
  values: number[];
  labels?: string[];
  /** Domain max; defaults to 100. */
  max?: number;
  height?: number;
  suffix?: string;
}

/** Minimal SVG line chart for trends (scores, confidence, durations). */
export function LineChart({ values, labels, max = 100, height = 120, suffix = '' }: LineChartProps) {
  if (values.length === 0) return <p className="text-sm text-slate-500">No data yet.</p>;

  const width = 320;
  const padX = 12;
  const padY = 12;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;
  const domainMax = Math.max(max, ...values) || 1;

  const x = (i: number) => padX + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
  const y = (v: number) => padY + innerH - (v / domainMax) * innerH;

  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = `${path} L${x(values.length - 1)},${padY + innerH} L${x(0)},${padY + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(124,108,255,0.35)" />
          <stop offset="1" stopColor="rgba(124,108,255,0)" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#line-fill)" />
      <path d={path} fill="none" stroke="#7c6cff" strokeWidth={2} strokeLinecap="round" />
      {values.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r={3} fill="#37e6d0" />
          {labels?.[i] && (
            <text x={x(i)} y={height - 1} textAnchor="middle" className="fill-slate-600 text-[8px]">
              {labels[i]}
            </text>
          )}
        </g>
      ))}
      <text x={x(values.length - 1)} y={y(values[values.length - 1]!) - 6} textAnchor="end" className="fill-slate-300 text-[9px]">
        {values[values.length - 1]}
        {suffix}
      </text>
    </svg>
  );
}
