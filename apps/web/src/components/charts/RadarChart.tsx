import type { RadarPoint } from '@cadence/types';

interface RadarChartProps {
  points: RadarPoint[];
  size?: number;
}

/** A dependency-free SVG radar chart for skill scores (0–100 per axis). */
export function RadarChart({ points, size = 260 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 44;
  const n = points.length;
  if (n < 3) return <p className="text-sm text-slate-500">Not enough data for a radar yet.</p>;

  const angleFor = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const coord = (i: number, r: number) => ({
    x: cx + r * Math.cos(angleFor(i)),
    y: cy + r * Math.sin(angleFor(i)),
  });

  const valuePath = points
    .map((p, i) => {
      const { x, y } = coord(i, (Math.max(0, Math.min(100, p.score)) / 100) * radius);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[280px]">
      {/* grid rings */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={points.map((_, i) => { const { x, y } = coord(i, radius * f); return `${x},${y}`; }).join(' ')}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={1}
        />
      ))}
      {/* axes + labels */}
      {points.map((p, i) => {
        const edge = coord(i, radius);
        const label = coord(i, radius + 16);
        return (
          <g key={p.label}>
            <line x1={cx} y1={cy} x2={edge.x} y2={edge.y} stroke="rgba(255,255,255,0.08)" />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-slate-500 text-[8px]"
            >
              {p.label.length > 14 ? `${p.label.slice(0, 13)}…` : p.label}
            </text>
          </g>
        );
      })}
      {/* value polygon */}
      <path d={`${valuePath} Z`} fill="rgba(124,108,255,0.25)" stroke="#7c6cff" strokeWidth={2} />
      {points.map((p, i) => {
        const { x, y } = coord(i, (p.score / 100) * radius);
        return <circle key={p.label} cx={x} cy={y} r={2.5} fill="#37e6d0" />;
      })}
    </svg>
  );
}
