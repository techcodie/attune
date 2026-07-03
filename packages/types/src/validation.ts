/**
 * Shared Zod schemas — the single source of truth for every shape that crosses
 * the network. The API validates incoming requests with these; the web client
 * validates forms with the *same* objects. One definition, no drift, and the
 * inferred TypeScript types come for free.
 */
import { z } from 'zod';
import { InterviewType, InterviewerPersonality, ExperienceLevel } from './interview.js';

// ── Primitives ──────────────────────────────────────────────────────────────

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Email is required')
  .email('Enter a valid email address')
  .max(254, 'Email is too long');

/**
 * Password policy: long enough to resist brute force, with a mix requirement.
 * We validate on both ends but only ever transmit over HTTPS and never log it.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[0-9]/, 'Include at least one number');

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Name must be at least 2 characters')
  .max(80, 'Name is too long');

// ── Auth DTOs ───────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // On login we only check presence — the stored hash is the real gate.
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ── Profile DTO ─────────────────────────────────────────────────────────────

export const profileSchema = z.object({
  targetRole: z
    .string()
    .trim()
    .min(2, 'Target role is required')
    .max(80, 'Target role is too long'),
  experienceLevel: z.nativeEnum(ExperienceLevel),
  yearsExperience: z
    .number({ invalid_type_error: 'Years of experience is required' })
    .int('Use a whole number')
    .min(0, 'Cannot be negative')
    .max(60, 'That seems too high'),
  preferredType: z.nativeEnum(InterviewType),
  focusSkills: z
    .array(z.string().trim().min(1).max(40))
    .min(1, 'Add at least one focus skill')
    .max(12, 'Keep it to 12 skills or fewer'),
  careerGoal: z.string().trim().max(400, 'Keep it under 400 characters').optional(),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// ── Interview configuration DTO ──────────────────────────────────────────────

/** Allowed configured durations (minutes). Keeps the UI and API in agreement. */
export const INTERVIEW_DURATIONS = [15, 30, 45, 60] as const;

export const createInterviewSchema = z.object({
  interviewType: z.nativeEnum(InterviewType),
  interviewerPersonality: z.nativeEnum(InterviewerPersonality),
  targetRole: z
    .string()
    .trim()
    .min(2, 'Target role is required')
    .max(80, 'Target role is too long'),
  difficulty: z
    .number({ invalid_type_error: 'Pick a difficulty' })
    .int()
    .min(1, 'Minimum difficulty is 1')
    .max(5, 'Maximum difficulty is 5'),
  durationMinutes: z
    .number({ invalid_type_error: 'Pick a duration' })
    .int()
    .refine((v) => (INTERVIEW_DURATIONS as readonly number[]).includes(v), 'Unsupported duration'),
  focusSkills: z.array(z.string().trim().min(1).max(40)).max(12, 'Keep it to 12 or fewer').default([]),
  // Future-ready knobs — accepted and persisted now, exercised in M4.
  preferredLanguage: z.string().min(2).max(10).default('en'),
  voicePreference: z.string().max(40).optional(),
});
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;

// ── Conversation turn (M3) ───────────────────────────────────────────────────

export const turnSchema = z.object({
  candidateText: z
    .string()
    .trim()
    .min(1, 'Say something first')
    .max(5000, 'That answer is very long — try to be more concise'),
});
export type TurnInput = z.infer<typeof turnSchema>;

// ── Auth response shapes (what the client receives) ─────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  /** Lets the frontend route to profile-completion vs dashboard. */
  hasProfile: boolean;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
}

export interface CandidateProfileDto extends ProfileInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}
