/**
 * The interview domain model.
 *
 * These types are the backbone of the whole product. The AI prompt is built
 * from `InterviewState` — never from raw chat history — so the interviewer can
 * reason about *where the conversation is* rather than just *what was said*.
 *
 * Enums are declared as `const` objects (not TS `enum`) so they exist at runtime
 * on both sides of the wire and tree-shake cleanly in the browser bundle.
 */

// ── Enums ───────────────────────────────────────────────────────────────────

export const InterviewType = {
  BEHAVIORAL: 'BEHAVIORAL',
  SYSTEM_DESIGN: 'SYSTEM_DESIGN',
  CODING: 'CODING',
  PRODUCT_SENSE: 'PRODUCT_SENSE',
  LEADERSHIP: 'LEADERSHIP',
} as const;
export type InterviewType = (typeof InterviewType)[keyof typeof InterviewType];

export const InterviewerPersonality = {
  /** Warm, encouraging, gives the candidate room. */
  FRIENDLY_MENTOR: 'FRIENDLY_MENTOR',
  /** Neutral, precise, by-the-book. */
  NEUTRAL_PROFESSIONAL: 'NEUTRAL_PROFESSIONAL',
  /** Probing, sceptical, pushes on every claim. */
  SKEPTICAL_STAFF_ENGINEER: 'SKEPTICAL_STAFF_ENGINEER',
  /** Fast, high-signal, minimal small talk (FAANG-bar loop). */
  FAANG_BAR_RAISER: 'FAANG_BAR_RAISER',
} as const;
export type InterviewerPersonality =
  (typeof InterviewerPersonality)[keyof typeof InterviewerPersonality];

/** Coarse phase of the interview — drives the graph's high-level routing. */
export const InterviewStage = {
  INTRODUCTION: 'INTRODUCTION',
  WARMUP: 'WARMUP',
  CORE: 'CORE',
  DEEP_DIVE: 'DEEP_DIVE',
  CHALLENGE: 'CHALLENGE',
  WRAP_UP: 'WRAP_UP',
  COMPLETED: 'COMPLETED',
} as const;
export type InterviewStage =
  (typeof InterviewStage)[keyof typeof InterviewStage];

/** 1 = softball, 5 = staff-level pressure. The difficulty controller nudges this. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** Candidate seniority — calibrates baseline difficulty and interviewer tone. */
export const ExperienceLevel = {
  INTERN: 'INTERN',
  JUNIOR: 'JUNIOR',
  MID: 'MID',
  SENIOR: 'SENIOR',
  STAFF: 'STAFF',
  PRINCIPAL: 'PRINCIPAL',
} as const;
export type ExperienceLevel =
  (typeof ExperienceLevel)[keyof typeof ExperienceLevel];

export const InterviewStatus = {
  CREATED: 'CREATED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  ABANDONED: 'ABANDONED',
} as const;
export type InterviewStatus =
  (typeof InterviewStatus)[keyof typeof InterviewStatus];

/** Who is speaking in a transcript turn. */
export const Speaker = {
  INTERVIEWER: 'INTERVIEWER',
  CANDIDATE: 'CANDIDATE',
} as const;
export type Speaker = (typeof Speaker)[keyof typeof Speaker];

// ── Conversation ────────────────────────────────────────────────────────────

export interface TranscriptTurn {
  id: string;
  speaker: Speaker;
  text: string;
  /** ms since interview start — powers the report timeline. */
  atMs: number;
}

// ── Evaluation ──────────────────────────────────────────────────────────────

/**
 * The six axes every candidate answer is scored on. 0–100 each.
 * Produced by the Answer Evaluator node, aggregated into the final report.
 */
export interface ScoreDimensions {
  clarity: number;
  confidence: number;
  completeness: number;
  starStructure: number;
  technicalCorrectness: number;
  communication: number;
}

/** The evaluator's verdict on a single candidate answer. */
export interface AnswerEvaluation {
  scores: ScoreDimensions;
  /** One-line reasoning the report can surface verbatim. */
  rationale: string;
  strengths: string[];
  gaps: string[];
  /** Did the answer actually address what was asked? */
  addressedQuestion: boolean;
  /** Detected topics/skills this answer touched. */
  topics: string[];
}

