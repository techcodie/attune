import { TimelineEventType } from '@cadence/types';
import { adjustDifficulty, avgScore } from '../policies/difficulty.policy.js';
import type { EngineStateType } from '../engine.state.js';

/**
 * Difficulty Engine node — nudges difficulty from the latest answer via the
 * pure difficulty policy, and records a timeline event when it changes.
 */
export async function difficultyEngine(state: EngineStateType): Promise<Partial<EngineStateType>> {
  if (!state.analysis) return { nodeTrail: ['difficultyEngine'] };

  const adj = adjustDifficulty(
    state.difficulty,
    avgScore(state.analysis.scores),
    state.analysis.addressedQuestion,
  );

  return {
    difficulty: adj.difficulty,
    events: adj.changed
      ? [
          {
            type: TimelineEventType.DIFFICULTY_CHANGED,
            label: `Difficulty ${adj.direction === 'up' ? '↑' : '↓'} ${adj.difficulty}`,
            atMs: state.nowMs,
            data: { to: adj.difficulty, direction: adj.direction },
          },
        ]
      : [],
    nodeTrail: ['difficultyEngine'],
  };
}
