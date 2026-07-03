import type { InterviewStateDto, ScoreDimensions } from '@cadence/types';
import { getLLMProvider } from '../../providers/llm/index.js';
import type {
  ConversationTurn,
  InterviewAssessment,
  InterviewConfigContext,
} from '../../providers/llm/types.js';

export interface AssessInput {
  config: InterviewConfigContext;
  state: InterviewStateDto;
  transcript: ConversationTurn[];
  aiNotes: string[];
  durationSec: number;
}

const NEUTRAL: ScoreDimensions = {
  clarity: 50,
  confidence: 50,
  completeness: 50,
  starStructure: 50,
  technicalCorrectness: 50,
  communication: 50,
};

/** Average each score axis across the interview's history. */
function averageScores(history: InterviewStateDto['scoreHistory']): ScoreDimensions {
  if (history.length === 0) return NEUTRAL;
  const sum = { ...NEUTRAL, clarity: 0, confidence: 0, completeness: 0, starStructure: 0, technicalCorrectness: 0, communication: 0 };
  for (const snap of history) {
    (Object.keys(sum) as (keyof ScoreDimensions)[]).forEach((k) => (sum[k] += snap.scores[k]));
  }
  const n = history.length;
  return {
    clarity: sum.clarity / n,
    confidence: sum.confidence / n,
    completeness: sum.completeness / n,
    starStructure: sum.starStructure / n,
    technicalCorrectness: sum.technicalCorrectness / n,
    communication: sum.communication / n,
  };
}

const mean = (nums: number[]): number => (nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 50);
const notes = (signals: InterviewStateDto['behavioralSignals']): string[] =>
  signals.map((s) => s.note).filter(Boolean);

/**
 * EvaluationService — produces the AI's qualitative assessment for a finished
 * interview. It assembles the *evidence* (averaged scores, signals, notes,
 * coverage) and delegates the judgement to the provider; the overall score is
 * then computed deterministically from the applicable category scores so it can
 * never be a random number.
 */
export const evaluationService = {
  async assess(input: AssessInput): Promise<{ assessment: InterviewAssessment; overallScore: number }> {
    const { state } = input;
    const provider = getLLMProvider();

    const assessment = await provider.evaluateInterview({
      config: input.config,
      transcript: input.transcript,
      summary: state.conversationSummary,
      aiNotes: input.aiNotes,
      coveredTopics: state.coveredTopics,
      remainingTopics: state.remainingTopics,
      scoreAverages: averageScores(state.scoreHistory),
      confidenceAvg: mean(state.confidenceTrend),
      signals: {
        behavioral: notes(state.behavioralSignals),
        leadership: notes(state.leadershipSignals),
        ownership: notes(state.ownershipSignals),
        curiosity: notes(state.curiositySignals),
      },
      durationSec: input.durationSec,
    });

    const applicable = assessment.categories.filter((c) => c.applicable);
    const overallScore = applicable.length
      ? Math.round(applicable.reduce((a, c) => a + c.score, 0) / applicable.length)
      : 0;

    return { assessment, overallScore };
  },
};
