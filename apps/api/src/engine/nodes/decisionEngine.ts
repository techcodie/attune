import type { EngineDecision } from '@cadence/types';
import { decideNextAction } from '../policies/decision.policy.js';
import { timePct } from '../policies/stage.policy.js';
import type { EngineStateType } from '../engine.state.js';

/**
 * Decision Engine node — chooses the single next action from InterviewState and
 * the latest analysis (pure policy, no LLM), and advances the active topic. The
 * decision + reason are stored so the report and debug panel can explain every
 * question.
 */
export async function decisionEngine(state: EngineStateType): Promise<Partial<EngineStateType>> {
  if (!state.analysis || !state.coverage) return { nodeTrail: ['decisionEngine'] };

  const outcome = decideNextAction(
    state.state,
    state.analysis,
    state.coverage.coveragePct,
    timePct(state.nowMs, state.durationMs),
  );

  const decision: EngineDecision = {
    action: outcome.action,
    reason: outcome.reason,
    difficulty: state.difficulty,
    targetStage: state.state.currentStage,
  };

  return {
    decision,
    focusTopic: outcome.focusTopic,
    state: { ...state.state, activeTopic: outcome.nextActiveTopic },
    nodeTrail: ['decisionEngine'],
  };
}
