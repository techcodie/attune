interface StatusPillProps {
  label: string;
  state: 'ok' | 'degraded' | 'loading' | 'down';
}

const STYLES: Record<StatusPillProps['state'], { dot: string; text: string }> = {
  ok: { dot: 'bg-emerald-400', text: 'text-emerald-300' },
  degraded: { dot: 'bg-amber-400', text: 'text-amber-300' },
  loading: { dot: 'bg-slate-400 animate-pulse', text: 'text-slate-400' },
  down: { dot: 'bg-rose-500', text: 'text-rose-300' },
};

export function StatusPill({ label, state }: StatusPillProps) {
  const s = STYLES[state];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${s.dot}`} />
      <span className={s.text}>{label}</span>
    </span>
  );
}
