import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EscrowService } from "../escrow/escrow.service.js";
import { AttendanceService } from "../attendance/attendance.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import {
  rankWorkers,
  DEFAULT_SCORE_CONFIG,
  WorkerCandidate,
} from "@tally/core";
import type { Language } from "@tally/db";

interface CreateJobInput {
  employerId: string;
  title: string;
  description?: string;
  payAmount: bigint; // total (perPerson × headcount)
  headcount?: number;
  languages?: Language[];
  skillSlugs?: string[];
  locationId?: string;
  locationLabel?: string; // address / landmark
  locationState?: string; // e.g. "Lagos"
  locationArea?: string; // LGA, e.g. "Ikeja"
  locationWard?: string; // ward within the LGA
  startAt?: Date;
  endAt?: Date;
}

// Statuses that count against a job's headcount (a worker is "in" the job).
const IN_JOB = ["ACCEPTED", "CONFIRMED"] as const;

function naira(kobo: bigint): string {
  return `₦${(Number(kobo) / 100).toLocaleString("en-NG")}`;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrow: EscrowService,
    private readonly attendance: AttendanceService,
    private readonly notifications: NotificationService,
  ) {}

  async create(input: CreateJobInput) {
    const skills = input.skillSlugs?.length
      ? await this.prisma.skill.findMany({ where: { slug: { in: input.skillSlugs } } })
      : [];

    // Resolve the job's location (address/landmark + area + state) into a
    // Location row, reusing an identical one so "near me" grouping stays tight.
    let locationId = input.locationId;
    const label = input.locationLabel?.trim() || null;
    const state = input.locationState?.trim() || null;
    const lga = input.locationArea?.trim() || null;
    const ward = input.locationWard?.trim() || null;
    if (!locationId && (label || state || lga || ward)) {
      const existing = await this.prisma.location.findFirst({ where: { label, state, lga, ward } });
      locationId = existing?.id ?? (await this.prisma.location.create({ data: { label, state, lga, ward } })).id;
    }

    return this.prisma.job.create({
      data: {
        employerId: input.employerId,
        title: input.title,
        description: input.description,
        payAmount: input.payAmount,
        headcount: input.headcount ?? 1,
        languages: input.languages ?? ["EN"],
        locationId,
        startAt: input.startAt,
        endAt: input.endAt,
        skills: { create: skills.map((s) => ({ skillId: s.id })) },
      },
    });
  }

  /** Publish a job: create its escrow holding account and open it for matching. */
  async publish(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException("Job not found");
    await this.escrow.createForJob(jobId, job.payAmount);
    return this.prisma.job.update({ where: { id: jobId }, data: { status: "OPEN" } });
  }

  /**
   * Fund a job's escrow (employer pays worker pay + platform fee in). Marks the
   * escrow funded and notifies the employer. Funding is what makes a job safe to
   * confirm and pay — escrow.release refuses to pay out an unfunded job.
   */
  async fundEscrow(jobId: string) {
    const result = await this.escrow.fundFromExternal(jobId);
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true, escrow: true },
    });
    if (job?.escrow?.fundedAt) {
      await this.notifications.notify(job.employer.userId, "escrow.funded", {
        amount: naira(job.escrow.amount),
        title: job.title,
      });
    }
    return result;
  }

  /**
   * Cancel a job and refund the UNRELEASED escrow remainder to the employer.
   * Money already released to confirmed workers is never clawed back — only the
   * balance still held in escrow is returned. A fully completed job cannot be
   * cancelled. Safe at every stage: before hiring (full refund), after hiring
   * but before any confirmation (full refund), or partway through (refund of the
   * shares not yet confirmed).
   */
  async cancel(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true, escrow: true },
    });
    if (!job) throw new NotFoundException("Job not found");
    if (job.status === "COMPLETED") throw new BadRequestException("A completed job can't be cancelled");
    if (job.status === "CANCELLED") return job; // idempotent

    let refunded = 0n;
    if (job.escrow?.fundedAt && !job.escrow.releasedAt) {
      const account = await this.prisma.account.findUnique({ where: { id: job.escrow.accountId } });
      refunded = account?.balance ?? 0n;
      await this.escrow.refund(jobId);
    }

    const updated = await this.prisma.job.update({
      where: { id: jobId },
      data: { status: "CANCELLED" },
    });

    if (refunded > 0n) {
      await this.notifications.notify(job.employer.userId, "escrow.refunded", {
        amount: naira(refunded),
        title: job.title,
      });
    }
    return updated;
  }

  private async acceptedCount(jobId: string): Promise<number> {
    return this.prisma.jobAssignment.count({
      where: { jobId, status: { in: [...IN_JOB] } },
    });
  }

  private async assertNotFull(jobId: string, headcount: number) {
    if ((await this.acceptedCount(jobId)) >= headcount)
      throw new BadRequestException("This job is already full");
  }

  /**
   * Suggest qualified workers for a job — ranked, but NOT added to the job.
   * The employer reviews these and sends invites. Workers already linked to the
   * job (invited/applied/in) are excluded.
   */
  async suggest(jobId: string, limit = 12) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { skills: { include: { skill: true } }, location: true, assignments: true },
    });
    if (!job) throw new NotFoundException("Job not found");
    const already = new Set(job.assignments.map((a) => a.workerId));

    const workers = await this.prisma.workerProfile.findMany({
      include: {
        skills: { include: { skill: true } },
        location: true,
        user: { include: { scoreProfile: true } },
      },
      take: 200,
    });

    const byId = new Map(workers.map((w) => [w.id, w]));
    const candidates: WorkerCandidate[] = workers
      .filter((w) => !already.has(w.id))
      .map((w) => ({
        workerId: w.id,
        skillSlugs: w.skills.map((s) => s.skill.slug),
        languages: w.languages,
        lat: w.location?.lat ?? null,
        lng: w.location?.lng ?? null,
        score: w.user.scoreProfile?.score ?? 0,
        scoreMax: DEFAULT_SCORE_CONFIG.max,
      }));

    const ranked = rankWorkers(
      {
        skillSlugs: job.skills.map((s) => s.skill.slug),
        languages: job.languages,
        lat: job.location?.lat ?? null,
        lng: job.location?.lng ?? null,
      },
      candidates,
    ).slice(0, limit);

    return ranked.map((r) => {
      const w = byId.get(r.workerId)!;
      return {
        workerId: r.workerId,
        workerName: w.user.fullName,
        matchScore: r.matchScore,
        skills: w.skills.map((s) => s.skill.name),
        score: w.user.scoreProfile?.score ?? 0,
        tier: w.user.scoreProfile?.tier ?? "BUILDING",
        reasons: r.reasons ?? [],
      };
    });
  }

  /** Employer invites a worker. Creates/updates an INVITED assignment + notifies. */
  async invite(jobId: string, workerId: string) {
    const job = await this.jobOrThrow(jobId);
    await this.assertNotFull(jobId, job.headcount);

    const worker = await this.prisma.workerProfile.findUnique({
      where: { id: workerId },
      include: { user: true },
    });
    if (!worker) throw new NotFoundException("Worker not found");

    const assignment = await this.prisma.jobAssignment.upsert({
      where: { jobId_workerId: { jobId, workerId } },
      create: { jobId, workerId, status: "INVITED", invitedAt: new Date() },
      update: { status: "INVITED", invitedAt: new Date() },
    });

    await this.notifications.notify(worker.userId, "job.invited", {
      title: job.title,
      pay: naira(job.payAmount / BigInt(Math.max(1, job.headcount))),
      employer: job.employer.businessName ?? "An employer",
      jobId,
    });
    return assignment;
  }

  /** A worker applies to a job → APPLIED, awaiting the employer's acceptance. */
  async applyToJob(jobId: string, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    if (!user?.workerProfile) throw new BadRequestException("Only workers can apply to jobs");
    const job = await this.jobOrThrow(jobId);
    await this.assertNotFull(jobId, job.headcount);

    const existing = await this.prisma.jobAssignment.findUnique({
      where: { jobId_workerId: { jobId, workerId: user.workerProfile.id } },
    });
    if (existing && [...IN_JOB].includes(existing.status as (typeof IN_JOB)[number]))
      throw new BadRequestException("You're already in this job");

    const assignment = await this.prisma.jobAssignment.upsert({
      where: { jobId_workerId: { jobId, workerId: user.workerProfile.id } },
      create: { jobId, workerId: user.workerProfile.id, status: "APPLIED", appliedAt: new Date() },
      update: { status: "APPLIED", appliedAt: new Date() },
    });

    await this.notifications.notify(job.employer.userId, "job.application", {
      title: job.title,
      worker: user.fullName ?? "A worker",
      jobId,
    });
    return assignment;
  }

  /** Employer accepts an application → the worker joins the job + gets a code. */
  async acceptApplication(jobId: string, assignmentId: string) {
    const job = await this.jobOrThrow(jobId);
    const assignment = await this.assignmentOrThrow(assignmentId, jobId);
    if (assignment.status !== "APPLIED")
      throw new BadRequestException("This assignment is not a pending application");
    await this.assertNotFull(jobId, job.headcount);
    return this.admit(assignment.id, job, assignment.worker.userId);
  }

  /** Worker accepts an employer's invite → joins the job + gets a code. */
  async acceptInvite(assignmentId: string, userId: string) {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { worker: { include: { user: true } }, job: { include: { employer: true } } },
    });
    if (!assignment) throw new NotFoundException("Invite not found");
    if (assignment.worker.userId !== userId)
      throw new BadRequestException("This invite isn't yours");
    if (assignment.status !== "INVITED")
      throw new BadRequestException("This invite is no longer open");
    await this.assertNotFull(assignment.jobId, assignment.job.headcount);

    const admitted = await this.admit(assignment.id, assignment.job, userId);
    await this.notifications.notify(assignment.job.employer.userId, "job.invite.accepted", {
      title: assignment.job.title,
      worker: assignment.worker.user.fullName ?? "A worker",
      jobId: assignment.jobId,
    });
    return admitted;
  }

  /** Worker declines an invite. */
  async declineInvite(assignmentId: string, userId: string) {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { worker: true },
    });
    if (!assignment) throw new NotFoundException("Invite not found");
    if (assignment.worker.userId !== userId)
      throw new BadRequestException("This invite isn't yours");
    return this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { status: "DECLINED" },
    });
  }

  // Shared "worker joins the job" step: mark ACCEPTED and mint the attendance
  // code. The code is kept for the employer to read out on site — it is never
  // sent to or shown to the worker.
  private async admit(
    assignmentId: string,
    job: { id: string; title: string },
    workerUserId: string,
  ) {
    await this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    });
    await this.attendance.createForAssignment(assignmentId);

    await this.notifications.notify(workerUserId, "job.hired", {
      title: job.title,
      jobId: job.id,
    });
    return this.prisma.jobAssignment.findUnique({ where: { id: assignmentId } });
  }

  /** Full employer-facing job detail: grouped assignments + attendance codes. */
  async detail(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: {
        escrow: true,
        location: true,
        skills: { include: { skill: true } },
        assignments: {
          include: {
            worker: {
              include: {
                location: true,
                skills: { include: { skill: true } },
                user: { include: { scoreProfile: true } },
              },
            },
            attendance: true,
          },
          orderBy: { updatedAt: "desc" },
        },
      },
    });
    if (!job) throw new NotFoundException("Job not found");

    const perPerson = job.payAmount / BigInt(Math.max(1, job.headcount));
    const accepted = job.assignments.filter((a) => IN_JOB.includes(a.status as (typeof IN_JOB)[number])).length;

    // Batch the applicants' review ratings so each card can show a star average.
    const workerUserIds = job.assignments.map((a) => a.worker.user.id);
    const ratingRows = workerUserIds.length
      ? await this.prisma.review.groupBy({
          by: ["subjectId"],
          where: { subjectId: { in: workerUserIds }, direction: "EMPLOYER_ON_WORKER", hiddenAt: null },
          _avg: { rating: true },
          _count: { rating: true },
        })
      : [];
    const ratingByUser = new Map(
      ratingRows.map((r) => [r.subjectId, { avg: Math.round((r._avg.rating ?? 0) * 10) / 10, count: r._count.rating }]),
    );

    const row = (a: (typeof job.assignments)[number]) => {
      const w = a.worker;
      const sp = w.user.scoreProfile;
      const rating = ratingByUser.get(w.user.id) ?? { avg: 0, count: 0 };
      return {
        assignmentId: a.id,
        workerId: a.workerId,
        workerName: w.user.fullName,
        status: a.status,
        matchScore: a.matchScore,
        profile: {
          userId: w.user.id,
          avatarUrl: w.user.avatarUrl,
          bio: w.bio,
          location: w.location?.label ?? null,
          phone: w.user.phone,
          skills: w.skills.map((s) => s.skill.name),
          languages: w.languages,
          score: sp?.score ?? 0,
          tier: sp?.tier ?? "BUILDING",
          jobsCompleted: sp?.jobsCompleted ?? 0,
          onTimeRate: sp?.onTimeRate ?? 0,
          kycVerified: w.user.kycLevel !== "NONE",
          ratingAvg: rating.avg,
          ratingCount: rating.count,
          memberSince: w.user.createdAt,
          lastActive: w.user.lastActiveAt,
        },
        attendance: a.attendance
          ? { status: a.attendance.status, code: a.attendance.code, confirmedAt: a.attendance.confirmedAt }
          : null,
      };
    };

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      status: job.status,
      payAmount: job.payAmount.toString(),
      perPerson: perPerson.toString(),
      headcount: job.headcount,
      accepted,
      filled: accepted >= job.headcount,
      location: job.location?.label ?? null,
      state: job.location?.state ?? null,
      area: job.location?.lga ?? null,
      ward: job.location?.ward ?? null,
      startAt: job.startAt,
      endAt: job.endAt,
      skills: job.skills.map((s) => s.skill.name),
      escrow: job.escrow
        ? { amount: job.escrow.amount.toString(), funded: !!job.escrow.fundedAt, released: !!job.escrow.releasedAt }
        : null,
      inJob: job.assignments.filter((a) => IN_JOB.includes(a.status as (typeof IN_JOB)[number])).map(row),
      applications: job.assignments.filter((a) => a.status === "APPLIED").map(row),
      invites: job.assignments.filter((a) => a.status === "INVITED").map(row),
    };
  }

  /** Worker-facing job search across open jobs. */
  async search(userId?: string, query?: string, skill?: string, feed?: string) {
    const jobs = await this.prisma.job.findMany({
      where: { status: { in: ["OPEN", "FILLED", "IN_PROGRESS"] } },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        location: true,
        employer: true,
        skills: { include: { skill: true } },
        assignments: true,
      },
    });

    // Resolve the worker's context: their profile id, skill slugs, and home
    // state — used both for filtering and for "near you" labelling.
    let workerId: string | null = null;
    let mySkills = new Set<string>();
    let myState: string | null = null;
    let myArea: string | null = null;
    let myWard: string | null = null;
    let preference = "ALL";
    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { workerProfile: { include: { skills: { include: { skill: true } }, location: true } } },
      });
      preference = (user as { jobFeed?: string })?.jobFeed ?? "ALL";
      const wp = user?.workerProfile;
      if (wp) {
        workerId = wp.id;
        mySkills = new Set(wp.skills.map((s) => s.skill.slug));
        myState = wp.location?.state ?? null;
        myArea = wp.location?.lga ?? null;
        myWard = wp.location?.ward ?? null;
      }
    }

    // The active feed: an explicit `feed` param wins; otherwise the worker's
    // saved preference. SKILLS/NEARBY only bite when we have the data for them.
    const activeFeed = (feed || preference || "ALL").toUpperCase();
    const q = query?.trim().toLowerCase();
    const sk = skill?.trim().toLowerCase();

    let items = jobs
      .filter((j) => {
        if (q && !(`${j.title} ${j.description ?? ""}`.toLowerCase().includes(q))) return false;
        if (sk && !j.skills.some((s) => s.skill.slug.toLowerCase() === sk || s.skill.name.toLowerCase().includes(sk)))
          return false;
        if (activeFeed === "SKILLS" && mySkills.size > 0 && !j.skills.some((s) => mySkills.has(s.skill.slug)))
          return false;
        if (activeFeed === "NEARBY" && myState && j.location?.state !== myState) return false;
        return true;
      })
      .map((j) => {
        const accepted = j.assignments.filter((a) => IN_JOB.includes(a.status as (typeof IN_JOB)[number])).length;
        const mine = workerId ? j.assignments.find((a) => a.workerId === workerId) : undefined;
        const sameWard = !!myWard && !!j.location?.ward && j.location.ward === myWard;
        const sameArea = !!myArea && j.location?.lga === myArea;
        const sameState = !!myState && j.location?.state === myState;
        return {
          id: j.id,
          title: j.title,
          description: j.description,
          perPerson: (j.payAmount / BigInt(Math.max(1, j.headcount))).toString(),
          headcount: j.headcount,
          accepted,
          filled: accepted >= j.headcount,
          location: j.location?.label ?? null,
          state: j.location?.state ?? null,
          area: j.location?.lga ?? null,
          ward: j.location?.ward ?? null,
          proximity: sameWard ? "ward" : sameArea ? "area" : sameState ? "state" : null,
          matchesSkills: j.skills.some((s) => mySkills.has(s.skill.slug)),
          startAt: j.startAt,
          endAt: j.endAt,
          skills: j.skills.map((s) => s.skill.name),
          employerName: j.employer.businessName ?? null,
          employerUserId: j.employer.userId,
          myStatus: mine?.status ?? null,
        };
      });

    // In NEARBY, surface same-area jobs first; otherwise keep newest-first.
    if (activeFeed === "NEARBY") {
      const rank = (p: string | null) => (p === "ward" ? 2 : p === "area" ? 1 : 0);
      items = items.sort((a, b) => rank(b.proximity) - rank(a.proximity));
    }

    return { items, feed: activeFeed };
  }

  listOpenNear(_locationId?: string) {
    return this.prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  private async jobOrThrow(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true },
    });
    if (!job) throw new NotFoundException("Job not found");
    return job;
  }

  private async assignmentOrThrow(assignmentId: string, jobId: string) {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
      include: { worker: true },
    });
    if (!assignment || assignment.jobId !== jobId)
      throw new NotFoundException("Assignment not found");
    return assignment;
  }
}
