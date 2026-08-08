import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { zEmployerDashboard, zEmployerProfileEdit } from "@provira/contracts";

/**
 * Employer view: the jobs they've posted, each with its escrow funding state,
 * applicant/assignment counts, and money committed vs released. Drives the
 * post-a-job -> fund-escrow -> confirm-pay loop from the employer side.
 */
@Injectable()
export class EmployersService {
  constructor(private readonly prisma: PrismaService) {}

  /** The employer's editable company profile. Creates the profile if missing. */
  async profile(userId: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: { include: { location: true } } },
    });
    if (!user) throw new NotFoundException("User not found");
    const ep = user.employerProfile;
    return zEmployerProfileEdit.parse({
      businessName: ep?.businessName ?? user.fullName ?? null,
      logoUrl: ep?.logoUrl ?? null,
      industry: ep?.industry ?? null,
      companySize: ep?.companySize ?? null,
      websiteUrl: ep?.websiteUrl ?? null,
      about: ep?.about ?? null,
      location: {
        state: ep?.location?.state ?? null,
        area: ep?.location?.lga ?? null,
        ward: ep?.location?.ward ?? null,
        label: ep?.location?.label ?? null,
      },
    });
  }

  async updateProfile(
    userId: string,
    input: {
      businessName?: string;
      logoUrl?: string;
      industry?: string;
      companySize?: string;
      websiteUrl?: string;
      about?: string;
      state?: string;
      area?: string;
      ward?: string;
      label?: string;
    },
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: true },
    });
    if (!user) throw new NotFoundException("User not found");
    const ep =
      user.employerProfile ??
      (await this.prisma.employerProfile.create({ data: { userId } }));

    // Upsert the company location.
    let locationId = ep.locationId;
    const state = input.state?.trim() || null;
    const area = input.area?.trim() || null;
    const ward = input.ward?.trim() || null;
    const label = input.label?.trim() || null;
    if (state || area || ward || label) {
      if (locationId) {
        await this.prisma.location.update({ where: { id: locationId }, data: { state, lga: area, ward, label } });
      } else {
        locationId = (await this.prisma.location.create({ data: { state, lga: area, ward, label } })).id;
      }
    }

    await this.prisma.employerProfile.update({
      where: { id: ep.id },
      data: {
        businessName: input.businessName?.trim() ?? undefined,
        logoUrl: input.logoUrl !== undefined ? input.logoUrl || null : undefined,
        industry: input.industry?.trim() ?? undefined,
        companySize: input.companySize?.trim() ?? undefined,
        websiteUrl: input.websiteUrl?.trim() ?? undefined,
        about: input.about?.trim() ?? undefined,
        locationId: locationId ?? undefined,
      },
    });

    return this.profile(userId);
  }

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

    return zEmployerDashboard.parse({
      user: {
        id: user.id,
        fullName: user.fullName,
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
      jobs: jobs.map((j) => {
        const accepted = j.assignments.filter((a) =>
          ["ACCEPTED", "CONFIRMED"].includes(a.status),
        ).length;
        const applied = j.assignments.filter((a) => a.status === "APPLIED").length;
        const invited = j.assignments.filter((a) => a.status === "INVITED").length;
        return {
          id: j.id,
          title: j.title,
          status: j.status,
          payAmount: j.payAmount.toString(),
          perPerson: (j.payAmount / BigInt(Math.max(1, j.headcount))).toString(),
          headcount: j.headcount,
          accepted,
          applied,
          invited,
          location: j.location?.label ?? null,
          startAt: j.startAt,
          endAt: j.endAt,
          skills: j.skills.map((s) => s.skill.name),
          applicants: j.assignments.length,
          escrow: j.escrow
            ? {
                amount: j.escrow.amount.toString(),
                funded: !!j.escrow.fundedAt,
                released: !!j.escrow.releasedAt,
              }
            : null,
        };
      }),
    });
  }
}
