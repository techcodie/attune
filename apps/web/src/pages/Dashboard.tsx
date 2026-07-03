import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { CandidateProfileDto } from '@cadence/types';
import { StatCard } from '@/components/ui/StatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import { InterviewRow } from '@/components/interview/InterviewRow';
import { LineChart } from '@/components/charts/LineChart';
import { RadarChart } from '@/components/charts/RadarChart';
import { recommendationLabel } from '@/features/report/export';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { useProfileQuery } from '@/features/profile/useProfile';
import { useDashboard, useInterviewList } from '@/features/interview/useInterviews';
import {
  EXPERIENCE_LEVEL_OPTIONS,
  INTERVIEW_TYPE_OPTIONS,
} from '@/features/profile/options';

const labelFor = (opts: readonly { value: string; label: string }[], value: string): string =>
  opts.find((o) => o.value === value)?.label ?? value;

function ProfileSummary({ profile, onEdit }: { profile: CandidateProfileDto; onEdit: () => void }) {
  const rows = [
    { label: 'Target role', value: profile.targetRole },
    { label: 'Experience', value: labelFor(EXPERIENCE_LEVEL_OPTIONS, profile.experienceLevel) },
    { label: 'Years', value: `${profile.yearsExperience} yr` },
    { label: 'Preferred type', value: labelFor(INTERVIEW_TYPE_OPTIONS, profile.preferredType) },
  ];
  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Your profile</h2>
        <button onClick={onEdit} className="text-sm font-medium text-accent-400 hover:text-accent-500">
          Edit
        </button>
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4">
        {rows.map((r) => (
          <div key={r.label}>
            <dt className="text-xs text-slate-500">{r.label}</dt>
            <dd className="mt-0.5 text-sm font-medium text-slate-200">{r.value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-5">
        <dt className="text-xs text-slate-500">Focus skills</dt>
        <dd className="mt-2 flex flex-wrap gap-2">
          {profile.focusSkills.map((s) => (
            <span key={s} className="rounded-lg bg-accent/15 px-2.5 py-1 text-xs text-accent-400">
              {s}
            </span>
          ))}
        </dd>
      </div>
    </div>
  );
}

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { data: profile, isLoading: profileLoading } = useProfileQuery();
  const { data: stats, isLoading: statsLoading } = useDashboard();
  const { data: interviews, isLoading: listLoading } = useInterviewList();
  const firstName = user?.fullName.split(' ')[0] ?? 'there';

  return (
    <div className="flex flex-col gap-8">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Welcome back, {firstName}</h1>
          <p className="mt-1.5 text-slate-400">
            Ready to sharpen up? Your interviewer adapts to every answer you give.
          </p>
        </div>
        <Link to="/interviews/new" className="btn-primary shrink-0">
          Start a mock interview
        </Link>
      </motion.div>

      {/* Resume banner */}
      {stats?.activeInterview && (
        <Link
          to={`/interviews/${stats.activeInterview.id}`}
          className="glass flex items-center justify-between rounded-2xl border-accent/30 p-5 transition hover:border-accent/50"
        >
          <div>
            <p className="text-sm font-semibold text-white">Continue where you left off</p>
            <p className="text-sm text-slate-400">
              {stats.activeInterview.targetRole} · {stats.activeInterview.durationMinutes} min
            </p>
          </div>
          <span className="btn-primary pointer-events-none">Resume</span>
        </Link>
      )}

      {/* Live stat row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statsLoading || !stats ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard
              label="Overall score"
              value={stats.averageScore ?? '—'}
              sublabel={stats.lastRecommendation ? recommendationLabel(stats.lastRecommendation) : 'no reports yet'}
            />
            <StatCard label="Interviews" value={stats.completedCount} sublabel={`${stats.totalCount} created`} />
            <StatCard label="Completion" value={`${stats.completionRate}%`} sublabel="finished" />
            <StatCard
              label="Recent change"
              value={
                stats.recentImprovement === null
                  ? '—'
                  : `${stats.recentImprovement >= 0 ? '+' : ''}${stats.recentImprovement}`
              }
              sublabel="vs. previous"
            />
          </>
        )}
      </div>

      {/* Analytics — driven entirely by persisted evaluations */}
      {stats && stats.scoreTrend.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="glass rounded-2xl p-6 lg:col-span-2">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Score trend</h2>
            <LineChart
              values={stats.scoreTrend.map((p) => p.score)}
              labels={stats.scoreTrend.map((p) => p.label)}
            />
          </div>
          <div className="glass rounded-2xl p-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">Skills</h2>
            {stats.skillsRadar.length >= 3 ? (
              <RadarChart points={stats.skillsRadar} size={220} />
            ) : (
              <p className="text-sm text-slate-500">Complete an interview to see your skill profile.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent interviews */}
        <section className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Recent interviews
          </h2>
          {listLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : interviews && interviews.length > 0 ? (
            <div className="flex flex-col gap-3">
              {interviews.slice(0, 6).map((iv) => (
                <InterviewRow key={iv.id} interview={iv} />
              ))}
            </div>
          ) : (
            <div className="glass flex flex-col items-center rounded-2xl p-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 text-2xl">
                🎙️
              </div>
              <h3 className="mt-4 font-semibold text-white">No interviews yet</h3>
              <p className="mt-1.5 max-w-sm text-sm text-slate-500">
                Configure your first mock interview — we’ll initialise its state and topic coverage
                instantly.
              </p>
              <Link to="/interviews/new" className="btn-primary mt-6">
                Start your first interview
              </Link>
            </div>
          )}
        </section>

        {/* Profile + roadmap */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {profileLoading ? (
            <Skeleton className="h-64 rounded-2xl" />
          ) : profile ? (
            <ProfileSummary profile={profile} onEdit={() => navigate('/profile')} />
          ) : null}

          <div className="glass rounded-2xl p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Coming soon</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {[
                { title: 'Voice interviews', desc: 'Real-time speech with a natural interviewer', tag: 'M4' },
                { title: 'Adaptive difficulty', desc: 'Questions that ramp with your answers', tag: 'M3' },
                { title: 'Scored reports', desc: 'Six-axis feedback and a learning path', tag: 'M6' },
              ].map((f) => (
                <li key={f.title} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-cyanic">
                    {f.tag}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{f.title}</p>
                    <p className="text-xs text-slate-500">{f.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
