import type { EvaluateAnswerInput } from '../providers/llm/types.js';
import { buildPersona, formatList, type PromptMessage } from './shared.js';

/**
 * Prompt for the Answer Analyzer. Asks the model to return a strict JSON object
 * — the six score axes, coverage, signals, and a hidden reasoning note. The
 * shape mirrors `AnswerAnalysis` and is validated by the provider on the way out.
 */
export function buildEvaluatePrompt(input: EvaluateAnswerInput): PromptMessage[] {
  const { config, question, answer, activeTopic, remainingTopics, coveredTopics } = input;

  const system = [
    buildPersona(config),
    '',
    'You are now in silent evaluation mode. Assess the candidate\'s latest answer.',
    'Return ONLY a JSON object (no prose) with exactly this shape:',
    `{
  "scores": {
    "clarity": 0-100,
    "confidence": 0-100,
    "completeness": 0-100,
    "starStructure": 0-100,
    "technicalCorrectness": 0-100,
    "communication": 0-100
  },
  "addressedQuestion": boolean,
  "topicsCovered": string[],   // topic labels from the required list this answer genuinely covered
  "strengths": string[],       // 0-3 short phrases
  "gaps": string[],            // 0-3 short phrases — what was missing or wrong
  "confidence": 0-100,         // how confident the candidate sounded
  "signals": {                 // one short phrase each, or "" if not observed
    "behavioral": string,
    "leadership": string,
    "ownership": string,
    "curiosity": string
  },
  "aiNote": string             // 1-2 sentences of hidden interviewer reasoning for the report
}`,
    'Be a fair but rigorous grader calibrated to the candidate seniority. starStructure only applies to behavioural stories; for technical answers score it by how well-structured the reasoning was.',
  ].join('\n');

  const user = [
    `Interview focus: ${config.interviewType}. Candidate seniority: ${config.seniority}.`,
    `Active topic: ${activeTopic ?? '(none yet)'}.`,
    `Required topics still uncovered: ${formatList(remainingTopics)}.`,
    `Topics already covered: ${formatList(coveredTopics)}.`,
    '',
    `Interviewer asked: "${question}"`,
    `Candidate answered: "${answer}"`,
  ].join('\n');

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
