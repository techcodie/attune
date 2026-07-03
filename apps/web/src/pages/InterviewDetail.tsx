import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { CoverageList } from '@/components/interview/CoverageList';
import { Timeline } from '@/components/interview/Timeline';
import { useInterview } from '@/features/interview/useInterviews';
import {
  DIFFICULTY_META,
  INTERVIEW_TYPE_META,
  PERSONALITY_META,
} from '@/features/interview/options';

const label = <T extends string | number>(
  list: readonly { value: T; label: string }[],
  v: T,
): string => list.find((m) => m.value === v)?.label ?? String(v);

const prettyStage = (stage: string): string =>
  stage.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>
      {children}
    </section>
  );
}

export function InterviewDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data, isLoading, isError } = useInterview(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-20" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-72 lg:col-span-2" />
          <Skeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="glass mx-auto max-w-md rounded-2xl p-8 text-center">
        <h2 className="text-lg font-semibold text-white">Interview not found</h2>
        <p className="mt-2 text-sm text-slate-400">It may have been removed, or the link is wrong.</p>
        <Button className="mt-6" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </Button>
      </div>
    );
  }

  const { interview, state, coverage, timeline } = data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{interview.targetRole}</h1>
            <StatusBadge status={interview.status} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {label(INTERVIEW_TYPE_META, interview.interviewType)} ·{' '}
            {label(PERSONALITY_META, interview.interviewerPersonality)} · Difficulty{' '}
            {interview.difficulty} ({label(DIFFICULTY_META, interview.difficulty)}) ·{' '}
            {interview.durationMinutes} min
          </p>
        </div>
        {interview.status === 'COMPLETED' ? (
          <div className="flex shrink-0 gap-2">
            <Button variant="ghost" onClick={() => navigate(`/interviews/${interview.id}/room`)}>
              Transcript
            </Button>
            <Link to={`/interviews/${interview.id}/report`} className="btn-primary">
              View report
            </Link>
          </div>
        ) : (
          <Link to={`/interviews/${interview.id}/room`} className="btn-primary shrink-0">
            {interview.status === 'IN_PROGRESS' ? 'Resume interview' : 'Enter interview room'}
          </Link>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Initialized state */}
          <Section title="Interview state">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500">Current stage</p>
                <p className="mt-0.5 text-sm font-medium text-slate-200">
                  {prettyStage(state.currentStage)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Progress</p>
                <p className="mt-0.5 text-sm font-medium text-slate-200">{state.interviewProgress}%</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500">Objective</p>
                <p className="mt-0.5 text-sm font-medium text-slate-200">{state.currentObjective}</p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4">
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                  <span>Technical accuracy</span>
                  <span>{Math.round(state.technicalAccuracy)}%</span>
                </div>
                <ProgressBar value={state.technicalAccuracy} />
              </div>
              <div>
                <div className="mb-1.5 flex justify-between text-xs text-slate-500">
                  <span>Communication</span>
                  <span>{Math.round(state.communicationScore)}%</span>
                </div>
                <ProgressBar value={state.communicationScore} />
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Signals, scores and summary populate live once the conversation begins in M3.
            </p>
          </Section>

          {/* Coverage engine output */}
          <Section title="Topic coverage">
            <CoverageList coverage={coverage} />
          </Section>
        </div>

        {/* Side column */}
        <div className="flex flex-col gap-6">
          <Section title="Configuration">
            <dl className="flex flex-col gap-3 text-sm">
              {[
                { k: 'Language', v: interview.preferredLanguage },
                { k: 'Voice', v: interview.voicePreference ?? 'default' },
                { k: 'Created', v: new Date(interview.createdAt).toLocaleString() },
              ].map((r) => (
                <div key={r.k} className="flex justify-between">
                  <dt className="text-slate-500">{r.k}</dt>
                  <dd className="font-medium text-slate-300">{r.v}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="Timeline">
            <Timeline events={timeline} />
          </Section>
        </div>
      </div>
    </motion.div>
  );
}
