import { NextAction } from '@cadence/types';
import type { GenerateResponseInput } from '../providers/llm/types.js';
import { buildPersona, formatList, type PromptMessage } from './shared.js';

/**
 * Maps the engine's *already-decided* action to a natural-language instruction.
 * The model only phrases the move — it never decides it. This is what keeps the
 * interviewer's behaviour driven by InterviewState, not by the LLM's whim.
 */
const ACTION_INSTRUCTION: Record<NextAction, string> = {
  [NextAction.MOVE_ON]:
    'Briefly acknowledge their answer, then transition to a NEW topic and ask an opening question about it.',
  [NextAction.FOLLOW_UP]:
    'Ask a natural follow-up that digs deeper into something specific they just said.',
  [NextAction.CHALLENGE]:
    'Respectfully challenge or push back on an assumption or claim in their last answer.',
  [NextAction.ASK_EXAMPLE]:
    'Ask them for a concrete, specific example to back up what they just said.',
  [NextAction.ASK_WHY]:
    'Probe their reasoning — ask why they made a particular choice or how they arrived at it.',
  [NextAction.ASK_IMPLEMENTATION]:
    'Ask about concrete implementation details of what they described.',
  [NextAction.INCREASE_DIFFICULTY]:
    'Raise the bar: pose a harder variant or a tougher constraint on the current topic.',
  [NextAction.DECREASE_DIFFICULTY]:
    'Ease off gently: ask a simpler, more approachable question so they can regain footing.',
  [NextAction.WRAP_UP]:
    'Wind the interview down warmly: thank them, note it was good talking, and ask if they have any questions for you.',
};

const HUMAN_TRANSITIONS =
  'Open with a short, natural human reaction when it fits (e.g. "Got it.", "Interesting — ", ' +
  '"That makes sense.", "I\'d like to push on that a little."). Vary it; never reuse the same opener twice in a row.';

export function buildRespondPrompt(input: GenerateResponseInput): PromptMessage[] {
  const persona = buildPersona(input.config);

  const context = [
    `Stage: ${input.stage}. Your current objective: ${input.objective}.`,
    `Topics already covered (do NOT re-ask these): ${formatList(input.coveredTopics)}.`,
    `Topics still to cover: ${formatList(input.remainingTopics)}.`,
    input.focusTopic ? `Steer toward this topic now: ${input.focusTopic}.` : '',
    `Rolling summary: ${input.summary || '(just starting)'}`,
  ]
    .filter(Boolean)
    .join('\n');

  const instruction = input.isOpening
    ? 'Open the interview: introduce yourself in one line, set a relaxed tone, and ask your first, easy opening question (their background or a gentle lead-in to the first topic).'
    : ACTION_INSTRUCTION[input.action ?? NextAction.FOLLOW_UP];

  const system = [
    persona,
    '',
    context,
    '',
    `Your move this turn: ${instruction}`,
    input.isOpening ? '' : HUMAN_TRANSITIONS,
    'Output only what you would say out loud — no stage directions, no labels. 1–3 sentences, exactly one question.',
  ]
    .filter(Boolean)
    .join('\n');

  // Give the model the last few turns for continuity.
  const history: PromptMessage[] = input.recentTurns.slice(-6).map((t) => ({
    role: t.speaker === 'INTERVIEWER' ? ('assistant' as const) : ('user' as const),
    content: t.text,
  }));

  return [{ role: 'system', content: system }, ...history];
}
