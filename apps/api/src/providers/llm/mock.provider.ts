import {
  EVALUATION_CATEGORIES,
  HiringRecommendation,
  NextAction,
  type CategoryScore,
  type EvaluationCategoryKey,
} from '@cadence/types';
import type {
  AnswerAnalysis,
  EvaluateAnswerInput,
  EvaluateInterviewInput,
  GenerateResponseInput,
  InterviewAssessment,
  LLMProvider,
  SummarizeInput,
} from './types.js';
import { isCategoryApplicable } from './parseAssessment.js';

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/**
 * A fully deterministic provider. No network, no keys. It reacts to answer
 * length and simple lexical cues so the whole engine — evaluation, coverage,
 * difficulty, decisions — can be exercised offline and in tests, exactly the
 * behaviour the real Groq provider drives. Enable with LLM_PROVIDER=mock.
 */
export class MockProvider implements LLMProvider {
  readonly name = 'mock';

  async evaluateAnswer(input: EvaluateAnswerInput): Promise<AnswerAnalysis> {
    const words = input.answer.trim().split(/\s+/).filter(Boolean).length;
    const base = clamp(35 + words * 2.5);
    const gaveExample = /example|instance|for instance|e\.g\.|last (year|month|week)|at my/i.test(
      input.answer,
    );
    const gaveReasoning = /because|so that|in order to|the reason|which means/i.test(input.answer);

    // Deterministically mark the *active* topic covered once the candidate says
    // something substantive about it, so coverage advances one topic at a time.
    const topicsCovered = words >= 4 && input.activeTopic ? [input.activeTopic] : [];

    return {
      scores: {
        clarity: base,
        confidence: clamp(base + (gaveReasoning ? 5 : -5)),
        completeness: clamp(base - 5 + (gaveExample ? 10 : 0)),
        starStructure: clamp(base - 8 + (gaveExample ? 12 : 0)),
        technicalCorrectness: clamp(base + (gaveReasoning ? 8 : 0)),
        communication: clamp(base + 4),
      },
      addressedQuestion: words >= 4,
      topicsCovered,
      strengths: gaveExample ? ['Gave a concrete example'] : [],
      gaps: gaveReasoning ? [] : ['Reasoning could be more explicit'],
      confidence: clamp(45 + words),
      signals: {
        behavioral: gaveExample ? 'Referenced a real situation' : '',
        leadership: /\bwe\b|team|led|mentor/i.test(input.answer) ? 'Framed work in a team context' : '',
        ownership: /\bI\b|my|mine|owned/i.test(input.answer) ? 'Took personal ownership' : '',
        curiosity: input.answer.includes('?') ? 'Asked a clarifying question' : '',
      },
      aiNote: `[mock] ${words}-word answer on "${input.activeTopic ?? 'opening'}". ${
        gaveReasoning ? 'Reasoning present.' : 'Thin on reasoning.'
      } ${gaveExample ? 'Concrete example given.' : 'No example yet.'}`,
    };
  }

  async summarizeConversation(input: SummarizeInput): Promise<string> {
    const lastCandidate = [...input.recentTurns].reverse().find((t) => t.speaker === 'CANDIDATE');
    const addition = lastCandidate ? ` Candidate discussed: ${lastCandidate.text.slice(0, 80)}.` : '';
    return `${input.previousSummary}${addition}`.trim().slice(0, 800);
  }

  async generateInterviewResponse(input: GenerateResponseInput): Promise<string> {
    if (input.isOpening) {
      return `Hi, thanks for making the time — I'm your interviewer today. To get us started, tell me a bit about your background and what you're working on lately.`;
    }
    const topic = input.focusTopic ?? input.remainingTopics[0] ?? 'your experience';
    const byAction: Record<NextAction, string> = {
      [NextAction.MOVE_ON]: `Got it. Let's switch gears — walk me through your experience with ${topic}.`,
      [NextAction.FOLLOW_UP]: `Interesting. Can you go a bit deeper on ${topic}?`,
      [NextAction.CHALLENGE]: `I'm not fully convinced — what would you say to someone who pushed back on your approach to ${topic}?`,
      [NextAction.ASK_EXAMPLE]: `Could you give me a concrete example of that around ${topic}?`,
      [NextAction.ASK_WHY]: `Why did you choose that approach for ${topic}?`,
      [NextAction.ASK_IMPLEMENTATION]: `How would you actually implement that part of ${topic}?`,
      [NextAction.INCREASE_DIFFICULTY]: `Let's raise the bar: how does your ${topic} approach hold up at 10x scale?`,
      [NextAction.DECREASE_DIFFICULTY]: `No problem, let's take it a step back — what's the core idea behind ${topic}?`,
      [NextAction.WRAP_UP]: `That's a good place to wrap up. Thanks for talking through all of that — do you have any questions for me?`,
    };
    return byAction[input.action ?? NextAction.FOLLOW_UP];
  }

