import type { GenerateResponseInput } from '../../providers/llm/types.js';
import type { EngineStateType } from '../engine.state.js';

/** Shared fields between the opening and reply prompt inputs. */
function baseInput(state: EngineStateType): Omit<GenerateResponseInput, 'action' | 'actionReason' | 'focusTopic' | 'lastAnswer' | 'isOpening' | 'summary' | 'objective'> {
  return {
    config: { ...state.config, difficulty: state.difficulty },
    stage: state.state.currentStage,
    coveredTopics: state.state.coveredTopics,
    remainingTopics: state.state.remainingTopics,
    recentTurns: state.messages,
  };
}

/**
 * Prompt Composer — assembles the `GenerateResponseInput` for the responder
 * from InterviewState + the decision. It composes; it never calls the model.
 * Two entry points keep the opening turn and the reply turn cleanly separated.
 */
export async function composeReply(state: EngineStateType): Promise<Partial<EngineStateType>> {
  const responseInput: GenerateResponseInput = {
    ...baseInput(state),
    objective: state.state.currentObjective,
    action: state.decision?.action ?? null,
    actionReason: state.decision?.reason ?? '',
    focusTopic: state.focusTopic,
    summary: state.state.conversationSummary,
    lastAnswer: state.candidateText,
    isOpening: false,
  };
  return { responseInput, nodeTrail: ['promptComposer'] };
}

export async function composeOpening(state: EngineStateType): Promise<Partial<EngineStateType>> {
  const responseInput: GenerateResponseInput = {
    ...baseInput(state),
    objective: state.state.currentObjective,
    action: null,
    actionReason: 'Opening the interview.',
    focusTopic: null,
    summary: '',
    lastAnswer: null,
    isOpening: true,
  };
  return { responseInput, nodeTrail: ['composeOpening'] };
}