/**
 * The decision the conversation engine makes *after* evaluating an answer and
 * *before* generating the next interviewer turn. Every action is explainable —
 * `reason` is stored so the report can justify each follow-up.
 */
export const NextAction = {
  MOVE_ON: 'MOVE_ON',
  FOLLOW_UP: 'FOLLOW_UP',
  CHALLENGE: 'CHALLENGE',
  ASK_EXAMPLE: 'ASK_EXAMPLE',
  ASK_WHY: 'ASK_WHY',
  ASK_IMPLEMENTATION: 'ASK_IMPLEMENTATION',
  INCREASE_DIFFICULTY: 'INCREASE_DIFFICULTY',
  DECREASE_DIFFICULTY: 'DECREASE_DIFFICULTY',
  WRAP_UP: 'WRAP_UP',
} as const;
export type NextAction = (typeof NextAction)[keyof typeof NextAction];

export interface EngineDecision {
  action: NextAction;
  reason: string;
  /** Resulting difficulty after this decision (may be unchanged). */
  difficulty: Difficulty;
  targetStage: InterviewStage;
}

// ── Candidate ───────────────────────────────────────────────────────────────

export interface CandidateProfile {
  displayName: string;
  targetRole: string;
  seniority: string;
  yearsExperience: number;
  /** Free-form skills/keywords the candidate wants to be tested on. */
  focusSkills: string[];
}

// ── State building blocks ────────────────────────────────────────────────────

/**
 * A qualitative signal the interviewer picked up (e.g. "took ownership of a
 * failure without prompting"). Grouped by competency on the state. `weight` is
 * a −1..1 polarity/strength so the report can net them out.
 */
export interface SignalObservation {
  note: string;
  atMs: number;
  weight: number;
}

/** A timestamped snapshot of the six score axes, appended as answers land. */
export interface ScoreSnapshot {
  atMs: number;
  scores: ScoreDimensions;
}

/** One follow-up the engine chose to ask, with its justification. */
export interface FollowUpRecord {
  question: string;
  reason: string;
  atMs: number;
  /** Which decision produced it and the topic it targeted (used to avoid
   *  repeating the same probe on the same topic). Optional so older rows load. */
  action?: NextAction;
  topic?: string | null;
}

/**
 * InterviewState — the mutable "brain state" of an interview.
 *
 * Deliberately holds NO immutable configuration (type, personality, difficulty,
 * candidate) — that lives on the `Interview` record. This is only what evolves
 * turn to turn, and it is the object the M3 prompt builder reads from. The
 * transcript is stored separately (M3) so this stays a bounded, structured
 * summary rather than an ever-growing message log.
 */
export interface InterviewState {
  currentStage: InterviewStage;
  currentObjective: string;
  /** Rolling natural-language summary — keeps the prompt bounded as it grows. */
  conversationSummary: string;
  /** The topic the interviewer is steering toward right now (null at the start). */
  activeTopic: string | null;

  // coverage
  coveredTopics: string[];
  remainingTopics: string[];

  // qualitative assessment
  strongAreas: string[];
  weakAreas: string[];

  // running quantitative signals
  confidenceTrend: number[];
  technicalAccuracy: number; // 0–100 running estimate
  communicationScore: number; // 0–100 running estimate

  // competency signals collected over the interview
  behavioralSignals: SignalObservation[];
  leadershipSignals: SignalObservation[];
  curiositySignals: SignalObservation[];
  ownershipSignals: SignalObservation[];

  // history
  followUpHistory: FollowUpRecord[];
  scoreHistory: ScoreSnapshot[];

  // progress
  interviewProgress: number; // 0–100
  elapsedTimeMs: number;
}

// ── Wire DTOs (server → client) ──────────────────────────────────────────────

/** An interview's immutable configuration + lifecycle timestamps. */
export interface InterviewDto {
  id: string;
  interviewType: InterviewType;
  interviewerPersonality: InterviewerPersonality;
  targetRole: string;
  difficulty: Difficulty;
  status: InterviewStatus;
  durationMinutes: number;
  focusSkills: string[];
  preferredLanguage: string;
  voicePreference: string | null;
  startedAt: string | null;
  completedAt: string | null;
  durationSec: number | null;
  createdAt: string;
  updatedAt: string;
}

