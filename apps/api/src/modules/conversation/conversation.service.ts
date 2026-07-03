import type { Interview, Profile, Prisma } from '@prisma/client';
import {
  InterviewStage,
  InterviewStatus,
  NextAction,
  Speaker,
  type ConversationSnapshot,
  type Difficulty,
  type EngineDebug,
  type InterviewStateDto,
  type TurnResult,
} from '@cadence/types';
import { AppError } from '../../lib/http.js';
import { logger } from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { computeCoverage } from '../coverage/coverage.engine.js';
import { getLLMProvider, type LLMProvider } from '../../providers/llm/index.js';
import type { InterviewConfigContext } from '../../providers/llm/types.js';
import { buildInterviewGraph, type InterviewGraph } from '../../engine/graph.js';
import type { EngineStateType, TimelineDraft } from '../../engine/engine.state.js';
import { interviewRepository } from '../interview/interview.repository.js';
import { profileRepository } from '../profile/profile.repository.js';
import {
  buildInitialState,
  toStateDto,
  toStateUpdateData,
} from '../interviewState/interviewState.service.js';
import { TimelineEventType } from '@cadence/types';
import { messageRepository, toMessageDto } from './message.repository.js';
import { noteRepository } from './note.repository.js';

// Cache the compiled graph per provider instance (provider is a singleton).
let graphCache: { provider: LLMProvider; graph: InterviewGraph } | null = null;
function graphFor(provider: LLMProvider): InterviewGraph {
  if (!graphCache || graphCache.provider !== provider) {
    graphCache = { provider, graph: buildInterviewGraph(provider) };
  }
  return graphCache.graph;
}

function buildConfig(interview: Interview, profile: Profile | null): InterviewConfigContext {
  return {
    interviewType: interview.interviewType,
    personality: interview.interviewerPersonality,
    targetRole: interview.targetRole,
    seniority: profile?.experienceLevel ?? 'MID',
    difficulty: interview.difficulty as Difficulty,
    focusSkills: interview.focusSkills,
  };
}

function coverageFrom(interviewType: InterviewConfigContext['interviewType'], state: InterviewStateDto) {
  return computeCoverage(interviewType, [...state.coveredTopics, ...state.remainingTopics], state.coveredTopics);
}

/** Load everything the graph needs for a turn, enforcing ownership + lifecycle. */
async function loadContext(userId: string, interviewId: string) {
  const detail = await interviewRepository.findDetailForUser(userId, interviewId);
  if (!detail || !detail.state) throw AppError.notFound('Interview not found');
  const profile = await profileRepository.findByUserId(userId);
  const recent = await messageRepository.listRecent(interviewId);
  return { interview: detail, state: detail.state, profile, recent };
}

interface PersistArgs {
  interviewId: string;
  isOpening: boolean;
  finished: boolean;
  candidateText: string | null;
  nowMs: number;
  difficulty: Difficulty;
  result: EngineStateType;
  startedAt: Date | null;
}

/** Persist the whole turn atomically and return the new assistant message id. */
async function persistTurn(args: PersistArgs): Promise<string> {
  const { interviewId, isOpening, finished, candidateText, nowMs, result } = args;

  const finalState = {
    ...result.state,
    elapsedTimeMs: nowMs,
    ...(finished ? { currentStage: InterviewStage.COMPLETED } : {}),
  };

  return prisma.$transaction(async (tx) => {
    if (!isOpening && candidateText) {
      await tx.message.create({
        data: { interviewId, speaker: Speaker.CANDIDATE, content: candidateText, atMs: nowMs },
      });
    }

    const assistant = await tx.message.create({
      data: {
        interviewId,
        speaker: Speaker.INTERVIEWER,
        content: result.assistantMessage ?? '',
        atMs: nowMs + (isOpening ? 0 : 1),
      },
    });

    await tx.interviewState.update({
      where: { interviewId },
      data: toStateUpdateData(finalState),
    });

    const interviewUpdate: Prisma.InterviewUpdateInput = { difficulty: args.difficulty };
    if (isOpening) {
      interviewUpdate.status = InterviewStatus.IN_PROGRESS;
      interviewUpdate.startedAt = args.startedAt ?? new Date();
    }
    if (finished) {
      interviewUpdate.status = InterviewStatus.COMPLETED;
      interviewUpdate.completedAt = new Date();
      interviewUpdate.durationSec = Math.round(nowMs / 1000);
    }
    await tx.interview.update({ where: { id: interviewId }, data: interviewUpdate });

    for (const e of result.events as TimelineDraft[]) {
      await tx.timelineEvent.create({
        data: {
          interviewId,
          type: e.type,
          atMs: e.atMs,
          label: e.label,
          ...(e.data ? { data: e.data as Prisma.InputJsonValue } : {}),
        },
      });
    }

    if (result.analysis) {
      await noteRepository.create(tx, {
        interviewId,
        atMs: nowMs,
        content: result.aiNote ?? result.analysis.aiNote,
        evaluation: result.analysis as unknown as Prisma.InputJsonValue,
        decision: (result.decision ?? undefined) as unknown as Prisma.InputJsonValue,
      });
    }

    return assistant.id;
  });
}

