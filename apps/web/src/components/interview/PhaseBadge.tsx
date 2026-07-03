import type { Phase } from '@/features/conversation/useVoiceInterview';

const META: Record<Phase, { label: string; dot: string; text: string }> = {
  idle: { label: 'Ready', dot: 'bg-slate-400', text: 'text-slate-400' },
  listening: { label: 'Listening', dot: 'bg-emerald-400 animate-pulse', text: 'text-emerald-300' },
  processing: { label: 'Processing speech', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-300' },
  thinking: { label: 'Thinking', dot: 'bg-accent animate-pulse', text: 'text-accent-400' },
  speaking: { label: 'Speaking', dot: 'bg-cyanic animate-pulse', text: 'text-cyanic' },
  paused: { label: 'Paused', dot: 'bg-slate-500', text: 'text-slate-400' },
  finished: { label: 'Complete', dot: 'bg-emerald-400', text: 'text-emerald-300' },
};

/** A clear, single source of truth for which interview phase is active. */
export function PhaseBadge({ phase }: { phase: Phase }) {
  const m = META[phase];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium">
      <span className={`h-2 w-2 rounded-full ${m.dot}`} />
      <span className={m.text}>{m.label}</span>
    </span>
  );
}
