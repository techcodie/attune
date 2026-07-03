import type { InterviewNote, Message } from '@prisma/client';
import type { EngineDecision, ReportTimelineEntry } from '@cadence/types';
import type { AnswerAnalysis } from '../../providers/llm/types.js';

const truncate = (s: string, n = 160): string => (s.length > n ? `${s.slice(0, n)}…` : s);

/**
 * Builds the transparent interview timeline from persisted data — pairing each
 * candidate answer with the question that prompted it and the interviewer's
 * recorded reasoning for what came next. Deterministic; no model call.
 */
export function buildReportTimeline(
  messages: Message[],
  notes: InterviewNote[],
): ReportTimelineEntry[] {
  const entries: ReportTimelineEntry[] = [];
  let answerIndex = 0;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i]!;
    if (msg.speaker !== 'CANDIDATE') continue;

    // The question that prompted this answer is the previous interviewer turn.
    let question = '';
    for (let j = i - 1; j >= 0; j--) {
      if (messages[j]!.speaker === 'INTERVIEWER') {
        question = messages[j]!.content;
        break;
      }
    }

    const note = notes[answerIndex];
    const decision = note?.decision as EngineDecision | null | undefined;
    const evaluation = note?.evaluation as AnswerAnalysis | null | undefined;

    entries.push({
      atMs: msg.atMs,
      question: truncate(question),
      candidateSummary: truncate(msg.content),
      reason: decision?.reason ?? '',
      difficulty: decision?.difficulty ?? null,
      coveredTopic: evaluation?.topicsCovered?.[0] ?? null,
    });
    answerIndex++;
  }

  return entries;
}
