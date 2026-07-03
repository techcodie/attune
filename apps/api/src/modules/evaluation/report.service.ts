import { Prisma } from '@prisma/client';
import {
  InterviewStatus,
  type Difficulty,
  type DurationPoint,
  type EvaluationReport,
  type HiringRecommendation,
  type RadarPoint,
  type ScoreTrendPoint,
} from '@cadence/types';
import { AppError } from '../../lib/http.js';
import { logger } from '../../lib/logger.js';
import type { InterviewConfigContext, ConversationTurn } from '../../providers/llm/types.js';
import { interviewRepository } from '../interview/interview.repository.js';
import { profileRepository } from '../profile/profile.repository.js';
import { messageRepository } from '../conversation/message.repository.js';
import { noteRepository } from '../conversation/note.repository.js';
import { toStateDto } from '../interviewState/interviewState.service.js';
import { evaluationRepository } from './evaluation.repository.js';
import { evaluationService } from './evaluation.service.js';
import { learningPlanService } from './learningPlan.service.js';
import { buildReportTimeline } from './timeline.service.js';

/**
 * ReportService — the orchestrator of the evaluation pipeline. It assembles the
 * assessment, timeline and learning plan into one report, computes the overall
 * score, and persists it ONCE. Reads return the stored report; the report is
 * never regenerated on the dashboard or on refresh.
 */
export const reportService = {
  async getOrGenerate(userId: string, interviewId: string): Promise<EvaluationReport> {
    const existing = await evaluationRepository.findByInterviewId(interviewId);
    if (existing) return existing.report as unknown as EvaluationReport;

    const detail = await interviewRepository.findDetailForUser(userId, interviewId);
    if (!detail || !detail.state) throw AppError.notFound('Interview not found');
    if (detail.status !== InterviewStatus.COMPLETED) {
      throw AppError.badRequest('The interview must be completed before a report can be generated');
    }

    const profile = await profileRepository.findByUserId(userId);
    const [messages, notes] = await Promise.all([
      messageRepository.listAll(interviewId),
      noteRepository.listForInterview(interviewId),
    ]);

    const state = toStateDto(detail.state);
    const durationSec = detail.durationSec ?? Math.round(state.elapsedTimeMs / 1000);
    const config: InterviewConfigContext = {
      interviewType: detail.interviewType,
      personality: detail.interviewerPersonality,
      targetRole: detail.targetRole,
      seniority: profile?.experienceLevel ?? 'MID',
      difficulty: detail.difficulty as Difficulty,
      focusSkills: detail.focusSkills,
    };
    const transcript: ConversationTurn[] = messages.map((m) => ({ speaker: m.speaker, text: m.content }));

    const { assessment, overallScore } = await evaluationService.assess({
      config,
      state,
      transcript,
      aiNotes: notes.map((n) => n.content),
      durationSec,
    });

    const report: EvaluationReport = {
      interviewId,
      interviewType: detail.interviewType,
      targetRole: detail.targetRole,
      overallScore,
      categories: assessment.categories,
      hiring: assessment.hiring,
      highlights: assessment.highlights,
      learningPlan: learningPlanService.build(assessment.categories),
      timeline: buildReportTimeline(messages, notes),
      summary: assessment.summary,
      durationSec,
      generatedAt: new Date().toISOString(),
    };

    try {
      await evaluationRepository.create({
        interviewId,
        overallScore,
        recommendation: assessment.hiring.recommendation,
        report: report as unknown as Prisma.InputJsonValue,
      });
      logger.info('Evaluation generated', { interviewId, overallScore });
    } catch (err) {
      // Unique violation → another request generated it first; return that one.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const raced = await evaluationRepository.findByInterviewId(interviewId);
        if (raced) return raced.report as unknown as EvaluationReport;
      }
      throw err;
    }

    return report;
  },

  /** Evaluation-derived metrics for the dashboard, from persisted reports only. */
  async dashboardMetrics(userId: string): Promise<{
    averageScore: number | null;
    scoreTrend: ScoreTrendPoint[];
    durationHistory: DurationPoint[];
    skillsRadar: RadarPoint[];
    lastRecommendation: HiringRecommendation | null;
    recentImprovement: number | null;
  }> {
    const evals = await evaluationRepository.listForUser(userId);
    if (evals.length === 0) {
      return {
        averageScore: null,
        scoreTrend: [],
        durationHistory: [],
        skillsRadar: [],
        lastRecommendation: null,
        recentImprovement: null,
      };
    }

    const scoreTrend: ScoreTrendPoint[] = evals.map((e, i) => ({
      interviewId: e.interviewId,
      label: `#${i + 1}`,
      score: e.overallScore,
      date: (e.interview.completedAt ?? e.generatedAt).toISOString(),
    }));

    const durationHistory: DurationPoint[] = evals.map((e, i) => ({
      label: `#${i + 1}`,
      durationSec: e.interview.durationSec ?? 0,
    }));

    const averageScore = Math.round(
      evals.reduce((a, e) => a + e.overallScore, 0) / evals.length,
    );

    const last = evals[evals.length - 1]!;
    const lastReport = last.report as unknown as EvaluationReport;
    const skillsRadar: RadarPoint[] = lastReport.categories
      .filter((c) => c.applicable)
      .map((c) => ({ label: c.label, score: c.score }));

    const recentImprovement =
      evals.length >= 2 ? last.overallScore - evals[evals.length - 2]!.overallScore : null;

    return {
      averageScore,
      scoreTrend,
      durationHistory,
      skillsRadar,
      lastRecommendation: last.recommendation as HiringRecommendation,
      recentImprovement,
    };
  },
};
