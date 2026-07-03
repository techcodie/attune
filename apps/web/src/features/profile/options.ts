import { ExperienceLevel, InterviewType } from '@cadence/types';
import type { SelectOption } from '@/components/ui/Select';

/** Human-readable labels for the interview types the candidate can pick. */
export const INTERVIEW_TYPE_OPTIONS: readonly SelectOption[] = [
  { value: InterviewType.BEHAVIORAL, label: 'Behavioral' },
  { value: InterviewType.SYSTEM_DESIGN, label: 'System Design' },
  { value: InterviewType.CODING, label: 'Coding' },
  { value: InterviewType.PRODUCT_SENSE, label: 'Product Sense' },
  { value: InterviewType.LEADERSHIP, label: 'Leadership' },
];

export const EXPERIENCE_LEVEL_OPTIONS: readonly SelectOption[] = [
  { value: ExperienceLevel.INTERN, label: 'Intern' },
  { value: ExperienceLevel.JUNIOR, label: 'Junior' },
  { value: ExperienceLevel.MID, label: 'Mid-level' },
  { value: ExperienceLevel.SENIOR, label: 'Senior' },
  { value: ExperienceLevel.STAFF, label: 'Staff' },
  { value: ExperienceLevel.PRINCIPAL, label: 'Principal' },
];
