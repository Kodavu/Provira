import { createHash, randomInt } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EscrowService, platformFee } from "../escrow/escrow.service.js";
import { ScoringService } from "../scoring/scoring.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import type { Channel } from "@tally/db";

function hash(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function naira(kobo: bigint): string {
  return `₦${(Number(kobo) / 100).toLocaleString("en-NG")}`;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrow: EscrowService,
    private readonly scoring: ScoringService,
    private readonly notifications: NotificationService,
  ) {}

  /**
   * Worker accepts a job -> generate the 4-digit confirmation code. The employer
   * receives it and shares it on site; the worker enters it (any channel) to
   * confirm attendance. Returns the plaintext code for delivery.
   */
  async createForAssignment(assignmentId: string) {
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id: assignmentId },
    });
    if (!assignment) throw new BadRequestException("Assignment not found");

    // Idempotent: a code was already issued for this assignment. We can't
    // re-reveal the plaintext (it's hashed), so signal the caller.
    const existing = await this.prisma.attendance.findUnique({
      where: { assignmentId },
    });
    if (existing) return { code: null as string | null, alreadyIssued: true };

    const code = String(randomInt(1000, 10000));
    await this.prisma.attendance.create({
      data: {
        jobId: assignment.jobId,
        assignmentId,
        confirmCodeHash: hash(code),
        code, // stored in the clear so the employer can display it on site
      },
    });
    return { code };
  }

  /**
   * Confirm attendance via the 4-digit code. On success: mark confirmed, release
   * escrow to the worker, record a positive score event, and fire the payout.
   * This is the pivotal transaction that turns work into a verifiable record.
   */
  async confirm(assignmentId: string, code: string, via: Channel = "WEB") {
    const attendance = await this.prisma.attendance.findUnique({
      where: { assignmentId },
      include: {
        assignment: { include: { worker: true, job: true } },
      },
    });
    if (!attendance) throw new BadRequestException("No attendance record");
    if (attendance.status === "CONFIRMED") return attendance; // idempotent
    if (attendance.confirmCodeHash !== hash(code))
      throw new BadRequestException("Invalid confirmation code");

    const workerUserId = attendance.assignment.worker.userId;
    const jobId = attendance.jobId;
    const job = attendance.assignment.job;
    const headcount = BigInt(Math.max(1, job.headcount));
    // Each confirmed worker draws their per-person share of the funded escrow;
    // the employer-borne platform fee for that share settles to PLATFORM_FEE.
    const perPerson = job.payAmount / headcount;
    const feePerPerson = platformFee(job.payAmount) / headcount;

    const updated = await this.prisma.attendance.update({
      where: { assignmentId },
      data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedVia: via },
    });
    await this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { status: "CONFIRMED" },
    });

    // Release this worker's share of escrow -> their withdrawable payout balance
    // (worker pay) and the platform fee -> PLATFORM_FEE, in one balanced posting.
    // The worker withdraws this balance on demand via the finance-approved
    // withdrawal flow — we intentionally do NOT auto-dispatch an external
    // transfer here (that path double-paid and bypassed the ledger).
    await this.escrow.release(jobId, workerUserId, perPerson, feePerPerson);

    // Record score signals (completed + on-time).
    await this.scoring.recordEvent({
      userId: workerUserId,
      type: "JOB_COMPLETED",
      refType: "job",
      refId: jobId,
    });
    await this.scoring.recordEvent({
      userId: workerUserId,
      type: "JOB_ON_TIME",
      refType: "job",
      refId: jobId,
    });

    // Tell the worker their pay is now in their balance and ready to withdraw.
    await this.notifications.notify(workerUserId, "earnings.credited", {
      amount: naira(perPerson),
      title: job.title,
    });

    // The job is complete only once every worker in it has confirmed.
    const [confirmed, inJob] = await Promise.all([
      this.prisma.jobAssignment.count({ where: { jobId, status: "CONFIRMED" } }),
      this.prisma.jobAssignment.count({ where: { jobId, status: { in: ["ACCEPTED", "CONFIRMED"] } } }),
    ]);
    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: confirmed >= inJob ? "COMPLETED" : "IN_PROGRESS" },
    });

    return updated;
  }
}
