import type {
  CategoryScore,
  Difficulty,
  EvaluationHighlights,
  HiringVerdict,
  InterviewStage,
  InterviewType,
  InterviewerPersonality,
  NextAction,
  ScoreDimensions,
  Speaker,
} from '@cadence/types';

/**
 * The LLM provider contract. Nothing outside `providers/` knows which model is
 * behind it — the interview engine depends only on this interface, so swapping
 * Groq for Gemini/OpenAI (or a mock in tests) is a one-line env change.
 */

/** Immutable interview configuration passed to every provider call. */
export interface InterviewConfigContext {
  interviewType: InterviewType;
  personality: InterviewerPersonality;
  targetRole: string;
  seniority: string;
  difficulty: Difficulty;
  focusSkills: string[];
}

export interface ConversationTurn {
  speaker: Speaker;
  text: string;
}

// ── evaluateAnswer ───────────────────────────────────────────────────────────

export interface EvaluateAnswerInput {
  config: InterviewConfigContext;
  question: string;
  answer: string;
  activeTopic: string | null;
  remainingTopics: string[];
  coveredTopics: string[];
}

/**
 * The evaluator's structured verdict on one answer, plus the *hidden* reasoning
 * note stored for the final report (never shown mid-interview).
 */
export interface AnswerAnalysis {
  scores: ScoreDimensions;
  addressedQuestion: boolean;
  /** Topic labels this answer meaningfully covered. */
  topicsCovered: string[];
  strengths: string[];
  gaps: string[];
  /** Observed candidate confidence, 0–100. */
  confidence: number;
  /** Short qualitative signals per competency (empty string if none seen). */
  signals: {
    behavioral: string;
    leadership: string;
    ownership: string;
    curiosity: string;
  };
  /** Hidden interviewer reasoning — for the report only. */
  aiNote: string;
}

// ── summarizeConversation ────────────────────────────────────────────────────

export interface SummarizeInput {
  previousSummary: string;
  recentTurns: ConversationTurn[];
}

// ── generateInterviewResponse ────────────────────────────────────────────────

export interface GenerateResponseInput {
  config: InterviewConfigContext;
  stage: InterviewStage;
  objective: string;
  /** The decision the engine already made — the model only phrases it. */
  action: NextAction | null;
  actionReason: string;
  focusTopic: string | null;
  summary: string;
  coveredTopics: string[];
  remainingTopics: string[];
  lastAnswer: string | null;
  recentTurns: ConversationTurn[];
  isOpening: boolean;
}

// ── evaluateInterview (post-interview report) ────────────────────────────────

export interface EvaluateInterviewInput {
  config: InterviewConfigContext;
  transcript: ConversationTurn[];
  summary: string;
  /** The interviewer's hidden reasoning notes gathered during the interview. */
  aiNotes: string[];
  coveredTopics: string[];
  remainingTopics: string[];
  /** Averaged answer scores across the interview — the quantitative anchor. */
  scoreAverages: ScoreDimensions;
  confidenceAvg: number;
  signals: {
    behavioral: string[];
    leadership: string[];
    ownership: string[];
    curiosity: string[];
  };
  durationSec: number;
}

/** The AI's qualitative assessment. Overall score is computed by the service. */
export interface InterviewAssessment {
  categories: CategoryScore[];
  hiring: HiringVerdict;
  highlights: EvaluationHighlights;
  summary: string;
}

export interface LLMProvider {
  readonly name: string;
  evaluateAnswer(input: EvaluateAnswerInput): Promise<AnswerAnalysis>;
  summarizeConversation(input: SummarizeInput): Promise<string>;
  generateInterviewResponse(input: GenerateResponseInput): Promise<string>;
  evaluateInterview(input: EvaluateInterviewInput): Promise<InterviewAssessment>;
}
