import type { TimelineEventDto } from '@cadence/types';

/** Vertical timeline of interview events (seeded in M2, grows in M3+). */
export function Timeline({ events }: { events: TimelineEventDto[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-500">No events yet.</p>;
  }
  return (
    <ol className="relative flex flex-col gap-5 border-l border-white/10 pl-5">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-ink-900 bg-accent" />
          <p className="text-sm font-medium text-slate-200">{e.label}</p>
          <p className="text-xs text-slate-500">
            {e.type.replaceAll('_', ' ').toLowerCase()} · +{Math.round(e.atMs / 1000)}s
          </p>
        </li>
      ))}
    </ol>
  );
}
