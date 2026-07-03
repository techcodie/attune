import type { CoverageReport, CoverageTopic, InterviewType } from '@cadence/types';
import { REQUIRED_TOPICS, type CatalogTopic } from './coverage.catalog.js';

/**
 * The Coverage Engine.
 *
 * Deterministic and completely independent of the LLM: given an interview type
 * and the candidate's focus skills it derives the *required* topics, and given
 * the set of *covered* topic labels it computes what remains and a coverage
 * percentage. In M3 the LangGraph engine reads this to decide when a topic is
 * exhausted and when the interview can move on — but the maths lives here, where
 * it's testable in isolation.
 */

const norm = (s: string): string => s.trim().toLowerCase();

/** Focus skills the candidate asked for become first-class required topics. */
function focusSkillTopics(focusSkills: string[]): CatalogTopic[] {
  return focusSkills
    .map((s) => s.trim())
    .filter(Boolean)
    .map((label) => ({ key: `focus.${norm(label).replace(/\s+/g, '_')}`, label }));
}

/** De-duplicate topics by normalized label, preserving first occurrence. */
function dedupe(topics: CatalogTopic[]): CatalogTopic[] {
  const seen = new Set<string>();
  const out: CatalogTopic[] = [];
  for (const t of topics) {
    const k = norm(t.label);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/**
 * The full required-topic set for a configuration: the catalog for the type,
 * plus the candidate's focus skills. Returned as plain labels — that's what the
 * state's `remainingTopics` is seeded with.
 */
export function requiredTopicsFor(
  interviewType: InterviewType,
  focusSkills: string[],
): CatalogTopic[] {
  return dedupe([...REQUIRED_TOPICS[interviewType], ...focusSkillTopics(focusSkills)]);
}

/** A required topic is "covered" if any covered string matches it (fuzzy). */
function isCovered(topicLabel: string, coveredNorm: string[]): boolean {
  const t = norm(topicLabel);
  return coveredNorm.some((c) => c === t || c.includes(t) || t.includes(c));
}

/**
 * Compute the coverage report from the required labels and the covered labels.
 * Matching is normalized and fuzzy (substring either direction) so a free-form
 * covered topic like "database sharding" still ticks "Storage & database choice"
 * where sensible, without any model call.
 */
export function computeCoverage(
  interviewType: InterviewType,
  requiredLabels: string[],
  coveredLabels: string[],
): CoverageReport {
  const coveredNorm = coveredLabels.map(norm);

  const topics: CoverageTopic[] = requiredLabels.map((label) => ({
    key: norm(label).replace(/\s+/g, '_'),
    label,
    covered: isCovered(label, coveredNorm),
  }));

  const coveredCount = topics.filter((t) => t.covered).length;
  const totalCount = topics.length;
  const remainingCount = totalCount - coveredCount;
  const coveragePct = totalCount === 0 ? 0 : Math.round((coveredCount / totalCount) * 100);

  return { interviewType, topics, coveredCount, remainingCount, totalCount, coveragePct };
}
