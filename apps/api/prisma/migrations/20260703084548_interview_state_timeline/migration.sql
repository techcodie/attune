-- CreateEnum
CREATE TYPE "InterviewerPersonality" AS ENUM ('FRIENDLY_MENTOR', 'NEUTRAL_PROFESSIONAL', 'SKEPTICAL_STAFF_ENGINEER', 'FAANG_BAR_RAISER');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "InterviewStage" AS ENUM ('INTRODUCTION', 'WARMUP', 'CORE', 'DEEP_DIVE', 'CHALLENGE', 'WRAP_UP', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TimelineEventType" AS ENUM ('INTERVIEW_CREATED', 'INTERVIEW_STARTED', 'STAGE_CHANGED', 'QUESTION_ASKED', 'ANSWER_RECEIVED', 'FOLLOW_UP_ASKED', 'DIFFICULTY_CHANGED', 'EVALUATION_RECORDED', 'INTERVIEW_COMPLETED', 'NOTE');

-- CreateTable
CREATE TABLE "interviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interviewType" "InterviewType" NOT NULL,
    "interviewerPersonality" "InterviewerPersonality" NOT NULL,
    "targetRole" TEXT NOT NULL,
    "difficulty" INTEGER NOT NULL DEFAULT 3,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "focusSkills" TEXT[],
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "voicePreference" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'CREATED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "durationSec" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interview_states" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "currentStage" "InterviewStage" NOT NULL DEFAULT 'INTRODUCTION',
    "currentObjective" TEXT NOT NULL,
    "conversationSummary" TEXT NOT NULL DEFAULT '',
    "coveredTopics" TEXT[],
    "remainingTopics" TEXT[],
    "strongAreas" TEXT[],
    "weakAreas" TEXT[],
    "confidenceTrend" DOUBLE PRECISION[],
    "technicalAccuracy" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "communicationScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "behavioralSignals" JSONB NOT NULL DEFAULT '[]',
    "leadershipSignals" JSONB NOT NULL DEFAULT '[]',
    "curiositySignals" JSONB NOT NULL DEFAULT '[]',
    "ownershipSignals" JSONB NOT NULL DEFAULT '[]',
    "followUpHistory" JSONB NOT NULL DEFAULT '[]',
    "scoreHistory" JSONB NOT NULL DEFAULT '[]',
    "interviewProgress" INTEGER NOT NULL DEFAULT 0,
    "elapsedTimeMs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "type" "TimelineEventType" NOT NULL,
    "atMs" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "interviews_userId_idx" ON "interviews"("userId");

-- CreateIndex
CREATE INDEX "interviews_userId_status_idx" ON "interviews"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "interview_states_interviewId_key" ON "interview_states"("interviewId");

-- CreateIndex
CREATE INDEX "timeline_events_interviewId_idx" ON "timeline_events"("interviewId");

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview_states" ADD CONSTRAINT "interview_states_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
