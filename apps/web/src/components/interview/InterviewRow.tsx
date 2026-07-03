import { Link } from 'react-router-dom';
import type { InterviewDto } from '@cadence/types';
import { StatusBadge } from '@/components/ui/Badge';
import { INTERVIEW_TYPE_META } from '@/features/interview/options';

const typeMeta = (v: InterviewDto['interviewType']) =>
  INTERVIEW_TYPE_META.find((m) => m.value === v);

/** Compact, clickable interview record for lists. */
export function InterviewRow({ interview }: { interview: InterviewDto }) {
  const meta = typeMeta(interview.interviewType);
  return (
    <Link
      to={`/interviews/${interview.id}`}
      className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-white/15 hover:bg-white/[0.04]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">
        {meta?.icon ?? '🎙️'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{interview.targetRole}</p>
        <p className="text-xs text-slate-500">
          {meta?.label} · Difficulty {interview.difficulty} · {interview.durationMinutes} min
        </p>
      </div>
      <StatusBadge status={interview.status} />
    </Link>
  );
}
