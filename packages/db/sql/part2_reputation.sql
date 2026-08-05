-- Part 2 — reputation & profiles schema (Review, portfolio, certifications,
-- and profile columns). Idempotent: safe to run more than once. Matches the
-- Prisma models exactly (table/column names are case-sensitive, hence quoted).
--
-- Paste this whole block into the Supabase SQL Editor and Run.

BEGIN;

-- ---------------------------------------------------------------------------
-- Enums (CREATE TYPE has no IF NOT EXISTS, so guard each one)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE "ReviewDirection" AS ENUM ('EMPLOYER_ON_WORKER', 'WORKER_ON_EMPLOYER');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "PortfolioKind" AS ENUM ('IMAGE', 'PDF', 'VIDEO', 'LINK');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "CertificationSource" AS ENUM ('UPLOADED', 'PLATFORM_BADGE', 'ASSESSMENT');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ---------------------------------------------------------------------------
-- New profile columns (all nullable / additive)
-- ---------------------------------------------------------------------------
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "lastActiveAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);

ALTER TABLE "WorkerProfile"
  ADD COLUMN IF NOT EXISTS "headline" TEXT;

ALTER TABLE "EmployerProfile"
  ADD COLUMN IF NOT EXISTS "logoUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "industry" TEXT,
  ADD COLUMN IF NOT EXISTS "companySize" TEXT,
  ADD COLUMN IF NOT EXISTS "websiteUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "about" TEXT,
  ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Review" (
  "id" TEXT NOT NULL,
  "jobId" TEXT NOT NULL,
  "assignmentId" TEXT NOT NULL,
  "direction" "ReviewDirection" NOT NULL,
  "authorId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "rating" INTEGER NOT NULL,
  "communication" INTEGER,
  "professionalism" INTEGER,
  "paymentSpeed" INTEGER,
  "quality" INTEGER,
  "comment" TEXT,
  "helpfulCount" INTEGER NOT NULL DEFAULT 0,
  "reportedCount" INTEGER NOT NULL DEFAULT 0,
  "hiddenAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReviewHelpful" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ReviewReport" (
  "id" TEXT NOT NULL,
  "reviewId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "reason" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReviewReport_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PortfolioItem" (
  "id" TEXT NOT NULL,
  "workerProfileId" TEXT NOT NULL,
  "kind" "PortfolioKind" NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Certification" (
  "id" TEXT NOT NULL,
  "workerProfileId" TEXT NOT NULL,
  "source" "CertificationSource" NOT NULL,
  "title" TEXT NOT NULL,
  "issuer" TEXT,
  "url" TEXT,
  "verifiedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS "Review_subjectId_idx" ON "Review"("subjectId");
CREATE INDEX IF NOT EXISTS "Review_authorId_idx" ON "Review"("authorId");
CREATE INDEX IF NOT EXISTS "Review_jobId_idx" ON "Review"("jobId");
CREATE UNIQUE INDEX IF NOT EXISTS "Review_assignmentId_direction_key" ON "Review"("assignmentId", "direction");

CREATE INDEX IF NOT EXISTS "ReviewHelpful_reviewId_idx" ON "ReviewHelpful"("reviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "ReviewHelpful_reviewId_userId_key" ON "ReviewHelpful"("reviewId", "userId");

CREATE INDEX IF NOT EXISTS "ReviewReport_reviewId_idx" ON "ReviewReport"("reviewId");
CREATE UNIQUE INDEX IF NOT EXISTS "ReviewReport_reviewId_userId_key" ON "ReviewReport"("reviewId", "userId");

CREATE INDEX IF NOT EXISTS "PortfolioItem_workerProfileId_idx" ON "PortfolioItem"("workerProfileId");
CREATE INDEX IF NOT EXISTS "Certification_workerProfileId_idx" ON "Certification"("workerProfileId");

COMMIT;
