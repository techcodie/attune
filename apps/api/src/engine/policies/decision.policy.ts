import { NextAction, type AnswerEvaluation, type InterviewState } from '@cadence/types';
import type { AnswerAnalysis } from '../../providers/llm/types.js';
import { avgScore } from './difficulty.policy.js';

export interface DecisionOutcome {
  action: NextAction;
  reason: string;
  /** Topic the response should steer toward this turn. */
  focusTopic: string | null;
  /** Value to persist as `activeTopic` after this turn. */
  nextActiveTopic: string | null;
}

/** Probing moves rotated through on a medium answer, in order of preference. */
const PROBE_ROTATION: NextAction[] = [
  NextAction.ASK_EXAMPLE,
  NextAction.ASK_WHY,
  NextAction.ASK_IMPLEMENTATION,
  NextAction.CHALLENGE,
];

const round = (n: number): number => Math.round(n);

/**
 * The Decision Engine. Pure function of InterviewState + the latest analysis —
 * no LLM. It picks exactly one next action and, crucially, *why*. Two invariants
 * make the interview feel human rather than robotic:
 *   1. It never re-asks a covered topic — MOVE_ON always targets a remaining one.
 *   2. It never repeats the same probe on the same topic — probes rotate, then
 *      it moves on.
 */
export function decideNextAction(
  state: InterviewState,
  analysis: AnswerAnalysis,
  coveragePct: number,
  timePctValue: number,
): DecisionOutcome {
  const avg = avgScore(analysis.scores);
  const active = state.activeTopic;

  // The next uncovered topic to steer toward (never the current one).
  const nextTopic = state.remainingTopics.find((t) => t !== active) ?? null;

  const moveOn = (reason: string): DecisionOutcome =>
    nextTopic
      ? { action: NextAction.MOVE_ON, reason, focusTopic: nextTopic, nextActiveTopic: nextTopic }
      : {
          action: NextAction.WRAP_UP,
          reason: 'No topics left to cover — wrapping up.',
          focusTopic: null,
          nextActiveTopic: active,
        };

  // 1. Out of time or fully covered → wrap up.
  if (coveragePct >= 100) return moveOn('All required topics are covered.');
  if (timePctValue >= 92) {
    return {
      action: NextAction.WRAP_UP,
      reason: 'Time budget is nearly spent — winding down.',
      focusTopic: null,
      nextActiveTopic: active,
    };
  }

  // 2. Coming out of the introduction → launch the first real topic.
  if (active === null) {
    return {
      action: NextAction.MOVE_ON,
      reason: `Introduction done — starting the core topics with "${nextTopic ?? 'the role'}".`,
      focusTopic: nextTopic,
      nextActiveTopic: nextTopic,
    };
  }

  // Probes already spent on the current topic (avoid repeating them).
  const usedOnTopic = state.followUpHistory
    .filter((f) => f.topic === active && f.action)
    .map((f) => f.action as NextAction);

  // 3. Answer dodged the question → clarify once.
  if (!analysis.addressedQuestion) {
    return {
      action: NextAction.FOLLOW_UP,
      reason: 'The answer didn’t directly address the question — asking them to clarify.',
      focusTopic: active,
      nextActiveTopic: active,
    };
  }

  // 4. Strong answer, or topic explored enough → move on.
  if (avg >= 78) return moveOn(`Strong answer (${round(avg)}/100); topic covered — moving on.`);
  if (usedOnTopic.length >= 2)
    return moveOn('Explored this topic from a few angles already — moving on.');

  // 5. Weak answer → one gentler probe, else move on.
  if (avg < 45) {
    if (usedOnTopic.length >= 1)
      return moveOn('Candidate is struggling here — easing off and changing topic.');
    return {
      action: NextAction.FOLLOW_UP,
      reason: `Answer was thin (${round(avg)}/100) — probing once more before moving on.`,
      focusTopic: active,
      nextActiveTopic: active,
    };
  }

  // 6. Medium answer → rotate to a fresh probe on the same topic.
  const probe = PROBE_ROTATION.find((a) => !usedOnTopic.includes(a));
  if (!probe) return moveOn('Probed this topic thoroughly — moving on.');

  const reasonByProbe: Record<string, string> = {
    [NextAction.ASK_EXAMPLE]: `Solid but abstract (${round(avg)}/100) — asking for a concrete example.`,
    [NextAction.ASK_WHY]: `Reasonable (${round(avg)}/100) — probing the reasoning behind it.`,
    [NextAction.ASK_IMPLEMENTATION]: `On track (${round(avg)}/100) — pushing into implementation detail.`,
    [NextAction.CHALLENGE]: `Decent (${round(avg)}/100) — challenging an assumption to test depth.`,
  };

  return {
    action: probe,
    reason: reasonByProbe[probe] ?? 'Following up for more depth.',
    focusTopic: active,
    nextActiveTopic: active,
  };
}

/** Adapt an AnswerAnalysis into the shared AnswerEvaluation shape for storage. */
export function toAnswerEvaluation(analysis: AnswerAnalysis): AnswerEvaluation {
  return {
    scores: analysis.scores,
    rationale: analysis.aiNote,
    strengths: analysis.strengths,
    gaps: analysis.gaps,
    addressedQuestion: analysis.addressedQuestion,
    topics: analysis.topicsCovered,
  };
}
