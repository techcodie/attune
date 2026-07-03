import { NextAction, Speaker, TimelineEventType, type FollowUpRecord } from '@cadence/types';
import type { LLMProvider } from '../../providers/llm/types.js';
import type { EngineStateType } from '../engine.state.js';

/** Probing actions get logged as follow-ups; MOVE_ON/WRAP_UP are new questions. */
const PROBES = new Set<NextAction>([
  NextAction.FOLLOW_UP,
  NextAction.CHALLENGE,
  NextAction.ASK_EXAMPLE,
  NextAction.ASK_WHY,
  NextAction.ASK_IMPLEMENTATION,
  NextAction.INCREASE_DIFFICULTY,
  NextAction.DECREASE_DIFFICULTY,
]);

/**
 * Responder — the only node that produces the interviewer's utterance, via the
 * provider. It appends the turn to the transcript and, on a probe, records the
 * follow-up (with its action + topic) so future turns never repeat the same
 * probe on the same topic.
 */
export function makeResponder(provider: LLMProvider) {
  return async function responder(state: EngineStateType): Promise<Partial<EngineStateType>> {
    const message = await provider.generateInterviewResponse(
      state.responseInput ?? {
        config: { ...state.config, difficulty: state.difficulty },
        stage: state.state.currentStage,
        objective: state.state.currentObjective,
        action: null,
        actionReason: '',
        focusTopic: null,
        summary: state.state.conversationSummary,
        coveredTopics: state.state.coveredTopics,
        remainingTopics: state.state.remainingTopics,
        lastAnswer: state.candidateText,
        recentTurns: state.messages,
        isOpening: state.isOpening,
      },
    );

    let nextState = state.state;
    const isProbe = !state.isOpening && !!state.decision && PROBES.has(state.decision.action);
    if (!state.isOpening && state.decision) {
      const record: FollowUpRecord = {
        question: message,
        reason: state.decision.reason,
        atMs: state.nowMs,
        action: state.decision.action,
        topic: state.focusTopic,
      };
      nextState = { ...nextState, followUpHistory: [...nextState.followUpHistory, record].slice(-50) };
    }

    return {
      assistantMessage: message,
      messages: [...state.messages, { speaker: Speaker.INTERVIEWER, text: message }],
      state: nextState,
      events: [
        {
          type: isProbe ? TimelineEventType.FOLLOW_UP_ASKED : TimelineEventType.QUESTION_ASKED,
          label: state.isOpening ? 'Interview opened' : 'Question asked',
          atMs: state.nowMs,
          data: { action: state.decision?.action ?? 'OPENING' },
        },
      ],
      nodeTrail: ['responder'],
    };
  };
}
