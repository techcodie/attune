import type { EngineStateType } from '../engine.state.js';

/**
 * Interview Coordinator — the graph's entry node. It performs no mutation of
 * substance; its job is to mark the turn and let the conditional edge route
 * between the opening path and the answer-processing path.
 */
export async function coordinator(_state: EngineStateType): Promise<Partial<EngineStateType>> {
  return { nodeTrail: ['coordinator'] };
}

/** Edge selector: opening turn vs. processing a candidate answer. */
export function routeFromCoordinator(state: EngineStateType): 'opening' | 'answer' {
  return state.isOpening ? 'opening' : 'answer';
}
