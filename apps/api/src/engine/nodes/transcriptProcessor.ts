import { Speaker, TimelineEventType } from '@cadence/types';
import type { EngineStateType } from '../engine.state.js';

/**
 * Transcript Processor — ingests the candidate's new turn into the working
 * message list and stamps the elapsed time. Runs only on the answer path.
 */
export async function transcriptProcessor(
  state: EngineStateType,
): Promise<Partial<EngineStateType>> {
  const text = state.candidateText ?? '';
  const turn = { speaker: Speaker.CANDIDATE, text };

  return {
    messages: [...state.messages, turn],
    state: { ...state.state, elapsedTimeMs: state.nowMs },
    events: [
      {
        type: TimelineEventType.ANSWER_RECEIVED,
        label: 'Candidate answered',
        atMs: state.nowMs,
        data: { chars: text.length },
      },
    ],
    nodeTrail: ['transcriptProcessor'],
  };
}