/** InterviewState serialized for the wire. */
export interface InterviewStateDto extends InterviewState {
  interviewId: string;
  updatedAt: string;
}

// ── Coverage ──────────────────────────────────────────────────────────────────

export interface CoverageTopic {
  /** Stable key, e.g. `system_design.scalability`. */
  key: string;
  label: string;
  covered: boolean;
}

/** The Coverage Engine's report — required vs covered, entirely LLM-free. */
export interface CoverageReport {
  interviewType: InterviewType;
  topics: CoverageTopic[];
  coveredCount: number;
  remainingCount: number;
  totalCount: number;
  /** 0–100. */
  coveragePct: number;
}

// ── Timeline ──────────────────────────────────────────────────────────────────

export const TimelineEventType = {
  INTERVIEW_CREATED: 'INTERVIEW_CREATED',
  INTERVIEW_STARTED: 'INTERVIEW_STARTED',
  STAGE_CHANGED: 'STAGE_CHANGED',
  QUESTION_ASKED: 'QUESTION_ASKED',
  ANSWER_RECEIVED: 'ANSWER_RECEIVED',
  FOLLOW_UP_ASKED: 'FOLLOW_UP_ASKED',
  DIFFICULTY_CHANGED: 'DIFFICULTY_CHANGED',
  EVALUATION_RECORDED: 'EVALUATION_RECORDED',
  INTERVIEW_COMPLETED: 'INTERVIEW_COMPLETED',
  NOTE: 'NOTE',
} as const;
export type TimelineEventType =
  (typeof TimelineEventType)[keyof typeof TimelineEventType];

export interface TimelineEventDto {
  id: string;
  type: TimelineEventType;
  atMs: number;
  label: string;
  data: Record<string, unknown> | null;
  createdAt: string;
}

// ── Composite + dashboard ────────────────────────────────────────────────────

/** Full interview view: config + initialized state + coverage + timeline. */
export interface InterviewDetailDto {
  interview: InterviewDto;
  state: InterviewStateDto;
  coverage: CoverageReport;
  timeline: TimelineEventDto[];
}

// ── Conversation (M3) ────────────────────────────────────────────────────────

export interface MessageDto {
  id: string;
  speaker: Speaker;
  content: string;
  atMs: number;
}

/**
 * Engine transparency payload. Surfaced to the client only when the debug flag
 * is on — it is never required for the interview to function.
 */
export interface EngineDebug {
  provider: string;
  /** Ordered list of LangGraph nodes that executed this turn. */
  nodeTrail: string[];
  action: NextAction | null;
  reason: string;
  focusTopic: string | null;
  currentNode: string;
}

/** Full conversation state used to (re)load the interview room. */
export interface ConversationSnapshot {
  messages: MessageDto[];
  state: InterviewStateDto;
  coverage: CoverageReport;
  finished: boolean;
}

/** The result of one interviewer turn (opening turn or reply to an answer). */
export interface TurnResult {
  message: MessageDto;
  state: InterviewStateDto;
  coverage: CoverageReport;
  decision: EngineDecision | null;
  debug: EngineDebug;
  /** True once the interview has reached COMPLETED. */
  finished: boolean;
}

export interface ScoreTrendPoint {
  interviewId: string;
  label: string;
  score: number;
  date: string;
}

export interface RadarPoint {
  label: string;
  score: number;
}

export interface DurationPoint {
  label: string;
  durationSec: number;
}

export interface DashboardStats {
  totalCount: number;
  completedCount: number;
  /** Mean overall score across evaluated interviews; null if none yet. */
  averageScore: number | null;
  totalPracticeSec: number;
  lastInterview: InterviewDto | null;
  /** A CREATED/IN_PROGRESS interview the candidate can resume, if any. */
  activeInterview: InterviewDto | null;

  // M5 — driven from persisted evaluations
  completionRate: number; // 0–100
  scoreTrend: ScoreTrendPoint[];
  durationHistory: DurationPoint[];
  skillsRadar: RadarPoint[];
  lastRecommendation: import('./evaluation.js').HiringRecommendation | null;
  /** Latest overall score minus the previous one; null if < 2 evaluations. */
  recentImprovement: number | null;
}
