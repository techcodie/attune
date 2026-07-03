import { TimelineEventType } from '@cadence/types';
import { computeCoverage } from '../../modules/coverage/coverage.engine.js';
import { computeProgress, nextStage } from '../policies/stage.policy.js';
import type { EngineStateType } from '../engine.state.js';

const norm = (s: string): string => s.trim().toLowerCase();

/** Move any newly-covered topics from `remaining` into `covered` (fuzzy match). */
function applyCoverage(
  remaining: string[],
  covered: string[],
  justCovered: string[],
): { remaining: string[]; covered: string[] } {
  const nextCovered = [...covered];
  const nextRemaining = [...remaining];

  for (const label of justCovered) {
    const n = norm(label);
    const idx = nextRemaining.findIndex((r) => {
      const rn = norm(r);
      return rn === n || rn.includes(n) || n.includes(rn);
    });
    if (idx !== -1) {
      const [moved] = nextRemaining.splice(idx, 1);
      if (moved && !nextCovered.some((c) => norm(c) === norm(moved))) nextCovered.push(moved);
    }
  }
  return { remaining: nextRemaining, covered: nextCovered };
}

/**
 * Coverage Engine node — updates which required topics are covered from the
 * evaluator's `topicsCovered`, recomputes the coverage report, and derives
 * progress and the interview stage from it. Deterministic; no LLM.
 */
export async function coverageEngine(state: EngineStateType): Promise<Partial<EngineStateType>> {
  const justCovered = state.analysis?.topicsCovered ?? [];
  const { remaining, covered } = applyCoverage(
    state.state.remainingTopics,
    state.state.coveredTopics,
    justCovered,
  );

  const report = computeCoverage(state.config.interviewType, [...covered, ...remaining], covered);
  const progress = computeProgress(report.coveragePct, state.nowMs, state.durationMs);
  const stage = nextStage(
    state.state.currentStage,
    progress,
    report.coveragePct,
    state.nowMs,
    state.durationMs,
  );

  const stageChanged = stage !== state.state.currentStage;

  return {
    coverage: report,
    state: {
      ...state.state,
      coveredTopics: covered,
      remainingTopics: remaining,
      interviewProgress: progress,
      currentStage: stage,
    },
    events: stageChanged
      ? [
          {
            type: TimelineEventType.STAGE_CHANGED,
            label: `Stage → ${stage}`,
            atMs: state.nowMs,
            data: { from: state.state.currentStage, to: stage },
          },
        ]
      : [],
    nodeTrail: ['coverageEngine'],
  };
}
