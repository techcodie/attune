import { InterviewType, InterviewerPersonality } from '@cadence/types';
import type { InterviewConfigContext } from '../providers/llm/types.js';

/** Provider-neutral chat message. Groq/OpenAI/Gemini all speak this shape. */
export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export type { InterviewConfigContext };

/** How each personality carries themselves — drives tone, not content. */
export const PERSONALITY_STYLE: Record<InterviewerPersonality, string> = {
  [InterviewerPersonality.FRIENDLY_MENTOR]:
    'Warm, encouraging and patient. You put the candidate at ease and give them room to think, but you still probe for depth.',
  [InterviewerPersonality.NEUTRAL_PROFESSIONAL]:
    'Calm, precise and professional. You are neutral and by-the-book, neither warm nor cold.',
  [InterviewerPersonality.SKEPTICAL_STAFF_ENGINEER]:
    'Sharp and sceptical. You push on vague claims, ask for evidence, and are hard to fully convince.',
  [InterviewerPersonality.FAANG_BAR_RAISER]:
    'Fast, high-signal and efficient. Minimal small talk. You raise the bar and expect crisp, senior answers.',
};

/** What each interview format is fundamentally probing for. */
export const TYPE_FOCUS: Record<InterviewType, string> = {
  [InterviewType.BEHAVIORAL]:
    'past behaviour using concrete stories (ideally STAR-structured): ownership, collaboration, conflict, impact.',
  [InterviewType.SYSTEM_DESIGN]:
    'system design ability: scoping, data models, scaling, trade-offs and failure modes.',
  [InterviewType.CODING]:
    'problem-solving: approach, complexity, edge cases, correctness and testing (spoken through, not typed).',
  [InterviewType.PRODUCT_SENSE]:
    'product thinking: user problems, segmentation, prioritisation, metrics and trade-offs.',
  [InterviewType.LEADERSHIP]:
    'leadership: vision, developing people, execution, stakeholder management and hard decisions.',
};

export const formatList = (items: string[], empty = 'none yet'): string =>
  items.length ? items.join(', ') : empty;

/** The persona system message — the interviewer's identity and hard rules. */
export function buildPersona(config: InterviewConfigContext): string {
  return [
    `You are Attune, a senior technical interviewer conducting a ${config.interviewType
      .replace('_', ' ')
      .toLowerCase()} interview for a ${config.targetRole} (${config.seniority}) candidate.`,
    `Personality: ${PERSONALITY_STYLE[config.personality]}`,
    `This format probes ${TYPE_FOCUS[config.interviewType]}`,
    'Hard rules:',
    '- You are the interviewer, never the candidate. Never answer your own questions.',
    '- Speak naturally, like a real human interviewer on a call. Vary your phrasing.',
    '- Ask ONE thing at a time. Keep each turn to 1–3 sentences.',
    '- Never reveal scores, internal reasoning, difficulty, or that you are an AI.',
    '- Do not read out lists or headings; this is a spoken conversation.',
  ].join('\n');
}
