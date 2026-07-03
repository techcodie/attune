import type { Prisma, InterviewState as InterviewStateRow } from '@prisma/client';
import {
  InterviewStage,
  InterviewType,
  type FollowUpRecord,
  type InterviewState,
  type InterviewStateDto,
  type ScoreSnapshot,
  type SignalObservation,
} from '@cadence/types';
import { requiredTopicsFor } from '../coverage/coverage.engine.js';

/** A human-readable opening objective, tuned to the interview type. */
function initialObjective(type: InterviewType): string {
  const byType: Record<InterviewType, string> = {
    [InterviewType.BEHAVIORAL]: 'Build rapport and understand the candidate’s background',
    [InterviewType.SYSTEM_DESIGN]: 'Introduce the design prompt and align on scope',
    [InterviewType.CODING]: 'Set up the coding problem and confirm understanding',
    [InterviewType.PRODUCT_SENSE]: 'Frame the product scenario and align on the user',
    [InterviewType.LEADERSHIP]: 'Understand the candidate’s leadership context',
  };
  return byType[type];
}

/**
 * Build the initial InterviewState for a brand-new interview. This is the
 * state-initialization logic M2 centers on: it seeds `remainingTopics` from the
 * Coverage Engine and starts every running signal at a neutral baseline. The
 * returned object is a Prisma nested-create payload so the interview and its
 * state are created atomically in one call.
 */
/** The pristine runtime InterviewState for a fresh (or restarted) interview. */
export function buildInitialState(
  interviewType: InterviewType,
  focusSkills: string[],
): InterviewState {
  return {
    currentStage: InterviewStage.INTRODUCTION,
    currentObjective: initialObjective(interviewType),
    conversationSummary: '',
    activeTopic: null,
    coveredTopics: [],
    remainingTopics: requiredTopicsFor(interviewType, focusSkills).map((t) => t.label),
    strongAreas: [],
    weakAreas: [],
    confidenceTrend: [],
    technicalAccuracy: 0,
    communicationScore: 0,
    behavioralSignals: [],
    leadershipSignals: [],
    curiositySignals: [],
    ownershipSignals: [],
    followUpHistory: [],
    scoreHistory: [],
    interviewProgress: 0,
    elapsedTimeMs: 0,
  };
}

export function buildInitialStateData(
  interviewType: InterviewType,
  focusSkills: string[],
): Prisma.InterviewStateCreateWithoutInterviewInput {
  const { currentStage, currentObjective, remainingTopics } = buildInitialState(
    interviewType,
    focusSkills,
  );
  return {
    currentStage,
    currentObjective,
    conversationSummary: '',
    activeTopic: null,
    coveredTopics: [],
    remainingTopics,
    strongAreas: [],
    weakAreas: [],
    confidenceTrend: [],
    technicalAccuracy: 0,
    communicationScore: 0,
    behavioralSignals: [],
    leadershipSignals: [],
    curiositySignals: [],
    ownershipSignals: [],
    followUpHistory: [],
    scoreHistory: [],
    interviewProgress: 0,
    elapsedTimeMs: 0,
  };
}

const asJson = (v: unknown): Prisma.InputJsonValue => v as Prisma.InputJsonValue;

/**
 * Map a runtime InterviewState (post-graph) to a Prisma update payload. The
 * Json columns take the collections verbatim; the scalar columns update the hot
 * fields. This is how the engine's turn result is persisted.
 */
export function toStateUpdateData(state: InterviewState): Prisma.InterviewStateUpdateInput {
  return {
    currentStage: state.currentStage,
    currentObjective: state.currentObjective,
    conversationSummary: state.conversationSummary,
    activeTopic: state.activeTopic,
    coveredTopics: state.coveredTopics,
    remainingTopics: state.remainingTopics,
    strongAreas: state.strongAreas,
    weakAreas: state.weakAreas,
    confidenceTrend: state.confidenceTrend,
    technicalAccuracy: state.technicalAccuracy,
    communicationScore: state.communicationScore,
    behavioralSignals: asJson(state.behavioralSignals),
    leadershipSignals: asJson(state.leadershipSignals),
    curiositySignals: asJson(state.curiositySignals),
    ownershipSignals: asJson(state.ownershipSignals),
    followUpHistory: asJson(state.followUpHistory),
    scoreHistory: asJson(state.scoreHistory),
    interviewProgress: state.interviewProgress,
    elapsedTimeMs: state.elapsedTimeMs,
  };
}

/** Map a persisted state row to the wire DTO, typing the Json columns. */
export function toStateDto(row: InterviewStateRow): InterviewStateDto {
  return {
    interviewId: row.interviewId,
    currentStage: row.currentStage,
    currentObjective: row.currentObjective,
    conversationSummary: row.conversationSummary,
    activeTopic: row.activeTopic,
    coveredTopics: row.coveredTopics,
    remainingTopics: row.remainingTopics,
    strongAreas: row.strongAreas,
    weakAreas: row.weakAreas,
    confidenceTrend: row.confidenceTrend,
    technicalAccuracy: row.technicalAccuracy,
    communicationScore: row.communicationScore,
    behavioralSignals: row.behavioralSignals as unknown as SignalObservation[],
    leadershipSignals: row.leadershipSignals as unknown as SignalObservation[],
    curiositySignals: row.curiositySignals as unknown as SignalObservation[],
    ownershipSignals: row.ownershipSignals as unknown as SignalObservation[],
    followUpHistory: row.followUpHistory as unknown as FollowUpRecord[],
    scoreHistory: row.scoreHistory as unknown as ScoreSnapshot[],
    interviewProgress: row.interviewProgress,
    elapsedTimeMs: row.elapsedTimeMs,
    updatedAt: row.updatedAt.toISOString(),
  };
}
