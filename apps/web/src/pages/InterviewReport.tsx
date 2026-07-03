import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { EvaluationReport } from '@cadence/types';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ScoreRing } from '@/components/charts/ScoreRing';
import { RadarChart } from '@/components/charts/RadarChart';
import { BarList } from '@/components/charts/BarList';
import { HiringBadge } from '@/components/report/HiringBadge';
import { useReport } from '@/features/report/useReport';
import { exportJson, exportMarkdown, exportPdf } from '@/features/report/export';

const DEBUG = import.meta.env.VITE_DEBUG_AI === 'true';

function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass rounded-2xl p-6 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">{title}</h2>}
      {children}
    </section>
  );
}

function List({ items, tone }: { items: string[]; tone: 'good' | 'bad' }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((s) => (
        <li key={s} className="flex gap-2 text-sm text-slate-300">
          <span className={tone === 'good' ? 'text-emerald-400' : 'text-amber-400'}>{tone === 'good' ? '✓' : '△'}</span>
          {s}
        </li>
      ))}
    </ul>
  );
}

function ReportBody({ report }: { report: EvaluationReport }) {
  const applicable = report.categories.filter((c) => c.applicable);
  const radar = applicable.map((c) => ({ label: c.label, score: c.score }));
  const bars = applicable.map((c) => ({ label: c.label, value: c.score }));

  return (
    <div className="report-print flex flex-col gap-6">
      {/* Hero */}
      <Card>
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{report.targetRole}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {report.interviewType.replace('_', ' ')} · {Math.round(report.durationSec / 60)} min ·{' '}
              {new Date(report.generatedAt).toLocaleDateString()}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <HiringBadge recommendation={report.hiring.recommendation} />
              <span className="text-sm text-slate-500">{report.hiring.confidence}% confidence</span>
            </div>
          </div>
          <ScoreRing value={report.overallScore} />
        </div>
        <p className="mt-6 border-t border-white/5 pt-4 text-sm leading-relaxed text-slate-300">
          {report.summary}
        </p>
      </Card>

      {/* Hiring recommendation */}
      <Card title="Hiring recommendation">
        <p className="text-sm leading-relaxed text-slate-200">{report.hiring.reasoning}</p>
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-300">Supporting evidence</p>
            <List items={report.hiring.supportingEvidence} tone="good" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-300">Concerns</p>
            <List items={report.hiring.concerns} tone="bad" />
          </div>
        </div>
        <p className="mt-5 border-t border-white/5 pt-4 text-sm text-slate-400">
          <span className="font-medium text-slate-300">Suggested next round:</span> {report.hiring.suggestedNextRound}
        </p>
      </Card>

      {/* Scores */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Skills radar">
          <RadarChart points={radar} />
        </Card>
        <Card title="Category scores">
          <BarList items={bars} banded />
          <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
            {applicable.slice(0, 3).map((c) => (
              <p key={c.key} className="text-xs text-slate-500">
                <span className="font-medium text-slate-400">{c.label}:</span> {c.justification}
              </p>
            ))}
          </div>
        </Card>
      </div>

      {/* Highlights */}
      <Card title="Highlights">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Top strengths</p>
            <List items={report.highlights.strengths} tone="good" />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Improvement areas</p>
            <List items={report.highlights.improvementAreas} tone="bad" />
          </div>
        </div>
        <div className="mt-5 grid gap-4 border-t border-white/5 pt-5 sm:grid-cols-2">
          {[
            { k: 'Best answer', v: report.highlights.bestAnswer },
            { k: 'Weakest answer', v: report.highlights.weakestAnswer },
            { k: 'Most impressive', v: report.highlights.mostImpressiveMoment },
            { k: 'Missed opportunity', v: report.highlights.missedOpportunity },
          ].map((row) => (
            <div key={row.k}>
              <p className="text-xs text-slate-500">{row.k}</p>
              <p className="mt-0.5 text-sm text-slate-300">{row.v}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Learning roadmap */}
      {report.learningPlan.length > 0 && (
        <Card title="Personalized learning roadmap">
          <div className="flex flex-col gap-5">
            {report.learningPlan.map((item) => (
              <div key={item.weakness}>
                <p className="mb-2 text-sm font-semibold text-white">{item.weakness}</p>
                <ol className="flex flex-col gap-2 border-l border-white/10 pl-4">
                  {item.steps.map((s, i) => (
                    <li key={s.title} className="text-sm">
                      <span className="font-medium text-accent-400">{i + 1}. {s.title}</span>
                      <span className="text-slate-400"> — {s.detail}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card title="Interview timeline">
        <ol className="flex flex-col gap-5 border-l border-white/10 pl-5">
          {report.timeline.map((t, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-ink-900 bg-accent" />
              <p className="text-sm font-medium text-slate-200">Q{i + 1}: {t.question}</p>
              <p className="mt-1 text-sm text-slate-400">↳ {t.candidateSummary}</p>
              {t.reason && <p className="mt-1 text-xs text-cyanic">Why next: {t.reason}</p>}
              <p className="mt-1 text-[11px] text-slate-600">
                {t.coveredTopic ? `Covered: ${t.coveredTopic} · ` : ''}
                {t.difficulty ? `Difficulty ${t.difficulty} · ` : ''}
                +{Math.round(t.atMs / 1000)}s
              </p>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

export function InterviewReport() {
  const { id = '' } = useParams();
  const { data, isLoading, isError, error } = useReport(id);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="no-print mb-8 flex items-center justify-between">
        <Link to={`/interviews/${id}`} className="flex items-center gap-3">
          <Logo />
        </Link>
        {data && (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={exportPdf}>
              ⬇ PDF
            </Button>
            <Button variant="ghost" onClick={() => exportMarkdown(data)}>
              ⬇ Markdown
            </Button>
            {DEBUG && (
              <Button variant="ghost" onClick={() => exportJson(data)}>
                ⬇ JSON
              </Button>
            )}
          </div>
        )}
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : isError || !data ? (
        <div className="glass rounded-2xl p-8 text-center">
          <h2 className="text-lg font-semibold text-white">Report unavailable</h2>
          <p className="mt-2 text-sm text-slate-400">
            {error instanceof Error ? error.message : 'The interview may not be finished yet.'}
          </p>
          <Link to={`/interviews/${id}`} className="btn-primary mt-6 inline-flex">
            Back to interview
          </Link>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <ReportBody report={data} />
        </motion.div>
      )}
    </div>
  );
}
