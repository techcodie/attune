/**
 * Standalone verification of the Coverage Engine's maths. Run with:
 *   pnpm --filter @cadence/api exec tsx scripts/coverageCheck.ts
 * Not part of the build (lives outside src/).
 */
import { InterviewType } from '@cadence/types';
import { computeCoverage, requiredTopicsFor } from '../src/modules/coverage/coverage.engine.js';

let pass = 0;
let fail = 0;
function assert(desc: string, cond: boolean): void {
  if (cond) {
    console.log(`  ✓ ${desc}`);
    pass++;
  } else {
    console.log(`  ✗ ${desc}`);
    fail++;
  }
}

// Required topics = catalog (8 for system design) + 2 focus skills = 10.
const required = requiredTopicsFor(InterviewType.SYSTEM_DESIGN, ['Kafka', 'Sharding']).map(
  (t) => t.label,
);
assert('system design required = 8 base + 2 focus = 10', required.length === 10);

// Nothing covered yet.
const empty = computeCoverage(InterviewType.SYSTEM_DESIGN, required, []);
assert('empty coverage is 0%', empty.coveragePct === 0 && empty.coveredCount === 0);
assert('empty remaining = total', empty.remainingCount === empty.totalCount);

// Cover three topics, including a fuzzy match ("database sharding" ⊇ "Sharding").
const covered = ['Requirements & scoping', 'API design', 'database sharding'];
const report = computeCoverage(InterviewType.SYSTEM_DESIGN, required, covered);
assert('covers 3 topics', report.coveredCount === 3);
assert('remaining = total - covered', report.remainingCount === report.totalCount - 3);
assert('percentage = round(3/10*100) = 30', report.coveragePct === 30);
assert(
  'fuzzy match ticked the Sharding focus topic',
  report.topics.find((t) => t.label === 'Sharding')?.covered === true,
);

// Focus skills dedupe against nothing here, but case-insensitive dedupe holds.
const deduped = requiredTopicsFor(InterviewType.BEHAVIORAL, ['Teamwork & collaboration']);
assert(
  'focus skill duplicating a catalog label is de-duplicated',
  deduped.filter((t) => t.label.toLowerCase() === 'teamwork & collaboration').length === 1,
);

console.log(`\nCoverage engine: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
