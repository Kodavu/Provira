import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { ReviewsService } from "../reviews/reviews.service.js";
import { zWorkerPublicProfile, zEmployerPublicProfile, type TrustBadge } from "@provira/contracts";

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

const minutesBetween = (a: Date | null, b: Date | null): number | null =>
  a && b ? Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000)) : null;

/**
 * Assembles the public-facing worker and employer profiles that power the trust
 * layer — identity, verifiable stats, work/job history, reviews and derived
 * trust badges. Everything here is read-only aggregation over existing records;
 * no stat is self-reported.
 */
@Injectable()
export class ProfilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly reviews: ReviewsService,
  ) {}

  async workerProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        scoreProfile: true,
        workerProfile: {
          include: { location: true, skills: { include: { skill: true } } },
        },
      },
    });
    if (!user?.workerProfile) throw new NotFoundException("Worker profile not found");
    const wp = user.workerProfile;
    const sp = user.scoreProfile;

    const assignments = await this.prisma.jobAssignment.findMany({
      where: { workerId: wp.id },
      include: {
        attendance: { select: { status: true, confirmedAt: true } },
        job: { include: { employer: { select: { userId: true, businessName: true } }, skills: { include: { skill: true } } } },
      },
    });
    const confirmed = assignments.filter((a) => a.status === "CONFIRMED" || a.attendance?.status === "CONFIRMED");
    const acceptedOrMore = assignments.filter((a) => a.acceptedAt || a.status === "CONFIRMED");

    // Response time: invite -> accept, in minutes (median).
    const responseMinutes = median(
      assignments.map((a) => minutesBetween(a.invitedAt, a.acceptedAt)).filter((n): n is number => n != null),
    );

    // Repeat-hire rate: share of employers who hired this worker more than once.
    const byEmployer = new Map<string, number>();
    for (const a of confirmed) byEmployer.set(a.job.employer.userId, (byEmployer.get(a.job.employer.userId) ?? 0) + 1);
    const repeatHireRate = byEmployer.size
      ? [...byEmployer.values()].filter((n) => n > 1).length / byEmployer.size
      : 0;

    // Earnings: worker's per-person share of every confirmed job.
    const totalEarnings = confirmed.reduce(
      (sum, a) => sum + a.job.payAmount / BigInt(Math.max(1, a.job.headcount)),
      0n,
    );

    // Reviews received (as subject) + the per-assignment rating for work history.
    const [reviews, rating] = await Promise.all([
      this.reviews.listForUser(userId),
      this.reviews.ratingSummary(userId),
    ]);
    const reviewByAssignment = new Map<string, { rating: number; comment: string | null }>();
    const empReviews = await this.prisma.review.findMany({
      where: { subjectId: userId, direction: "EMPLOYER_ON_WORKER", hiddenAt: null },
      select: { assignmentId: true, rating: true, comment: true },
    });
    for (const r of empReviews) reviewByAssignment.set(r.assignmentId, { rating: r.rating, comment: r.comment });

    const [portfolio, certifications] = await Promise.all([
      this.prisma.portfolioItem.findMany({ where: { workerProfileId: wp.id }, orderBy: { createdAt: "desc" } }),
      this.prisma.certification.findMany({ where: { workerProfileId: wp.id }, orderBy: { createdAt: "desc" } }),
    ]);

    const badges = this.workerBadges({
      kycLevel: user.kycLevel,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      paymentVerified: !!user.payoutAccountNumber,
      avgRating: rating.average,
      ratingCount: rating.count,
      jobsCompleted: sp?.jobsCompleted ?? confirmed.length,
      tier: sp?.tier ?? "BUILDING",
      responseMinutes,
    });

    return zWorkerPublicProfile.parse({
      userId,
      fullName: user.fullName ?? "Worker",
      avatarUrl: user.avatarUrl,
      headline: wp.headline,
      bio: wp.bio,
      location: wp.location?.label ?? null,
      languages: wp.languages,
      skills: wp.skills.map((s) => s.skill.name),
      memberSince: user.createdAt,
      lastActive: user.lastActiveAt,
      kycVerified: user.kycLevel !== "NONE",
      badges,
      stats: {
        jobsCompleted: sp?.jobsCompleted ?? confirmed.length,
        completionRate: acceptedOrMore.length ? confirmed.length / acceptedOrMore.length : 0,
        successScore: sp?.score ?? 0,
        tier: sp?.tier ?? "BUILDING",
        onTimeRate: sp?.onTimeRate ?? 0,
        responseMinutes,
        repeatHireRate,
        totalEarnings: totalEarnings.toString(),
      },
      rating,
      workHistory: confirmed
        .sort((a, b) => (b.attendance?.confirmedAt?.getTime() ?? 0) - (a.attendance?.confirmedAt?.getTime() ?? 0))
        .map((a) => {
          const rev = reviewByAssignment.get(a.id);
          return {
            jobTitle: a.job.title,
            employerName: a.job.employer.businessName ?? null,
            category: a.job.skills[0]?.skill.name ?? null,
            completedAt: a.attendance?.confirmedAt ?? null,
            rating: rev?.rating ?? null,
            feedback: rev?.comment ?? null,
          };
        }),
      reviews,
      portfolio: portfolio.map((p) => ({
        id: p.id, kind: p.kind, title: p.title, description: p.description, url: p.url, thumbnailUrl: p.thumbnailUrl,
      })),
      certifications: certifications.map((c) => ({
        id: c.id, source: c.source, title: c.title, issuer: c.issuer, url: c.url, verified: !!c.verifiedAt,
      })),
    });
  }

  async employerProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: { include: { location: true } } },
    });
    if (!user?.employerProfile) throw new NotFoundException("Employer profile not found");
    const ep = user.employerProfile;

    const jobs = await this.prisma.job.findMany({
      where: { employerId: ep.id },
      include: {
        skills: { include: { skill: true } },
        assignments: { include: { attendance: { select: { status: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    const published = jobs.filter((j) => j.status !== "DRAFT");

    let applications = 0;
    let accepted = 0;
    let totalPaid = 0n;
    const responseTimes: number[] = [];
    const workerConfirmCounts = new Map<string, number>();

    for (const j of jobs) {
      const perPerson = j.payAmount / BigInt(Math.max(1, j.headcount));
      for (const a of j.assignments) {
        if (a.appliedAt) applications += 1;
        if (a.acceptedAt || a.status === "CONFIRMED") accepted += 1;
        if (a.appliedAt && a.acceptedAt) {
          const m = minutesBetween(a.appliedAt, a.acceptedAt);
          if (m != null) responseTimes.push(m);
        }
        if (a.status === "CONFIRMED" || a.attendance?.status === "CONFIRMED") {
          totalPaid += perPerson;
          workerConfirmCounts.set(a.workerId, (workerConfirmCounts.get(a.workerId) ?? 0) + 1);
        }
      }
    }

    const [reviews, rating] = await Promise.all([
      this.reviews.listForUser(userId),
      this.reviews.ratingSummary(userId),
    ]);

    const jobsCompleted = jobs.filter((j) => j.status === "COMPLETED").length;
    const avgResponseMinutes = median(responseTimes);
    const repeatWorkers = [...workerConfirmCounts.values()].filter((n) => n > 1).length;

    const badges = this.employerBadges({
      companyVerified: !!ep.verifiedAt,
      emailVerified: !!user.emailVerifiedAt,
      phoneVerified: !!user.phoneVerifiedAt,
      paymentVerified: totalPaid > 0n,
      avgRating: rating.average,
      ratingCount: rating.count,
      jobsCompleted,
      repeatWorkers,
      jobsPosted: published.length,
    });

    return zEmployerPublicProfile.parse({
      userId,
      companyName: ep.businessName ?? user.fullName ?? "Employer",
      logoUrl: ep.logoUrl,
      industry: ep.industry,
      companySize: ep.companySize,
      websiteUrl: ep.websiteUrl,
      about: ep.about,
      location: ep.location?.label ?? null,
      memberSince: user.createdAt,
      verified: !!ep.verifiedAt,
      badges,
      stats: {
        jobsPosted: published.length,
        jobsCompleted,
        hireRate: applications ? accepted / applications : 0,
        avgResponseMinutes,
        totalPaid: totalPaid.toString(),
        repeatWorkers,
      },
      rating,
      jobHistory: published.map((j) => ({
        title: j.title,
        status: j.status,
        filled: j.assignments.filter((a) => a.acceptedAt || a.status === "CONFIRMED").length,
        headcount: j.headcount,
        postedAt: j.createdAt,
        category: j.skills[0]?.skill.name ?? null,
      })),
    });
  }

  private workerBadges(x: {
    kycLevel: string; emailVerified: boolean; phoneVerified: boolean; paymentVerified: boolean;
    avgRating: number; ratingCount: number; jobsCompleted: number; tier: string; responseMinutes: number | null;
  }): TrustBadge[] {
    const b: TrustBadge[] = [];
    if (x.kycLevel === "BVN_VERIFIED" || x.kycLevel === "FULL") b.push("GOV_ID_VERIFIED");
    else if (x.kycLevel !== "NONE") b.push("IDENTITY_VERIFIED");
    if (x.emailVerified) b.push("EMAIL_VERIFIED");
    if (x.phoneVerified) b.push("PHONE_VERIFIED");
    if (x.paymentVerified) b.push("PAYMENT_VERIFIED");
    if (x.avgRating >= 4.8 && x.ratingCount >= 5) b.push("TOP_RATED");
    if (x.jobsCompleted >= 1 && x.jobsCompleted <= 5 && (x.avgRating >= 4.5 || x.tier === "EMERGING")) b.push("RISING_TALENT");
    if (x.responseMinutes != null && x.responseMinutes <= 60) b.push("FAST_RESPONDER");
    return b;
  }

  private employerBadges(x: {
    companyVerified: boolean; emailVerified: boolean; phoneVerified: boolean; paymentVerified: boolean;
    avgRating: number; ratingCount: number; jobsCompleted: number; repeatWorkers: number; jobsPosted: number;
  }): TrustBadge[] {
    const b: TrustBadge[] = [];
    if (x.companyVerified) b.push("COMPANY_VERIFIED");
    if (x.emailVerified) b.push("EMAIL_VERIFIED");
    if (x.phoneVerified) b.push("PHONE_VERIFIED");
    if (x.paymentVerified) b.push("PAYMENT_VERIFIED");
    if (x.jobsCompleted >= 5 && x.avgRating >= 4.5 && x.ratingCount >= 3) b.push("TRUSTED_EMPLOYER");
    if (x.repeatWorkers >= 3 || x.jobsPosted >= 10) b.push("LONG_TERM_CLIENT");
    return b;
  }
}