  async evaluateInterview(input: EvaluateInterviewInput): Promise<InterviewAssessment> {
    const sa = input.scoreAverages;
    const sig = input.signals;

    const rawScore: Record<EvaluationCategoryKey, number> = {
      technical_knowledge: sa.technicalCorrectness,
      problem_solving: (sa.clarity + sa.completeness) / 2,
      communication: sa.communication,
      confidence: input.confidenceAvg,
      behavioral_skills: clamp(50 + sig.behavioral.length * 12),
      leadership: clamp(45 + sig.leadership.length * 14),
      ownership: clamp(48 + sig.ownership.length * 13),
      adaptability: clamp((sa.clarity + sa.confidence) / 2),
      critical_thinking: clamp((sa.starStructure + sa.completeness) / 2),
      system_design: sa.technicalCorrectness,
      learning_mindset: clamp(50 + sig.curiosity.length * 15),
    };

    const justify: Record<EvaluationCategoryKey, string> = {
      technical_knowledge: `Averaged technical correctness of ${r(sa.technicalCorrectness)}/100 across answers.`,
      problem_solving: `Clarity ${r(sa.clarity)} and completeness ${r(sa.completeness)} indicate structured problem-solving.`,
      communication: `Communication averaged ${r(sa.communication)}/100.`,
      confidence: `Observed confidence averaged ${r(input.confidenceAvg)}/100.`,
      behavioral_skills: sig.behavioral[0] ?? 'Few explicit behavioural signals surfaced.',
      leadership: sig.leadership[0] ?? 'Limited leadership framing observed.',
      ownership: sig.ownership[0] ?? 'Ownership was implied but not strongly evidenced.',
      adaptability: `Handled shifting difficulty with clarity ${r(sa.clarity)}.`,
      critical_thinking: `Reasoning structure scored ${r((sa.starStructure + sa.completeness) / 2)}/100.`,
      system_design: `Technical depth on design topics averaged ${r(sa.technicalCorrectness)}/100.`,
      learning_mindset: sig.curiosity[0] ?? 'Some curiosity shown through clarifying questions.',
    };

    const categories: CategoryScore[] = EVALUATION_CATEGORIES.map((c) => {
      const applicable = isCategoryApplicable(c.key, input.config.interviewType);
      return {
        key: c.key,
        label: c.label,
        score: applicable ? Math.round(rawScore[c.key]) : 0,
        justification: applicable ? justify[c.key] : 'Not assessed in this interview format.',
        applicable,
      };
    });

    const applicable = categories.filter((c) => c.applicable);
    const overall = Math.round(applicable.reduce((a, c) => a + c.score, 0) / applicable.length);
    const ranked = [...applicable].sort((a, b) => b.score - a.score);
    const top = ranked.slice(0, 3);
    const bottom = ranked.slice(-3).reverse();

    const candidateTurns = input.transcript.filter((t) => t.speaker === 'CANDIDATE');
    const longest = candidateTurns.reduce((a, b) => (b.text.length > a.text.length ? b : a), candidateTurns[0] ?? { text: '' });
    const shortest = candidateTurns.reduce((a, b) => (b.text.length < a.text.length ? b : a), candidateTurns[0] ?? { text: '' });

    return {
      categories,
      hiring: {
        recommendation: recommend(overall),
        confidence: clamp(50 + input.coveredTopics.length * 4),
        reasoning: `Overall ${overall}/100. Strongest in ${top[0]?.label ?? 'core areas'}; the main reservation is ${bottom[0]?.label ?? 'depth'}. ${input.aiNotes[0] ?? ''}`.trim(),
        supportingEvidence: [...input.aiNotes.slice(0, 3), ...sig.ownership.slice(0, 1)].filter(Boolean),
        concerns: [
          ...bottom.filter((c) => c.score < 60).map((c) => `${c.label} needs work`),
          ...input.remainingTopics.slice(0, 2).map((t) => `Did not reach: ${t}`),
        ],
        suggestedNextRound:
          input.config.interviewType === 'SYSTEM_DESIGN'
            ? 'A coding round to confirm implementation ability.'
            : 'A deeper technical or system-design round.',
      },
      highlights: {
        strengths: top.map((c) => c.label),
        improvementAreas: [...bottom.map((c) => c.label), ...input.remainingTopics.slice(0, 2)].slice(0, 5),
        bestAnswer: longest.text ? `“${longest.text.slice(0, 140)}”` : 'No standout answer captured.',
        weakestAnswer: shortest.text ? `“${shortest.text.slice(0, 140)}”` : 'No clearly weak answer.',
        mostImpressiveMoment: sig.ownership[0] ?? sig.leadership[0] ?? `Strong ${top[0]?.label ?? 'performance'}.`,
        missedOpportunity: input.remainingTopics[0]
          ? `Never explored ${input.remainingTopics[0]}.`
          : 'Covered the required ground.',
      },
      summary: `[mock] Candidate for ${input.config.targetRole} scored ${overall}/100 across ${applicable.length} areas. Covered ${input.coveredTopics.length} topics. Strongest area: ${top[0]?.label ?? '—'}. Watch: ${bottom[0]?.label ?? '—'}.`,
    };
  }
}

function recommend(overall: number): HiringRecommendation {
  if (overall >= 82) return HiringRecommendation.STRONG_HIRE;
  if (overall >= 70) return HiringRecommendation.HIRE;
  if (overall >= 58) return HiringRecommendation.LEAN_HIRE;
  if (overall >= 45) return HiringRecommendation.LEAN_NO_HIRE;
  return HiringRecommendation.NO_HIRE;
}

function r(n: number): number {
  return Math.round(n);
}
