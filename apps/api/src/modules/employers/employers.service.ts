import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { zEmployerDashboard, zEmployerProfileEdit, zEmployerReports } from "@provira/contracts";

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

  /**
   * Aggregated hiring analytics for the employer over the last `days` days:
   * payout-per-day, jobs by status, the applied→accepted→confirmed funnel, top
   * workers hired, and spend by skill category. All derived from real records.
   */
  async reports(userId: string, days = 30) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employerProfile: true },
    });
    if (!user?.employerProfile)
      throw new NotFoundException("Employer profile not found");
    const employerId = user.employerProfile.id;
    const range = Math.min(365, Math.max(7, days));
    const since = new Date(Date.now() - range * 86_400_000);

    const jobs = await this.prisma.job.findMany({
      where: { employerId },
      include: {
        skills: { include: { skill: { select: { category: true } } } },
        assignments: {
          include: {
            attendance: { select: { status: true, confirmedAt: true } },
            worker: {
              select: { user: { select: { id: true, fullName: true, avatarUrl: true } } },
            },
          },
        },
      },
    });

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const payoutByDay = new Map<string, bigint>();
    for (let i = range - 1; i >= 0; i--) {
      payoutByDay.set(dayKey(new Date(Date.now() - i * 86_400_000)), 0n);
    }

    let applied = 0;
    let accepted = 0;
    let confirmed = 0;
    const statusCount = new Map<string, number>();
    const categoryCount = new Map<string, number>();
    const workerAgg = new Map<
      string,
      { name: string; avatarUrl: string | null; jobs: number; paid: bigint }
    >();
    const timeToFill: number[] = [];

    for (const j of jobs) {
      statusCount.set(j.status, (statusCount.get(j.status) ?? 0) + 1);
      const cat = j.skills[0]?.skill.category ?? "Other";
      categoryCount.set(cat, (categoryCount.get(cat) ?? 0) + 1);
      const perPerson = j.payAmount / BigInt(Math.max(1, j.headcount));
      let firstAccepted: Date | null = null;

      for (const a of j.assignments) {
        if (a.appliedAt) applied += 1;
        if (a.acceptedAt || a.status === "CONFIRMED") accepted += 1;
        if (a.acceptedAt && (!firstAccepted || a.acceptedAt < firstAccepted))
          firstAccepted = a.acceptedAt;

        const isConfirmed =
          a.status === "CONFIRMED" || a.attendance?.status === "CONFIRMED";
        if (isConfirmed) {
          confirmed += 1;
          const when = a.attendance?.confirmedAt ?? a.updatedAt;
          if (when && when >= since) {
            const k = dayKey(when);
            if (payoutByDay.has(k)) payoutByDay.set(k, (payoutByDay.get(k) ?? 0n) + perPerson);
          }
          const u = a.worker.user;
          const cur =
            workerAgg.get(u.id) ??
            { name: u.fullName ?? "Worker", avatarUrl: u.avatarUrl ?? null, jobs: 0, paid: 0n };
          cur.jobs += 1;
          cur.paid += perPerson;
          workerAgg.set(u.id, cur);
        }
      }
      if (firstAccepted)
        timeToFill.push((firstAccepted.getTime() - j.createdAt.getTime()) / 3_600_000);
    }

    const payoutSeries = [...payoutByDay.entries()].map(([date, amount]) => ({
      date,
      amount: amount.toString(),
    }));
    const totalPaid = payoutSeries.reduce((s, p) => s + BigInt(p.amount), 0n);
    const headcountTotal = jobs.reduce((s, j) => s + j.headcount, 0);
    const topWorkers = [...workerAgg.entries()]
      .map(([id, v]) => ({ userId: id, name: v.name, avatarUrl: v.avatarUrl, jobs: v.jobs, paid: v.paid }))
      .sort((a, b) => b.jobs - a.jobs || (b.paid > a.paid ? 1 : -1))
      .slice(0, 6)
      .map((w) => ({ ...w, paid: w.paid.toString() }));

    return zEmployerReports.parse({
      rangeDays: range,
      totals: {
        totalPaid: totalPaid.toString(),
        jobsPosted: jobs.length,
        jobsCompleted: jobs.filter((j) => j.status === "COMPLETED").length,
        workersHired: workerAgg.size,
        fillRate: headcountTotal ? Math.min(1, accepted / headcountTotal) : 0,
        avgTimeToFillHours: timeToFill.length
          ? Math.round((timeToFill.reduce((a, b) => a + b, 0) / timeToFill.length) * 10) / 10
          : null,
      },
      payoutSeries,
      jobsByStatus: [...statusCount.entries()].map(([status, count]) => ({ status, count })),
      funnel: { applied, accepted, confirmed },
      topWorkers,
      categoryBreakdown: [...categoryCount.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    });
  }
}
