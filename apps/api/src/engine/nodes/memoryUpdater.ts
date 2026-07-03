import type { SignalObservation } from '@cadence/types';
import type { LLMProvider } from '../../providers/llm/types.js';
import { mergeCapped, type EngineStateType } from '../engine.state.js';

const CAP = 40;

function appendSignal(
  arr: SignalObservation[],
  note: string,
  atMs: number,
  weight: number,
): SignalObservation[] {
  if (!note) return arr;
  return [...arr, { note, atMs, weight }].slice(-CAP);
}

/** Blend a running 0–100 metric toward the latest reading (EMA). */
const blend = (prev: number, latest: number): number =>
  prev > 0 ? Math.round(prev * 0.6 + latest * 0.4) : Math.round(latest);

/**
 * Conversation Memory node — folds the new answer into the durable state:
 * rolling summary (via the provider), competency signals, strong/weak areas,
 * score history, confidence trend and the running technical/communication
 * metrics. This is what makes InterviewState evolve after every answer.
 */
export function makeMemoryUpdater(provider: LLMProvider) {
  return async function memoryUpdater(
    state: EngineStateType,
  ): Promise<Partial<EngineStateType>> {
    const analysis = state.analysis;
    if (!analysis) return { nodeTrail: ['memoryUpdater'] };

    const summary = await provider.summarizeConversation({
      previousSummary: state.state.conversationSummary,
      recentTurns: state.messages,
    });

    const at = state.nowMs;
    const s = state.state;

    return {
      state: {
        ...s,
        conversationSummary: summary,
        behavioralSignals: appendSignal(s.behavioralSignals, analysis.signals.behavioral, at, 0.5),
        leadershipSignals: appendSignal(s.leadershipSignals, analysis.signals.leadership, at, 0.5),
        ownershipSignals: appendSignal(s.ownershipSignals, analysis.signals.ownership, at, 0.5),
        curiositySignals: appendSignal(s.curiositySignals, analysis.signals.curiosity, at, 0.5),
        strongAreas: mergeCapped(s.strongAreas, analysis.strengths),
        weakAreas: mergeCapped(s.weakAreas, analysis.gaps),
        scoreHistory: [...s.scoreHistory, { atMs: at, scores: analysis.scores }].slice(-CAP),
        confidenceTrend: [...s.confidenceTrend, analysis.confidence].slice(-CAP),
        technicalAccuracy: blend(s.technicalAccuracy, analysis.scores.technicalCorrectness),
        communicationScore: blend(s.communicationScore, analysis.scores.communication),
        currentObjective: state.focusTopic ? `Explore: ${state.focusTopic}` : s.currentObjective,
      },
      nodeTrail: ['memoryUpdater'],
    };
  };
}
