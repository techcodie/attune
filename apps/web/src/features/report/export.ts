import type { EvaluationReport, HiringRecommendation } from '@cadence/types';

const REC_LABEL: Record<HiringRecommendation, string> = {
  STRONG_HIRE: 'Strong Hire',
  HIRE: 'Hire',
  LEAN_HIRE: 'Lean Hire',
  LEAN_NO_HIRE: 'Lean No Hire',
  NO_HIRE: 'No Hire',
};

export const recommendationLabel = (r: HiringRecommendation): string => REC_LABEL[r];

/** Render the report as a professionally-formatted Markdown document. */
export function reportToMarkdown(r: EvaluationReport): string {
  const lines: string[] = [];
  const bullet = (items: string[]) => items.map((i) => `- ${i}`).join('\n');

  lines.push(`# Interview Report — ${r.targetRole}`);
  lines.push('');
  lines.push(`**Format:** ${r.interviewType.replace('_', ' ')}  `);
  lines.push(`**Overall Score:** ${r.overallScore}/100  `);
  lines.push(`**Recommendation:** ${recommendationLabel(r.hiring.recommendation)} (${r.hiring.confidence}% confidence)  `);
  lines.push(`**Duration:** ${Math.round(r.durationSec / 60)} min  `);
  lines.push(`**Generated:** ${new Date(r.generatedAt).toLocaleString()}`);
  lines.push('');

  lines.push('## Summary');
  lines.push(r.summary || '_No summary._');
  lines.push('');

  lines.push('## Hiring Recommendation');
  lines.push(r.hiring.reasoning);
  lines.push('');
  if (r.hiring.supportingEvidence.length) {
    lines.push('**Supporting evidence**');
    lines.push(bullet(r.hiring.supportingEvidence));
    lines.push('');
  }
  if (r.hiring.concerns.length) {
    lines.push('**Concerns**');
    lines.push(bullet(r.hiring.concerns));
    lines.push('');
  }
  lines.push(`**Suggested next round:** ${r.hiring.suggestedNextRound || '—'}`);
  lines.push('');

  lines.push('## Category Scores');
  lines.push('| Category | Score | Notes |');
  lines.push('| --- | --- | --- |');
  for (const c of r.categories) {
    lines.push(`| ${c.label} | ${c.applicable ? `${c.score}/100` : 'N/A'} | ${c.justification} |`);
  }
  lines.push('');

  lines.push('## Highlights');
  lines.push('**Top strengths**');
  lines.push(bullet(r.highlights.strengths));
  lines.push('');
  lines.push('**Improvement areas**');
  lines.push(bullet(r.highlights.improvementAreas));
  lines.push('');
  lines.push(`**Best answer:** ${r.highlights.bestAnswer}`);
  lines.push(`**Weakest answer:** ${r.highlights.weakestAnswer}`);
  lines.push(`**Most impressive:** ${r.highlights.mostImpressiveMoment}`);
  lines.push(`**Missed opportunity:** ${r.highlights.missedOpportunity}`);
  lines.push('');

  if (r.learningPlan.length) {
    lines.push('## Learning Roadmap');
    for (const item of r.learningPlan) {
      lines.push(`### ${item.weakness}`);
      for (const step of item.steps) lines.push(`- **${step.title}** — ${step.detail}`);
      lines.push('');
    }
  }

  lines.push('## Interview Timeline');
  r.timeline.forEach((t, i) => {
    lines.push(`**${i + 1}. Q:** ${t.question}`);
    lines.push(`- Candidate: ${t.candidateSummary}`);
    if (t.reason) lines.push(`- Interviewer reasoning: ${t.reason}`);
    if (t.coveredTopic) lines.push(`- Covered: ${t.coveredTopic}`);
    lines.push('');
  });

  return lines.join('\n');
}

function download(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const slug = (r: EvaluationReport): string =>
  `cadence-report-${r.targetRole.toLowerCase().replace(/\s+/g, '-')}`;

export function exportMarkdown(r: EvaluationReport): void {
  download(`${slug(r)}.md`, reportToMarkdown(r), 'text/markdown');
}

export function exportJson(r: EvaluationReport): void {
  download(`${slug(r)}.json`, JSON.stringify(r, null, 2), 'application/json');
}

/** PDF export via the browser's print-to-PDF, using the report's print styles. */
export function exportPdf(): void {
  window.print();
}
