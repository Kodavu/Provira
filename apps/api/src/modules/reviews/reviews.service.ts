import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import type { ReviewDirection } from "@tally/db";

// Reports needed before a review is auto-hidden pending moderation.
const REPORT_HIDE_THRESHOLD = 3;

interface CreateReviewInput {
  assignmentId: string;
  authorUserId: string;
  rating: number;
  communication?: number | null;
  professionalism?: number | null;
  paymentSpeed?: number | null;
  quality?: number | null;
  comment?: string | null;
}

/**
 * Two-way reviews. A review is authorized only by a COMPLETED (attendance-
 * confirmed) assignment, and there is at most one per side per assignment — so
 * reputation can't be fabricated without a real, paid transaction.
 */
@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationService,
  ) {}

  /** Resolve the worker-user, employer-user and completion state of an assignment. */
  private async parties(assignmentId: string) {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        worker: { include: { user: { select: { id: true, fullName: true } } } },
        job: { include: { employer: { include: { user: { select: { id: true, fullName: true } } } } } },
        attendance: { select: { status: true } },
      },
    });
    if (!assignment) throw new NotFoundException("Assignment not found");
    return {
      assignment,
      workerUserId: assignment.worker.user.id,
      employerUserId: assignment.job.employer.user.id,
      completed: assignment.status === "CONFIRMED" || assignment.attendance?.status === "CONFIRMED",
    };
  }

  /** Can this user review on this assignment, and have they already? */
  async eligibility(assignmentId: string, authorUserId: string) {
    const { assignment, workerUserId, employerUserId, completed } = await this.parties(assignmentId);

    let direction: ReviewDirection | null = null;
    if (authorUserId === workerUserId) direction = "WORKER_ON_EMPLOYER";
    else if (authorUserId === employerUserId) direction = "EMPLOYER_ON_WORKER";

    if (!direction) {
      return { canReview: false, direction: null, reason: "not_a_party", existing: null };
    }
    if (!completed) {
      return { canReview: false, direction, reason: "not_completed", existing: null };
    }

    const existing = await this.prisma.review.findUnique({
      where: { assignmentId_direction: { assignmentId, direction } },
    });
    return {
      canReview: !existing,
      direction,
      reason: existing ? "already_reviewed" : null,
      existing: existing ? await this.hydrate(existing, assignment.job.title) : null,
    };
  }

  /** Submit a review. Enforces completion + one-per-side, derives subject/direction. */
  async create(input: CreateReviewInput) {
    if (input.rating < 1 || input.rating > 5) throw new BadRequestException("Rating must be 1–5");
    const { assignment, workerUserId, employerUserId, completed } = await this.parties(input.assignmentId);
    if (!completed) throw new BadRequestException("You can only review after the job is completed");

    let direction: ReviewDirection;
    let subjectId: string;
    if (input.authorUserId === workerUserId) {
      direction = "WORKER_ON_EMPLOYER";
      subjectId = employerUserId;
    } else if (input.authorUserId === employerUserId) {
      direction = "EMPLOYER_ON_WORKER";
      subjectId = workerUserId;
    } else {
      throw new ForbiddenException("Only the worker or employer on this job can review");
    }

    const dup = await this.prisma.review.findUnique({
      where: { assignmentId_direction: { assignmentId: input.assignmentId, direction } },
    });
    if (dup) throw new BadRequestException("You've already reviewed this job");

    const review = await this.prisma.review.create({
      data: {
        jobId: assignment.jobId,
        assignmentId: input.assignmentId,
        direction,
        authorId: input.authorUserId,
        subjectId,
        rating: input.rating,
        communication: input.communication ?? null,
        professionalism: input.professionalism ?? null,
        paymentSpeed: direction === "WORKER_ON_EMPLOYER" ? input.paymentSpeed ?? null : null,
        quality: direction === "EMPLOYER_ON_WORKER" ? input.quality ?? null : null,
        comment: input.comment?.trim() || null,
      },
    });

    await this.notifications.notify(subjectId, "review.received", {
      stars: "★".repeat(input.rating),
      job: assignment.job.title,
    });

    return this.hydrate(review, assignment.job.title);
  }

  /** Mark a review helpful (idempotent per user); returns the new helpful count. */
  async markHelpful(reviewId: string, userId: string) {
    await this.prisma.reviewHelpful.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId },
      update: {},
    });
    const helpfulCount = await this.prisma.reviewHelpful.count({ where: { reviewId } });
    await this.prisma.review.update({ where: { id: reviewId }, data: { helpfulCount } });
    return { helpfulCount };
  }

  /** Report a review; auto-hide once enough distinct users have flagged it. */
  async report(reviewId: string, userId: string, reason?: string) {
    await this.prisma.reviewReport.upsert({
      where: { reviewId_userId: { reviewId, userId } },
      create: { reviewId, userId, reason: reason ?? null },
      update: { reason: reason ?? null },
    });
    const reportedCount = await this.prisma.reviewReport.count({ where: { reviewId } });
    await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        reportedCount,
        hiddenAt: reportedCount >= REPORT_HIDE_THRESHOLD ? new Date() : undefined,
      },
    });
    return { reported: true };
  }

  /** Public, visible reviews for a user (as subject), newest first. */
  async listForUser(subjectUserId: string, take = 50) {
    const reviews = await this.prisma.review.findMany({
      where: { subjectId: subjectUserId, hiddenAt: null },
      orderBy: { createdAt: "desc" },
      take,
    });
    const jobTitles = await this.jobTitleMap(reviews.map((r) => r.jobId));
    return Promise.all(reviews.map((r) => this.hydrate(r, jobTitles.get(r.jobId) ?? null)));
  }

  /** Star-average + per-star breakdown for a user (as subject). */
  async ratingSummary(subjectUserId: string) {
    const rows = await this.prisma.review.findMany({
      where: { subjectId: subjectUserId, hiddenAt: null },
      select: { rating: true },
    });
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>;
    let sum = 0;
    for (const r of rows) {
      breakdown[r.rating] = (breakdown[r.rating] ?? 0) + 1;
      sum += r.rating;
    }
    return {
      average: rows.length ? Math.round((sum / rows.length) * 10) / 10 : 0,
      count: rows.length,
      breakdown,
    };
  }

  private async jobTitleMap(jobIds: string[]) {
    const jobs = await this.prisma.job.findMany({
      where: { id: { in: [...new Set(jobIds)] } },
      select: { id: true, title: true },
    });
    return new Map(jobs.map((j) => [j.id, j.title]));
  }

  /** Attach author identity + job title to a raw review row. */
  private async hydrate(review: { id: string; direction: ReviewDirection; rating: number; communication: number | null; professionalism: number | null; paymentSpeed: number | null; quality: number | null; comment: string | null; authorId: string; helpfulCount: number; createdAt: Date }, jobTitle: string | null) {
    const author = await this.prisma.user.findUnique({
      where: { id: review.authorId },
      select: { fullName: true, avatarUrl: true, employerProfile: { select: { businessName: true } } },
    });
    const authorName =
      review.direction === "WORKER_ON_EMPLOYER"
        ? author?.employerProfile?.businessName ?? author?.fullName ?? "Employer"
        : author?.fullName ?? "Worker";
    return {
      id: review.id,
      direction: review.direction,
      rating: review.rating,
      dimensions: {
        communication: review.communication,
        professionalism: review.professionalism,
        paymentSpeed: review.paymentSpeed,
        quality: review.quality,
      },
      comment: review.comment,
      authorName,
      authorAvatarUrl: author?.avatarUrl ?? null,
      jobTitle,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
    };
  }
}
