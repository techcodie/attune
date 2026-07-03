import type { Difficulty, ScoreDimensions } from '@cadence/types';

/** Mean of the six score axes, 0–100. */
export function avgScore(scores: ScoreDimensions): number {
  const vals = Object.values(scores);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const clampDifficulty = (n: number): Difficulty =>
  Math.max(1, Math.min(5, n)) as Difficulty;

export interface DifficultyAdjustment {
  difficulty: Difficulty;
  changed: boolean;
  direction: 'up' | 'down' | 'hold';
}

/**
 * Nudge difficulty from the latest answer. Strong answers earn a harder next
 * question; weak or unaddressed answers ease off. Deterministic and bounded so
 * the ramp is smooth and explainable.
 */
export function adjustDifficulty(
  current: Difficulty,
  avg: number,
  addressed: boolean,
): DifficultyAdjustment {
  let next = current;
  if (!addressed || avg < 45) next = clampDifficulty(current - 1);
  else if (avg >= 78) next = clampDifficulty(current + 1);

  const direction = next > current ? 'up' : next < current ? 'down' : 'hold';
  return { difficulty: next, changed: next !== current, direction };
}
