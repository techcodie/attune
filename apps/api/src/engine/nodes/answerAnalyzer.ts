import { TimelineEventType } from '@cadence/types';
import type { LLMProvider } from '../../providers/llm/types.js';
import { lastInterviewerText, type EngineStateType } from '../engine.state.js';

/**
 * Answer Analyzer — the one node that grades the answer. Delegates to the LLM
 * provider's `evaluateAnswer` and captures the hidden reasoning note. Factory
 * form so a mock provider can be injected in tests.
 */
export function makeAnswerAnalyzer(provider: LLMProvider) {
  return async function answerAnalyzer(
    state: EngineStateType,
  ): Promise<Partial<EngineStateType>> {
    const question = lastInterviewerText(state.messages);
    const analysis = await provider.evaluateAnswer({
      config: state.config,
      question,
      answer: state.candidateText ?? '',
      activeTopic: state.state.activeTopic,
      remainingTopics: state.state.remainingTopics,
      coveredTopics: state.state.coveredTopics,
    });

    return {
      analysis,
      aiNote: analysis.aiNote,
      events: [
        {
          type: TimelineEventType.EVALUATION_RECORDED,
          label: 'Answer evaluated',
          atMs: state.nowMs,
          data: { addressed: analysis.addressedQuestion, topics: analysis.topicsCovered },
        },
      ],
      nodeTrail: ['answerAnalyzer'],
    };
  };
}
