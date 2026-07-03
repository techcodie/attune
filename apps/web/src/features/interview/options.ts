import {
  INTERVIEW_DURATIONS,
  InterviewType,
  InterviewerPersonality,
  type Difficulty,
} from '@cadence/types';

export interface OptionMeta<T extends string> {
  value: T;
  label: string;
  description: string;
  icon: string;
}

export const INTERVIEW_TYPE_META: readonly OptionMeta<InterviewType>[] = [
  {
    value: InterviewType.BEHAVIORAL,
    label: 'Behavioral',
    description: 'Stories, ownership, teamwork — STAR-structured answers.',
    icon: '🗣️',
  },
  {
    value: InterviewType.SYSTEM_DESIGN,
    label: 'System Design',
    description: 'Scope, data models, scale and trade-offs.',
    icon: '🏗️',
  },
  {
    value: InterviewType.CODING,
    label: 'Coding',
    description: 'Approach, complexity, edge cases and correctness.',
    icon: '💻',
  },
  {
    value: InterviewType.PRODUCT_SENSE,
    label: 'Product Sense',
    description: 'User problems, prioritization and metrics.',
    icon: '🧭',
  },
  {
    value: InterviewType.LEADERSHIP,
    label: 'Leadership',
    description: 'Vision, people, execution and hard calls.',
    icon: '🎖️',
  },
];

export const PERSONALITY_META: readonly OptionMeta<InterviewerPersonality>[] = [
  {
    value: InterviewerPersonality.FRIENDLY_MENTOR,
    label: 'Friendly Mentor',
    description: 'Warm and encouraging. Gives you room to think.',
    icon: '🤝',
  },
  {
    value: InterviewerPersonality.NEUTRAL_PROFESSIONAL,
    label: 'Neutral Professional',
    description: 'Precise and by-the-book. No surprises.',
    icon: '💼',
  },
  {
    value: InterviewerPersonality.SKEPTICAL_STAFF_ENGINEER,
    label: 'Skeptical Staff Engineer',
    description: 'Probing and sceptical. Pushes on every claim.',
    icon: '🧐',
  },
  {
    value: InterviewerPersonality.FAANG_BAR_RAISER,
    label: 'Bar Raiser',
    description: 'Fast, high-signal, minimal small talk.',
    icon: '⚡',
  },
];

export interface DifficultyMeta {
  value: Difficulty;
  label: string;
  description: string;
}

export const DIFFICULTY_META: readonly DifficultyMeta[] = [
  { value: 1, label: 'Warm-up', description: 'Gentle, foundational questions.' },
  { value: 2, label: 'Easy', description: 'Approachable with light probing.' },
  { value: 3, label: 'Balanced', description: 'A realistic, standard loop.' },
  { value: 4, label: 'Hard', description: 'Sharper follow-ups and pressure.' },
  { value: 5, label: 'Staff bar', description: 'Relentless depth and rigor.' },
];

export const DURATION_META: readonly { value: number; label: string }[] =
  INTERVIEW_DURATIONS.map((m) => ({ value: m, label: `${m} min` }));