function buildTurnResult(
  interviewType: InterviewConfigContext['interviewType'],
  messageId: string,
  finalStateDto: InterviewStateDto,
  result: EngineStateType,
  isOpening: boolean,
  finished: boolean,
  providerName: string,
): TurnResult {
  const debug: EngineDebug = {
    provider: providerName,
    nodeTrail: result.nodeTrail,
    action: result.decision?.action ?? null,
    reason: result.decision?.reason ?? (isOpening ? 'Opening the interview.' : ''),
    focusTopic: result.focusTopic ?? null,
    currentNode: result.nodeTrail[result.nodeTrail.length - 1] ?? 'responder',
  };

  return {
    message: {
      id: messageId,
      speaker: Speaker.INTERVIEWER,
      content: result.assistantMessage ?? '',
      atMs: finalStateDto.elapsedTimeMs,
    },
    state: finalStateDto,
    coverage: coverageFrom(interviewType, finalStateDto),
    decision: result.decision ?? null,
    debug,
    finished,
  };
}

export const conversationService = {
  /** Current transcript + state (for loading the room). */
  async getSnapshot(userId: string, interviewId: string): Promise<ConversationSnapshot> {
    const { interview, state } = await loadContext(userId, interviewId);
    const messages = await messageRepository.listAll(interviewId);
    const stateDto = toStateDto(state);
    return {
      messages: messages.map(toMessageDto),
      state: stateDto,
      coverage: coverageFrom(interview.interviewType, stateDto),
      finished: interview.status === InterviewStatus.COMPLETED,
    };
  },

  /** Begin the interview: generate the interviewer's opening turn (idempotent). */
  async start(userId: string, interviewId: string): Promise<TurnResult> {
    const ctx = await loadContext(userId, interviewId);
    const provider = getLLMProvider();

    // Already started → return the latest interviewer message, don't regenerate.
    if (ctx.interview.status !== InterviewStatus.CREATED) {
      const last = [...(await messageRepository.listAll(interviewId))]
        .reverse()
        .find((m) => m.speaker === Speaker.INTERVIEWER);
      const stateDto = toStateDto(ctx.state);
      return {
        message: last
          ? toMessageDto(last)
          : { id: 'none', speaker: Speaker.INTERVIEWER, content: '', atMs: 0 },
        state: stateDto,
        coverage: coverageFrom(ctx.interview.interviewType, stateDto),
        decision: null,
        debug: {
          provider: provider.name,
          nodeTrail: [],
          action: null,
          reason: 'Interview already in progress.',
          focusTopic: null,
          currentNode: 'responder',
        },
        finished: ctx.interview.status === InterviewStatus.COMPLETED,
      };
    }

    const startedAt = new Date();
    const result = (await graphFor(provider).invoke(
      buildInitialGraphState(ctx, null, 0, true),
    )) as EngineStateType;

    const messageId = await persistTurn({
      interviewId,
      isOpening: true,
      finished: false,
      candidateText: null,
      nowMs: 0,
      difficulty: result.difficulty,
      result,
      startedAt,
    });

    logger.info('Interview started', { interviewId, provider: provider.name });
    const stateDto: InterviewStateDto = { ...toStateDto(ctx.state), ...result.state, elapsedTimeMs: 0 };
    return buildTurnResult(ctx.interview.interviewType, messageId, stateDto, result, true, false, provider.name);
  },

  /** Process one candidate answer through the full graph. */
  async turn(userId: string, interviewId: string, candidateText: string): Promise<TurnResult> {
    const ctx = await loadContext(userId, interviewId);
    if (ctx.interview.status === InterviewStatus.COMPLETED) {
      throw AppError.badRequest('This interview has already finished');
    }
    if (ctx.interview.status === InterviewStatus.CREATED || !ctx.interview.startedAt) {
      throw AppError.badRequest('Start the interview before answering');
    }

    const provider = getLLMProvider();
    const nowMs = Math.max(0, Date.now() - ctx.interview.startedAt.getTime());
    const result = (await graphFor(provider).invoke(
      buildInitialGraphState(ctx, candidateText, nowMs, false),
    )) as EngineStateType;

    const finished = result.decision?.action === NextAction.WRAP_UP;

    const messageId = await persistTurn({
      interviewId,
      isOpening: false,
      finished,
      candidateText,
      nowMs,
      difficulty: result.difficulty,
      result,
      startedAt: ctx.interview.startedAt,
    });

    const stateDto: InterviewStateDto = {
      ...toStateDto(ctx.state),
      ...result.state,
      elapsedTimeMs: nowMs,
      ...(finished ? { currentStage: InterviewStage.COMPLETED } : {}),
    };
    return buildTurnResult(ctx.interview.interviewType, messageId, stateDto, result, false, finished, provider.name);
  },

  /** End the interview early — marks it complete so the M6 report can run. */
  async endEarly(userId: string, interviewId: string): Promise<ConversationSnapshot> {
    const { interview } = await loadContext(userId, interviewId);
    if (interview.status !== InterviewStatus.COMPLETED) {
      const durationSec = interview.startedAt
        ? Math.round((Date.now() - interview.startedAt.getTime()) / 1000)
        : 0;
      await prisma.$transaction(async (tx) => {
        await tx.interview.update({
          where: { id: interviewId },
          data: { status: InterviewStatus.COMPLETED, completedAt: new Date(), durationSec },
        });
        await tx.interviewState.update({
          where: { interviewId },
          data: { currentStage: InterviewStage.COMPLETED },
        });
        await tx.timelineEvent.create({
          data: {
            interviewId,
            type: TimelineEventType.INTERVIEW_COMPLETED,
            atMs: durationSec * 1000,
            label: 'Interview ended early',
          },
        });
      });
      logger.info('Interview ended early', { interviewId });
    }
    return this.getSnapshot(userId, interviewId);
  },

  /**
   * Restart the interview: wipe transcript/notes/timeline, reset InterviewState
   * to pristine, and restore the configured baseline difficulty. The interview
   * config is preserved — only its progress is reset.
   */
  async restart(userId: string, interviewId: string): Promise<ConversationSnapshot> {
    const { interview } = await loadContext(userId, interviewId);
    const fresh = buildInitialState(interview.interviewType, interview.focusSkills);

    await prisma.$transaction(async (tx) => {
      await tx.message.deleteMany({ where: { interviewId } });
      await tx.interviewNote.deleteMany({ where: { interviewId } });
      await tx.timelineEvent.deleteMany({ where: { interviewId } });
      await tx.interviewState.update({
        where: { interviewId },
        data: toStateUpdateData(fresh),
      });
      await tx.interview.update({
        where: { id: interviewId },
        data: {
          status: InterviewStatus.CREATED,
          startedAt: null,
          completedAt: null,
          durationSec: null,
          difficulty: interview.baseDifficulty,
        },
      });
      await tx.timelineEvent.create({
        data: {
          interviewId,
          type: TimelineEventType.INTERVIEW_CREATED,
          atMs: 0,
          label: 'Interview restarted',
        },
      });
    });

    logger.info('Interview restarted', { interviewId });
    return this.getSnapshot(userId, interviewId);
  },
};

/** Build the graph's initial state from loaded context. */
function buildInitialGraphState(
  ctx: Awaited<ReturnType<typeof loadContext>>,
  candidateText: string | null,
  nowMs: number,
  isOpening: boolean,
): EngineStateType {
  const config = buildConfig(ctx.interview, ctx.profile);
  const stateDto = toStateDto(ctx.state);
  const recentTurns = ctx.recent.map((m) => ({ speaker: m.speaker, text: m.content }));
  const durationMs = ctx.interview.durationMinutes * 60_000;

  return {
    config,
    candidateText,
    nowMs,
    durationMs,
    isOpening,
    state: stateDto,
    difficulty: config.difficulty,
    messages: recentTurns,
    analysis: null,
    coverage: null,
    decision: null,
    focusTopic: null,
    aiNote: null,
    responseInput: null,
    assistantMessage: null,
    nodeTrail: [],
    events: [],
  };
}
