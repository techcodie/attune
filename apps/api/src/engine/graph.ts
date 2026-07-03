import { StateGraph, START, END } from '@langchain/langgraph';
import type { LLMProvider } from '../providers/llm/types.js';
import { EngineState } from './engine.state.js';
import { coordinator, routeFromCoordinator } from './nodes/coordinator.js';
import { transcriptProcessor } from './nodes/transcriptProcessor.js';
import { makeAnswerAnalyzer } from './nodes/answerAnalyzer.js';
import { coverageEngine } from './nodes/coverageEngine.js';
import { difficultyEngine } from './nodes/difficultyEngine.js';
import { decisionEngine } from './nodes/decisionEngine.js';
import { makeMemoryUpdater } from './nodes/memoryUpdater.js';
import { composeOpening, composeReply } from './nodes/promptComposer.js';
import { makeResponder } from './nodes/responder.js';

/**
 * The interview graph.
 *
 *   START → coordinator ──(opening)──────────────► composeOpening ─┐
 *                        └(answer)─► transcriptProcessor           │
 *                                    → answerAnalyzer              │
 *                                    → coverageEngine              │
 *                                    → difficultyEngine            │
 *                                    → decisionEngine              │
 *                                    → memoryUpdater               │
 *                                    → composeReply ───────────────┤
 *                                                                  ▼
 *                                                              responder → END
 *
 * Each node has a single responsibility and is independently testable; the LLM
 * lives behind the injected provider, so the whole graph runs offline with a
 * mock. Both interview modes (voice, text) execute this exact graph.
 */
export function buildInterviewGraph(provider: LLMProvider) {
  return new StateGraph(EngineState)
    .addNode('coordinator', coordinator)
    .addNode('transcriptProcessor', transcriptProcessor)
    .addNode('answerAnalyzer', makeAnswerAnalyzer(provider))
    .addNode('coverageEngine', coverageEngine)
    .addNode('difficultyEngine', difficultyEngine)
    .addNode('decisionEngine', decisionEngine)
    .addNode('memoryUpdater', makeMemoryUpdater(provider))
    .addNode('composeReply', composeReply)
    .addNode('composeOpening', composeOpening)
    .addNode('responder', makeResponder(provider))
    .addEdge(START, 'coordinator')
    .addConditionalEdges('coordinator', routeFromCoordinator, {
      opening: 'composeOpening',
      answer: 'transcriptProcessor',
    })
    .addEdge('composeOpening', 'responder')
    .addEdge('transcriptProcessor', 'answerAnalyzer')
    .addEdge('answerAnalyzer', 'coverageEngine')
    .addEdge('coverageEngine', 'difficultyEngine')
    .addEdge('difficultyEngine', 'decisionEngine')
    .addEdge('decisionEngine', 'memoryUpdater')
    .addEdge('memoryUpdater', 'composeReply')
    .addEdge('composeReply', 'responder')
    .addEdge('responder', END)
    .compile();
}

export type InterviewGraph = ReturnType<typeof buildInterviewGraph>;
