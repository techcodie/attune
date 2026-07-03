import type {
  CreateInterviewInput,
  DashboardStats,
  InterviewDetailDto,
  InterviewDto,
} from '@cadence/types';
import { InterviewStatus, TimelineEventType } from '@cadence/types';
import { AppError } from '../../lib/http.js';
import { logger } from '../../lib/logger.js';
import { computeCoverage } from '../coverage/coverage.engine.js';
import { reportService } from '../evaluation/report.service.js';
import { buildInitialStateData, toStateDto } from '../interviewState/interviewState.service.js';
import { toTimelineDto } from '../timeline/timeline.repository.js';
import { toInterviewDto } from './interview.mapper.js';
import { interviewRepository, type InterviewWithRelations } from './interview.repository.js';

/** Assemble the full detail view from a persisted interview + relations. */
function buildDetail(row: InterviewWithRelations): InterviewDetailDto {
  if (!row.state) {
    // Invariant: every interview is created with its state in the same write.
    throw new AppError(500, 'STATE_MISSING', 'Interview is missing its state');
  }

  const state = toStateDto(row.state);
  const requiredLabels = [...state.coveredTopics, ...state.remainingTopics];
  const coverage = computeCoverage(row.interviewType, requiredLabels, state.coveredTopics);

  return {
    interview: toInterviewDto(row),
    state,
    coverage,
    timeline: [...row.timeline]
      .sort((a, b) => a.atMs - b.atMs || a.createdAt.getTime() - b.createdAt.getTime())
      .map(toTimelineDto),
  };
}

export const interviewService = {
  /** Create an interview with a fully initialized, coverage-seeded state. */
  async create(userId: string, input: CreateInterviewInput): Promise<InterviewDetailDto> {
    const stateData = buildInitialStateData(input.interviewType, input.focusSkills);

    const row = await interviewRepository.create(userId, input, stateData, {
      type: TimelineEventType.INTERVIEW_CREATED,
      atMs: 0,
      label: 'Interview created',
      data: {
        interviewType: input.interviewType,
        difficulty: input.difficulty,
        durationMinutes: input.durationMinutes,
      },
    });

    logger.info('Interview created', { userId, interviewId: row.id, type: input.interviewType });
    return buildDetail(row);
  },

  async getDetail(userId: string, id: string): Promise<InterviewDetailDto> {
    const row = await interviewRepository.findDetailForUser(userId, id);
    if (!row) throw AppError.notFound('Interview not found');
    return buildDetail(row);
  },

  async list(userId: string): Promise<InterviewDto[]> {
    const rows = await interviewRepository.listForUser(userId);
    return rows.map(toInterviewDto);
  },

  /** Coverage report for one interview — the Coverage Engine over live state. */
  async getCoverage(userId: string, id: string) {
    const detail = await this.getDetail(userId, id);
    return detail.coverage;
  },

  async getDashboard(userId: string): Promise<DashboardStats> {
    const [totalCount, completedCount, totalPracticeSec, latest, active, metrics] =
      await Promise.all([
        interviewRepository.countForUser(userId),
        interviewRepository.countForUserByStatus(userId, InterviewStatus.COMPLETED),
        interviewRepository.totalPracticeSec(userId),
        interviewRepository.findLatestForUser(userId),
        interviewRepository.findActiveForUser(userId),
        reportService.dashboardMetrics(userId),
      ]);

    return {
      totalCount,
      completedCount,
      averageScore: metrics.averageScore,
      totalPracticeSec,
      lastInterview: latest ? toInterviewDto(latest) : null,
      activeInterview: active ? toInterviewDto(active) : null,
      completionRate: totalCount ? Math.round((completedCount / totalCount) * 100) : 0,
      scoreTrend: metrics.scoreTrend,
      durationHistory: metrics.durationHistory,
      skillsRadar: metrics.skillsRadar,
      lastRecommendation: metrics.lastRecommendation,
      recentImprovement: metrics.recentImprovement,
    };
  },
};
