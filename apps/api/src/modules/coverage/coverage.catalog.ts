import { InterviewType } from '@cadence/types';

/** A canonical topic the interview format is expected to cover. */
export interface CatalogTopic {
  key: string;
  label: string;
}

/**
 * The required-topic catalog — the backbone of the Coverage Engine.
 *
 * This is intentionally a hand-curated, LLM-free knowledge base: coverage must
 * be deterministic and explainable, not a model's guess. Each interview type
 * maps to the competencies a strong loop is expected to touch. Candidate focus
 * skills are layered on top at runtime by the engine.
 */
export const REQUIRED_TOPICS: Record<InterviewType, readonly CatalogTopic[]> = {
  [InterviewType.BEHAVIORAL]: [
    { key: 'behavioral.motivation', label: 'Motivation & background' },
    { key: 'behavioral.teamwork', label: 'Teamwork & collaboration' },
    { key: 'behavioral.conflict', label: 'Handling conflict' },
    { key: 'behavioral.ownership', label: 'Ownership & accountability' },
    { key: 'behavioral.failure', label: 'Failure & learning' },
    { key: 'behavioral.impact', label: 'Measurable impact' },
    { key: 'behavioral.communication', label: 'Communication style' },
  ],
  [InterviewType.SYSTEM_DESIGN]: [
    { key: 'system_design.requirements', label: 'Requirements & scoping' },
    { key: 'system_design.api', label: 'API design' },
    { key: 'system_design.data_model', label: 'Data modeling' },
    { key: 'system_design.scalability', label: 'Scalability' },
    { key: 'system_design.storage', label: 'Storage & database choice' },
    { key: 'system_design.caching', label: 'Caching' },
    { key: 'system_design.tradeoffs', label: 'Trade-offs & bottlenecks' },
    { key: 'system_design.reliability', label: 'Reliability & failure modes' },
  ],
  [InterviewType.CODING]: [
    { key: 'coding.understanding', label: 'Problem understanding' },
    { key: 'coding.approach', label: 'Approach & algorithm' },
    { key: 'coding.complexity', label: 'Complexity analysis' },
    { key: 'coding.edge_cases', label: 'Edge cases' },
    { key: 'coding.correctness', label: 'Correctness' },
    { key: 'coding.testing', label: 'Testing' },
    { key: 'coding.optimization', label: 'Optimization' },
  ],
  [InterviewType.PRODUCT_SENSE]: [
    { key: 'product.user_problem', label: 'User problem framing' },
    { key: 'product.segmentation', label: 'Target segment' },
    { key: 'product.prioritization', label: 'Prioritization' },
    { key: 'product.metrics', label: 'Success metrics' },
    { key: 'product.tradeoffs', label: 'Trade-offs' },
    { key: 'product.gtm', label: 'Go-to-market' },
  ],
  [InterviewType.LEADERSHIP]: [
    { key: 'leadership.vision', label: 'Vision & strategy' },
    { key: 'leadership.people', label: 'People development' },
    { key: 'leadership.conflict', label: 'Conflict management' },
    { key: 'leadership.execution', label: 'Delivery & execution' },
    { key: 'leadership.stakeholders', label: 'Stakeholder management' },
    { key: 'leadership.decisions', label: 'Decision making' },
  ],
};
