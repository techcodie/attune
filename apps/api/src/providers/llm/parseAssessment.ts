import { z } from 'zod';
import {
  EVALUATION_CATEGORIES,
  HiringRecommendation,
  type CategoryScore,
  type InterviewType,
} from '@cadence/types';
import type { InterviewAssessment } from './types.js';

const score = z.coerce.number().min(0).max(100).catch(50);
const strArr = z.array(z.string()).catch([]);

const rawSchema = z.object({
  categories: z
    .array(z.object({ key: z.string(), score, justification: z.string().catch('') }))
    .catch([]),
  hiring: z
    .object({
      recommendation: z.string().catch(HiringRecommendation.LEAN_HIRE),
      confidence: score,
      reasoning: z.string().catch(''),
      supportingEvidence: strArr,
      concerns: strArr,
      suggestedNextRound: z.string().catch(''),
    })
    .catch({
      recommendation: HiringRecommendation.LEAN_HIRE,
      confidence: 50,
      reasoning: '',
      supportingEvidence: [],
      concerns: [],
      suggestedNextRound: '',
    }),
  highlights: z
    .object({
      strengths: strArr,
      improvementAreas: strArr,
      bestAnswer: z.string().catch(''),
      weakestAnswer: z.string().catch(''),
      mostImpressiveMoment: z.string().catch(''),
      missedOpportunity: z.string().catch(''),
    })
    .catch({
      strengths: [],
      improvementAreas: [],
      bestAnswer: '',
      weakestAnswer: '',
      mostImpressiveMoment: '',
      missedOpportunity: '',
    }),
  summary: z.string().catch(''),
});

const VALID_RECS = new Set<string>(Object.values(HiringRecommendation));

/** System Design is only assessed in a system-design interview. */
export function isCategoryApplicable(key: string, interviewType: InterviewType): boolean {
  if (key === 'system_design') return interviewType === 'SYSTEM_DESIGN';
  return true;
}

/**
 * Turn a model's raw JSON into a complete, well-formed InterviewAssessment.
 * Every one of the fixed categories is guaranteed present (label + applicability
 * filled in), the recommendation is normalized to the enum, and any parse
 * failure degrades gracefully to neutral values.
 */
export function parseAssessment(raw: string, interviewType: InterviewType): InterviewAssessment {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  const parsed = rawSchema.parse(
    start !== -1 && end !== -1 ? safeJson(cleaned.slice(start, end + 1)) : {},
  );

  const byKey = new Map(parsed.categories.map((c) => [c.key, c]));

  const categories: CategoryScore[] = EVALUATION_CATEGORIES.map((cat) => {
    const applicable = isCategoryApplicable(cat.key, interviewType);
    const found = byKey.get(cat.key);
    return {
      key: cat.key,
      label: cat.label,
      score: applicable ? Math.round(found?.score ?? 50) : 0,
      justification: applicable
        ? found?.justification || 'No specific observation recorded.'
        : 'Not assessed in this interview format.',
      applicable,
    };
  });

  const recommendation = VALID_RECS.has(parsed.hiring.recommendation)
    ? (parsed.hiring.recommendation as HiringRecommendation)
    : HiringRecommendation.LEAN_HIRE;

  return {
    categories,
    hiring: { ...parsed.hiring, recommendation, confidence: Math.round(parsed.hiring.confidence) },
    highlights: {
      strengths: parsed.highlights.strengths.slice(0, 5),
      improvementAreas: parsed.highlights.improvementAreas.slice(0, 5),
      bestAnswer: parsed.highlights.bestAnswer,
      weakestAnswer: parsed.highlights.weakestAnswer,
      mostImpressiveMoment: parsed.highlights.mostImpressiveMoment,
      missedOpportunity: parsed.highlights.missedOpportunity,
    },
    summary: parsed.summary,
  };
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
