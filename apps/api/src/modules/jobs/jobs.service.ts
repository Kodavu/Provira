import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EscrowService } from "../escrow/escrow.service.js";
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
  payAmount: bigint;
  headcount?: number;
  languages?: Language[];
  skillSlugs?: string[];
  locationId?: string;
  startAt?: Date;
  endAt?: Date;
}

@Injectable()
export class JobsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrow: EscrowService,
  ) {}

  async create(input: CreateJobInput) {
    const skills = input.skillSlugs?.length
      ? await this.prisma.skill.findMany({
          where: { slug: { in: input.skillSlugs } },
        })
      : [];

    return this.prisma.job.create({
      data: {
        employerId: input.employerId,
        title: input.title,
        description: input.description,
        payAmount: input.payAmount,
        headcount: input.headcount ?? 1,
        languages: input.languages ?? ["EN"],
        locationId: input.locationId,
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
    return this.prisma.job.update({
      where: { id: jobId },
      data: { status: "OPEN" },
    });
  }

  /** Rank candidate workers for a job and persist assignments with matchScore. */
  async match(jobId: string, limit = 10) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { skills: { include: { skill: true } }, location: true },
    });
    if (!job) throw new NotFoundException("Job not found");

    // Candidate pool: workers with a profile. A production version filters by
    // radius/skills in SQL first; here we rank in-memory for clarity.
    const workers = await this.prisma.workerProfile.findMany({
      include: {
        skills: { include: { skill: true } },
        location: true,
        user: { include: { scoreProfile: true } },
      },
      take: 200,
    });

    const candidates: WorkerCandidate[] = workers.map((w) => ({
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

    // Upsert assignments carrying the match score for transparency.
    for (const r of ranked) {
      await this.prisma.jobAssignment.upsert({
        where: { jobId_workerId: { jobId, workerId: r.workerId } },
        create: { jobId, workerId: r.workerId, matchScore: r.matchScore },
        update: { matchScore: r.matchScore },
      });
    }
    return ranked;
  }

  listOpenNear(_locationId?: string) {
    return this.prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
}
