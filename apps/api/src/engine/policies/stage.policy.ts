import { InterviewStage } from '@cadence/types';

/** Canonical order of stages — used to keep progression monotonic. */
const STAGE_ORDER: InterviewStage[] = [
  InterviewStage.INTRODUCTION,
  InterviewStage.WARMUP,
  InterviewStage.CORE,
  InterviewStage.DEEP_DIVE,
  InterviewStage.CHALLENGE,
  InterviewStage.WRAP_UP,
  InterviewStage.COMPLETED,
];

const ordinal = (s: InterviewStage): number => STAGE_ORDER.indexOf(s);

export const timePct = (elapsedMs: number, durationMs: number): number =>
  durationMs <= 0 ? 0 : Math.min(100, Math.round((elapsedMs / durationMs) * 100));

/**
 * Progress blends topic coverage (what matters) with time elapsed (the budget).
 * Coverage-weighted so a fast, thorough candidate still progresses.
 */
export function computeProgress(coveragePct: number, elapsedMs: number, durationMs: number): number {
  return Math.min(100, Math.round(coveragePct * 0.6 + timePct(elapsedMs, durationMs) * 0.4));
}

/**
 * Derive the stage from progress. Never moves backwards. WRAP_UP is forced when
 * time is nearly spent or coverage is complete.
 */
export function nextStage(
  current: InterviewStage,
  progress: number,
  coveragePct: number,
  elapsedMs: number,
  durationMs: number,
): InterviewStage {
  let target: InterviewStage;
  if (coveragePct >= 100 || timePct(elapsedMs, durationMs) >= 95) {
    target = InterviewStage.WRAP_UP;
  } else if (progress >= 70) {
    target = InterviewStage.CHALLENGE;
  } else if (progress >= 45) {
    target = InterviewStage.DEEP_DIVE;
  } else if (progress >= 15) {
    target = InterviewStage.CORE;
  } else {
    target = InterviewStage.WARMUP;
  }
  // Monotonic: keep the later of current vs target.
  return ordinal(target) > ordinal(current) ? target : current;
}
