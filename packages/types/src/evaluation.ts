/**
 * The post-interview evaluation domain — the "hiring panel write-up".
 *
 * Produced by a dedicated pipeline (independent of the LangGraph engine) from
 * InterviewState, the interviewer's hidden AI notes, and the transcript. Stored
 * once per interview and never regenerated on read.
 */
import type { InterviewType } from './interview.js';

// ── Categories ────────────────────────────────────────────────────────────────

export const EVALUATION_CATEGORIES = [
  { key: 'technical_knowledge', label: 'Technical Knowledge' },
  { key: 'problem_solving', label: 'Problem Solving' },
  { key: 'communication', label: 'Communication' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'behavioral_skills', label: 'Behavioral Skills' },
  { key: 'leadership', label: 'Leadership' },
  { key: 'ownership', label: 'Ownership' },
  { key: 'adaptability', label: 'Adaptability' },
  { key: 'critical_thinking', label: 'Critical Thinking' },
  { key: 'system_design', label: 'System Design' },
  { key: 'learning_mindset', label: 'Learning Mindset' },
] as const;

export type EvaluationCategoryKey = (typeof EVALUATION_CATEGORIES)[number]['key'];

export interface CategoryScore {
  key: EvaluationCategoryKey;
  label: string;
  /** 0–100. */
  score: number;
  /** Grounded in a specific observation from the interview. */
  justification: string;
  /** e.g. System Design is only applicable to a system-design interview. */
  applicable: boolean;
}

// ── Hiring recommendation ────────────────────────────────────────────────────

export const HiringRecommendation = {
  STRONG_HIRE: 'STRONG_HIRE',
  HIRE: 'HIRE',
  LEAN_HIRE: 'LEAN_HIRE',
  LEAN_NO_HIRE: 'LEAN_NO_HIRE',
  NO_HIRE: 'NO_HIRE',
} as const;
export type HiringRecommendation =
  (typeof HiringRecommendation)[keyof typeof HiringRecommendation];

export interface HiringVerdict {
  recommendation: HiringRecommendation;
  /** 0–100 — how confident the interviewer is in this call. */
  confidence: number;
  reasoning: string;
  supportingEvidence: string[];
  concerns: string[];
  suggestedNextRound: string;
}

// ── Highlights ────────────────────────────────────────────────────────────────

export interface EvaluationHighlights {
  strengths: string[]; // up to 5
  improvementAreas: string[]; // up to 5
  bestAnswer: string;
  weakestAnswer: string;
  mostImpressiveMoment: string;
  missedOpportunity: string;
}

// ── Learning roadmap ─────────────────────────────────────────────────────────

export interface LearningStep {
  title: string;
  detail: string;
}

export interface LearningPlanItem {
  weakness: string;
  steps: LearningStep[];
}

// ── Report timeline ──────────────────────────────────────────────────────────

export interface ReportTimelineEntry {
  atMs: number;
  /** The interviewer's question at this point. */
  question: string;
  /** A short summary of the candidate's answer. */
  candidateSummary: string;
  /** Why the engine chose the next move — from the interviewer's notes. */
  reason: string;
  difficulty: number | null;
  coveredTopic: string | null;
}

// ── The full report ──────────────────────────────────────────────────────────

export interface EvaluationReport {
  interviewId: string;
  interviewType: InterviewType;
  targetRole: string;
  /** 0–100, weighted over applicable categories. */
  overallScore: number;
  categories: CategoryScore[];
  hiring: HiringVerdict;
  highlights: EvaluationHighlights;
  learningPlan: LearningPlanItem[];
  timeline: ReportTimelineEntry[];
  /** Interviewer-voice narrative. */
  summary: string;
  durationSec: number;
  generatedAt: string;
}
