import { EVALUATION_CATEGORIES, HiringRecommendation } from '@cadence/types';
import type { EvaluateInterviewInput } from '../providers/llm/types.js';
import { buildPersona, formatList, type PromptMessage } from './shared.js';

/**
 * Prompt for the post-interview evaluation. It hands the model the *evidence*
 * it must ground scores in — averaged answer scores, the interviewer's own
 * hidden notes, competency signals, and coverage — and asks for a strict JSON
 * assessment. This is deliberately not "summarize the interview": the model is
 * an evaluator reasoning over observations.
 */
export function buildEvaluateInterviewPrompt(input: EvaluateInterviewInput): PromptMessage[] {
  const categoryList = EVALUATION_CATEGORIES.map((c) => `"${c.key}" (${c.label})`).join(', ');
  const recs = Object.values(HiringRecommendation).join(' | ');

  const transcript = input.transcript
    .map((t) => `${t.speaker === 'INTERVIEWER' ? 'Q' : 'A'}: ${t.text}`)
    .join('\n');

  const evidence = [
    `Role: ${input.config.targetRole} (${input.config.seniority}). Format: ${input.config.interviewType}. Duration: ${Math.round(input.durationSec / 60)} min.`,
    `Averaged answer scores (0-100): clarity ${r(input.scoreAverages.clarity)}, confidence ${r(input.scoreAverages.confidence)}, completeness ${r(input.scoreAverages.completeness)}, STAR ${r(input.scoreAverages.starStructure)}, technical ${r(input.scoreAverages.technicalCorrectness)}, communication ${r(input.scoreAverages.communication)}.`,
    `Observed confidence average: ${r(input.confidenceAvg)}.`,
    `Topics covered: ${formatList(input.coveredTopics)}. Not reached: ${formatList(input.remainingTopics)}.`,
    `Behavioral signals: ${formatList(input.signals.behavioral)}.`,
    `Leadership signals: ${formatList(input.signals.leadership)}.`,
    `Ownership signals: ${formatList(input.signals.ownership)}.`,
    `Curiosity signals: ${formatList(input.signals.curiosity)}.`,
    `Interviewer's private notes:\n${input.aiNotes.map((n) => `- ${n}`).join('\n') || '- (none)'}`,
  ].join('\n');

  const system = [
    buildPersona(input.config),
    '',
    'The interview is over. Write a rigorous hiring-panel evaluation, grounded ONLY in the evidence and transcript provided. Do NOT invent facts. Calibrate to the candidate seniority.',
    'Return ONLY a JSON object with this shape:',
    `{
  "categories": [ { "key": one of [${categoryList}], "score": 0-100, "justification": "one sentence citing a specific observation" } ],
  "hiring": {
    "recommendation": ${recs},
    "confidence": 0-100,
    "reasoning": "2-4 sentences in an interviewer's voice — decisive, evidence-based",
    "supportingEvidence": ["short bullet", ...],
    "concerns": ["short bullet", ...],
    "suggestedNextRound": "what to probe in the next round"
  },
  "highlights": {
    "strengths": ["up to 5"],
    "improvementAreas": ["up to 5"],
    "bestAnswer": "the strongest moment, quoted or paraphrased",
    "weakestAnswer": "the weakest moment",
    "mostImpressiveMoment": "one sentence",
    "missedOpportunity": "one sentence"
  },
  "summary": "3-5 sentences of interviewer notes, not marketing copy"
}`,
    'Include every applicable category. Only score "system_design" if this was a system-design interview; otherwise still include it with a note that it was not assessed.',
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: `EVIDENCE\n${evidence}\n\nTRANSCRIPT\n${transcript}` },
  ];
}

function r(n: number): number {
  return Math.round(n);
}
