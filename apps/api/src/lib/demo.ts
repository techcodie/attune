/**
 * Ensures a ready-to-use demo account exists so a reviewer can sign in with one
 * click (see the "Try the demo" button on the web login). Runs on startup and is
 * idempotent — it only seeds when the account is missing, so it never wipes
 * activity or slows subsequent boots.
 *
 * Demo credentials: demo@cadence.app / Demo1234!
 */
import type { Prisma } from '@prisma/client';
import {
  EVALUATION_CATEGORIES,
  HiringRecommendation,
  InterviewStage,
  InterviewStatus,
  Speaker,
  type EvaluationReport,
  type InterviewType,
} from '@cadence/types';
import { prisma } from './prisma.js';
import { logger } from './logger.js';
import { hashPassword } from '../modules/auth/password.js';
import { buildInitialStateData } from '../modules/interviewState/interviewState.service.js';
import { requiredTopicsFor } from '../modules/coverage/coverage.engine.js';

export const DEMO_EMAIL = 'demo@cadence.app';
export const DEMO_PASSWORD = 'Demo1234!';

function buildReport(
  interviewId: string,
  interviewType: InterviewType,
  targetRole: string,
  overall: number,
): EvaluationReport {
  const categories = EVALUATION_CATEGORIES.map((c, i) => {
    const applicable = c.key !== 'system_design' || interviewType === 'SYSTEM_DESIGN';
    return {
      key: c.key,
      label: c.label,
      score: applicable ? Math.max(35, Math.min(96, overall + ((i % 5) - 2) * 6)) : 0,
      justification: applicable
        ? `Consistent evidence of ${c.label.toLowerCase()} across the interview.`
        : 'Not assessed in this interview format.',
      applicable,
    };
  });
  const rec =
    overall >= 82
      ? HiringRecommendation.STRONG_HIRE
      : overall >= 70
        ? HiringRecommendation.HIRE
        : HiringRecommendation.LEAN_HIRE;

  return {
    interviewId,
    interviewType,
    targetRole,
    overallScore: overall,
    categories,
    hiring: {
      recommendation: rec,
      confidence: 74,
      reasoning:
        'Communicates clearly and reasons about trade-offs. Depth is solid, with room to sharpen edge-case handling under pressure.',
      supportingEvidence: ['Structured answers with concrete examples', 'Owned outcomes end-to-end'],
      concerns: ['Occasionally light on quantitative detail'],
      suggestedNextRound: 'A focused deep-dive on the weakest topic area.',
    },
    highlights: {
      strengths: ['Clear communication', 'Strong ownership', 'Good trade-off reasoning'],
      improvementAreas: ['Edge cases', 'Quantifying impact'],
      bestAnswer: 'Walked through a caching strategy with clear justification and measured results.',
      weakestAnswer: 'Hesitated when pushed on failure modes.',
      mostImpressiveMoment: 'Proactively surfaced a scaling bottleneck before being asked.',
      missedOpportunity: 'Did not fully explore consistency trade-offs.',
    },
    learningPlan: [
      {
        weakness: 'Edge cases (58/100)',
        steps: [
          { title: 'Edge-case drills', detail: 'Enumerate failure modes for 5 past designs.' },
          { title: 'Write tests first', detail: 'List edge cases before implementing.' },
        ],
      },
    ],
    timeline: [
      {
        atMs: 0,
        question: 'Tell me about a system you designed for scale.',
        candidateSummary: 'Described a sharded, cached read path with measured latency wins.',
        reason: 'Strong answer — moving to trade-offs.',
        difficulty: 3,
        coveredTopic: 'Scalability',
      },
    ],
    summary:
      'A capable candidate: clear communicator, strong ownership, sound trade-off reasoning. Tighten edge-case rigor and quantification.',
    durationSec: 1500,
    generatedAt: new Date().toISOString(),
  };
}

async function createReady(userId: string): Promise<void> {
  await prisma.interview.create({
    data: {
      userId,
      interviewType: 'BEHAVIORAL',
      interviewerPersonality: 'FRIENDLY_MENTOR',
      targetRole: 'Engineering Manager',
      difficulty: 3,
      baseDifficulty: 3,
      durationMinutes: 30,
      focusSkills: ['leadership', 'conflict resolution'],
      status: InterviewStatus.CREATED,
      state: { create: buildInitialStateData('BEHAVIORAL', ['leadership', 'conflict resolution']) },
      timeline: { create: { type: 'INTERVIEW_CREATED', atMs: 0, label: 'Interview created' } },
    },
  });
}

async function createEvaluated(
  userId: string,
  interviewType: InterviewType,
  overall: number,
  daysAgo: number,
): Promise<void> {
  const completedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const targetRole = 'Senior Backend Engineer';
  const topics = requiredTopicsFor(interviewType, ['distributed systems']).map((t) => t.label);

  const interview = await prisma.interview.create({
    data: {
      userId,
      interviewType,
      interviewerPersonality: 'NEUTRAL_PROFESSIONAL',
      targetRole,
      difficulty: 4,
      baseDifficulty: 3,
      durationMinutes: 30,
      focusSkills: ['distributed systems'],
      status: InterviewStatus.COMPLETED,
      startedAt: new Date(completedAt.getTime() - 1_500_000),
      completedAt,
      durationSec: 1500,
      state: {
        create: {
          ...buildInitialStateData(interviewType, ['distributed systems']),
          currentStage: InterviewStage.COMPLETED,
          coveredTopics: topics.slice(0, 4),
          remainingTopics: topics.slice(4),
          interviewProgress: 100,
          technicalAccuracy: overall,
          communicationScore: overall - 4,
        },
      },
      messages: {
        create: [
          { speaker: Speaker.INTERVIEWER, content: 'Tell me about a system you designed for scale.', atMs: 0 },
          { speaker: Speaker.CANDIDATE, content: 'I designed a sharded, cached read path and measured a big latency win.', atMs: 1 },
        ],
      },
    },
  });

  const report = buildReport(interview.id, interviewType, targetRole, overall);
  await prisma.evaluation.create({
    data: {
      interviewId: interview.id,
      overallScore: overall,
      recommendation: report.hiring.recommendation,
      report: report as unknown as Prisma.InputJsonValue,
      generatedAt: completedAt,
    },
  });
}

/** Create the demo account with a populated dashboard, only if it's missing. */
export async function ensureDemoAccount(): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existing) return;

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const user = await prisma.user.create({
    data: { email: DEMO_EMAIL, fullName: 'Demo Candidate', passwordHash },
  });
  await prisma.profile.create({
    data: {
      userId: user.id,
      targetRole: 'Senior Backend Engineer',
      experienceLevel: 'SENIOR',
      yearsExperience: 6,
      preferredType: 'SYSTEM_DESIGN',
      focusSkills: ['distributed systems', 'postgres', 'caching'],
      careerGoal: 'Reach a staff-level role at a product company.',
    },
  });
  await createReady(user.id);
  await createEvaluated(user.id, 'SYSTEM_DESIGN', 72, 6);
  await createEvaluated(user.id, 'CODING', 81, 1);

  logger.info('Demo account seeded', { email: DEMO_EMAIL });
}
