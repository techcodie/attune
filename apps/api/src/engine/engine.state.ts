import { Annotation } from '@langchain/langgraph';
import type {
  CoverageReport,
  Difficulty,
  EngineDecision,
  InterviewState,
  Speaker,
  TimelineEventType,
} from '@cadence/types';
import type {
  AnswerAnalysis,
  ConversationTurn,
  GenerateResponseInput,
  InterviewConfigContext,
} from '../providers/llm/types.js';

/** A timeline event a node wants persisted after the graph completes. */
export interface TimelineDraft {
  type: TimelineEventType;
  label: string;
  atMs: number;
  data?: Record<string, unknown>;
}

const appendReducer = <T>() => ({
  reducer: (a: T[], b: T[]) => a.concat(b),
  default: (): T[] => [],
});

/**
 * The LangGraph state channels. Inputs are constant for a turn; the rest evolve
 * as nodes run. `nodeTrail` and `events` accumulate; everything else is replaced
 * by whichever node writes it. Nodes stay pure — they read channels and return
 * partial updates, never touching the DB.
 */
export const EngineState = Annotation.Root({
  // ── inputs (constant for the turn) ──
  config: Annotation<InterviewConfigContext>,
  candidateText: Annotation<string | null>,
  nowMs: Annotation<number>,
  durationMs: Annotation<number>,
  isOpening: Annotation<boolean>,

  // ── evolving ──
  state: Annotation<InterviewState>,
  difficulty: Annotation<Difficulty>,
  messages: Annotation<ConversationTurn[]>,
  analysis: Annotation<AnswerAnalysis | null>,
  coverage: Annotation<CoverageReport | null>,
  decision: Annotation<EngineDecision | null>,
  focusTopic: Annotation<string | null>,
  aiNote: Annotation<string | null>,
  responseInput: Annotation<GenerateResponseInput | null>,
  assistantMessage: Annotation<string | null>,

  // ── accumulators ──
  nodeTrail: Annotation<string[]>(appendReducer<string>()),
  events: Annotation<TimelineDraft[]>(appendReducer<TimelineDraft>()),
});

export type EngineStateType = typeof EngineState.State;

/** The last thing the interviewer said — i.e. the question being answered. */
export function lastInterviewerText(messages: ConversationTurn[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]!.speaker === ('INTERVIEWER' as Speaker)) return messages[i]!.text;
  }
  return '';
}

/** Add an item to an array with de-duplication and a cap. */
export function mergeCapped(existing: string[], incoming: string[], cap = 12): string[] {
  const out = [...existing];
  for (const item of incoming) {
    if (item && !out.some((e) => e.toLowerCase() === item.toLowerCase())) out.push(item);
  }
  return out.slice(-cap);
}
