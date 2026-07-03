import type { SummarizeInput } from '../providers/llm/types.js';
import type { PromptMessage } from './shared.js';

/**
 * Prompt for the Conversation Memory node. Folds the latest turns into the
 * rolling summary so the state stays bounded no matter how long the interview
 * runs. Returns plain prose (no JSON).
 */
export function buildSummarizePrompt(input: SummarizeInput): PromptMessage[] {
  const transcript = input.recentTurns
    .map((t) => `${t.speaker === 'INTERVIEWER' ? 'Interviewer' : 'Candidate'}: ${t.text}`)
    .join('\n');

  const system =
    'You maintain a concise running summary of a job interview. ' +
    'Update the existing summary with the new turns. Keep it under 150 words, ' +
    'factual and neutral, focusing on what the candidate has demonstrated and what is still unknown. ' +
    'Return only the updated summary text.';

  const user = [
    `Existing summary:\n${input.previousSummary || '(none yet)'}`,
    '',
    `New turns:\n${transcript}`,
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
