/**
 * Seed a demo account so a reviewer sees a living product immediately:
 *   • login demo@cadence.app / Demo1234!
 *   • a completed profile
 *   • one interview ready to start
 *   • two evaluated interviews (populating the dashboard trend + radar)
 *
 * Idempotent: safe to run repeatedly.
 */
import { PrismaClient, type Prisma } from '@prisma/client';
import {
  EVALUATION_CATEGORIES,
  HiringRecommendation,
  InterviewStage,
  InterviewStatus,
  Speaker,
  type EvaluationReport,
  type InterviewType,
} from '@cadence/types';
import { hashPassword } from '../src/modules/auth/password.js';
import { buildInitialState } from '../src/modules/interviewState/interviewState.service.js';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@cadence.app';

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
          { title: 'Write tests first', detail: 'Practice listing edge cases before implementing.' },
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
      'A capable candidate for the role: clear communicator, strong ownership, and sound trade-off reasoning. Tighten edge-case rigor and quantification.',
    durationSec: 1500,
    generatedAt: new Date().toISOString(),
  };
}

async function createReady(userId: string): Promise<void> {
  const state = buildInitialState('BEHAVIORAL', ['leadership', 'conflict resolution']);
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
      state: { create: { ...state } },
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
  const base = buildInitialState(interviewType, ['distributed systems']);

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
      startedAt: new Date(completedAt.getTime() - 1500_000),
      completedAt,
      durationSec: 1500,
      state: {
        create: {
          ...base,
          currentStage: InterviewStage.COMPLETED,
          coveredTopics: base.remainingTopics.slice(0, 4),
          remainingTopics: base.remainingTopics.slice(4),
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

async function main(): Promise<void> {
  const passwordHash = await hashPassword('Demo1234!');
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, fullName: 'Demo Candidate', passwordHash },
  });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      targetRole: 'Senior Backend Engineer',
      experienceLevel: 'SENIOR',
      yearsExperience: 6,
      preferredType: 'SYSTEM_DESIGN',
      focusSkills: ['distributed systems', 'postgres', 'caching'],
      careerGoal: 'Reach a staff-level role at a product company.',
    },
  });

  // Reset demo interviews for a clean, idempotent seed.
  await prisma.interview.deleteMany({ where: { userId: user.id } });

  await createReady(user.id);
  await createEvaluated(user.id, 'SYSTEM_DESIGN', 72, 6);
  await createEvaluated(user.id, 'CODING', 81, 1);

  // eslint-disable-next-line no-console
  console.log(`Seeded demo account: ${DEMO_EMAIL} / Demo1234!`);
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
