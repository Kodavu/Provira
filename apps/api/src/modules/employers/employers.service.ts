import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

/**
 * Employer view: the jobs they've posted, each with its escrow funding state,
 * applicant/assignment counts, and money committed vs released. Drives the
 * post-a-job -> fund-escrow -> confirm-pay loop from the employer side.
 */
@Injectable()
export class EmployersService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: { include: { location: true } } },
    });
    if (!user?.employerProfile)
      throw new NotFoundException("Employer profile not found");
    const employerId = user.employerProfile.id;

    const jobs = await this.prisma.job.findMany({
      where: { employerId },
      orderBy: { createdAt: "desc" },
      include: {
        escrow: true,
        location: true,
        skills: { include: { skill: true } },
        assignments: true,
      },
    });

    let committed = 0n; // funded, not yet released
    let released = 0n;
    for (const j of jobs) {
      if (j.escrow?.fundedAt && !j.escrow?.releasedAt) committed += j.escrow.amount;
      if (j.escrow?.releasedAt) released += j.escrow.amount;
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        businessName: user.employerProfile.businessName,
      },
      employerProfileId: employerId,
      stats: {
        activeJobs: jobs.filter((j) =>
          ["OPEN", "FILLED", "IN_PROGRESS"].includes(j.status),
        ).length,
        committed: committed.toString(),
        released: released.toString(),
      },
      jobs: jobs.map((j) => ({
        id: j.id,
        title: j.title,
        status: j.status,
        payAmount: j.payAmount.toString(),
        headcount: j.headcount,
        location: j.location?.label ?? null,
        skills: j.skills.map((s) => s.skill.name),
        applicants: j.assignments.length,
        escrow: j.escrow
          ? {
              amount: j.escrow.amount.toString(),
              funded: !!j.escrow.fundedAt,
              released: !!j.escrow.releasedAt,
            }
          : null,
      })),
    };
  }
}
