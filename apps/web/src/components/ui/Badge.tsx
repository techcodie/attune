import type { InterviewStatus } from '@cadence/types';

type Tone = 'created' | 'progress' | 'completed' | 'abandoned' | 'neutral';

const TONES: Record<Tone, string> = {
  created: 'bg-accent/15 text-accent-400',
  progress: 'bg-cyanic/15 text-cyanic',
  completed: 'bg-emerald-400/15 text-emerald-300',
  abandoned: 'bg-slate-500/15 text-slate-400',
  neutral: 'bg-white/10 text-slate-300',
};

const STATUS_TONE: Record<InterviewStatus, Tone> = {
  CREATED: 'created',
  IN_PROGRESS: 'progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
};

const STATUS_LABEL: Record<InterviewStatus, string> = {
  CREATED: 'Ready',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  ABANDONED: 'Abandoned',
};

export function Badge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
      {children}
    </span>
  );
}

/** Status pill for an interview record. */
export function StatusBadge({ status }: { status: InterviewStatus }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Badge>;
}
