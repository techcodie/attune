import type {
  CategoryScore,
  EvaluationCategoryKey,
  LearningPlanItem,
  LearningStep,
} from '@cadence/types';

/**
 * A curated, LLM-free catalog of concrete next steps per competency. Keeping the
 * roadmap deterministic makes it specific and reliable — a model can drift into
 * vague advice, but "read PostgreSQL indexing docs, then build one schema" does
 * not. Keyed by the stable category keys.
 */
const LEARNING_CATALOG: Record<EvaluationCategoryKey, LearningStep[]> = {
  technical_knowledge: [
    { title: 'Close the fundamentals gap', detail: 'Pick the two weakest topics from this interview and write a one-page explainer for each from memory.' },
    { title: 'Build to prove it', detail: 'Ship a small project that forces you to use those concepts end-to-end.' },
  ],
  problem_solving: [
    { title: 'Structured decomposition', detail: 'Practice restating a problem, listing constraints, and outlining an approach before coding — 10 prompts.' },
    { title: 'Complexity fluency', detail: 'For each solution, state time/space complexity out loud and justify it.' },
  ],
  communication: [
    { title: 'Answer in STAR', detail: 'Rewrite 5 past answers into Situation–Task–Action–Result and rehearse them aloud.' },
    { title: 'Signpost your thinking', detail: 'Narrate trade-offs explicitly ("I chose X over Y because…").' },
  ],
  confidence: [
    { title: 'Rep the basics', detail: 'Do timed mock questions until the common ones feel automatic.' },
    { title: 'Own uncertainty', detail: 'Practice saying "here’s my assumption" instead of hedging.' },
  ],
  behavioral_skills: [
    { title: 'Story bank', detail: 'Prepare 8 concrete stories mapped to teamwork, conflict, failure, and impact.' },
    { title: 'Quantify impact', detail: 'Add a measurable result to each story.' },
  ],
  leadership: [
    { title: 'Frame scope & influence', detail: 'Practice describing decisions you drove and how you aligned others.' },
    { title: 'Develop-others examples', detail: 'Prepare a story about growing a teammate or mentoring.' },
  ],
  ownership: [
    { title: 'End-to-end narratives', detail: 'Tell one story where you owned an outcome from ambiguity to delivery.' },
    { title: 'Post-incident mindset', detail: 'Practice explaining a failure you took responsibility for and fixed systemically.' },
  ],
  adaptability: [
    { title: 'Curveball drills', detail: 'Have a peer change requirements mid-answer and practice adjusting calmly.' },
  ],
  critical_thinking: [
    { title: 'Trade-off tables', detail: 'For 5 decisions, write the options, criteria, and why you chose.' },
    { title: 'Steelman the alternative', detail: 'Argue the opposite of your choice before defending it.' },
  ],
  system_design: [
    { title: 'Scoping first', detail: 'Practice clarifying requirements and estimating scale before designing.' },
    { title: 'Read canonical designs', detail: 'Study 3 reference architectures (feed, chat, rate limiter) and redraw from memory.' },
    { title: 'Failure modes', detail: 'For each design, enumerate bottlenecks and how you’d mitigate them.' },
  ],
  learning_mindset: [
    { title: 'Ask better questions', detail: 'Practice asking one sharp clarifying question early in each answer.' },
  ],
};

const WEAK_THRESHOLD = 65;
const MAX_ITEMS = 4;

export const learningPlanService = {
  /**
   * Build the roadmap from the applicable categories that scored below the weak
   * threshold, worst first, capped so it stays actionable.
   */
  build(categories: CategoryScore[]): LearningPlanItem[] {
    return categories
      .filter((c) => c.applicable && c.score < WEAK_THRESHOLD)
      .sort((a, b) => a.score - b.score)
      .slice(0, MAX_ITEMS)
      .map((c) => ({
        weakness: `${c.label} (${c.score}/100)`,
        steps: LEARNING_CATALOG[c.key],
      }));
  },
};
