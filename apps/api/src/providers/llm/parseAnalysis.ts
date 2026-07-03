import { z } from 'zod';
import type { AnswerAnalysis } from './types.js';

const score = z.coerce.number().min(0).max(100).catch(50);

const analysisSchema = z.object({
  scores: z.object({
    clarity: score,
    confidence: score,
    completeness: score,
    starStructure: score,
    technicalCorrectness: score,
    communication: score,
  }),
  addressedQuestion: z.coerce.boolean().catch(true),
  topicsCovered: z.array(z.string()).catch([]),
  strengths: z.array(z.string()).catch([]),
  gaps: z.array(z.string()).catch([]),
  confidence: score,
  signals: z
    .object({
      behavioral: z.string().catch(''),
      leadership: z.string().catch(''),
      ownership: z.string().catch(''),
      curiosity: z.string().catch(''),
    })
    .catch({ behavioral: '', leadership: '', ownership: '', curiosity: '' }),
  aiNote: z.string().catch(''),
});

/** Neutral analysis used when a model returns something unparseable. */
export function neutralAnalysis(note: string): AnswerAnalysis {
  return {
    scores: {
      clarity: 50,
      confidence: 50,
      completeness: 50,
      starStructure: 50,
      technicalCorrectness: 50,
      communication: 50,
    },
    addressedQuestion: true,
    topicsCovered: [],
    strengths: [],
    gaps: [],
    confidence: 50,
    signals: { behavioral: '', leadership: '', ownership: '', curiosity: '' },
    aiNote: note,
  };
}

/**
 * Parse a model's raw JSON string into a validated AnswerAnalysis. Tolerant of
 * code fences and stray prose; falls back to a neutral analysis so a bad model
 * response can never crash a live interview.
 */
export function parseAnalysis(raw: string): AnswerAnalysis {
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return neutralAnalysis('Could not parse evaluation.');

  try {
    const parsed = analysisSchema.parse(JSON.parse(cleaned.slice(start, end + 1)));
    return parsed;
  } catch {
    return neutralAnalysis('Evaluation failed validation; used neutral scores.');
  }
}
