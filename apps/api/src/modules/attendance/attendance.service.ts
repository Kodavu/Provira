import { createHash, randomInt } from "node:crypto";
import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EscrowService } from "../escrow/escrow.service.js";
import { ScoringService } from "../scoring/scoring.service.js";
import { PaymentsService } from "../payments/payments.service.js";
import type { Channel } from "@tally/db";

function hash(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrow: EscrowService,
    private readonly scoring: ScoringService,
    private readonly payments: PaymentsService,
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
    // Each confirmed worker draws their per-person share of the funded escrow.
    const perPerson = job.payAmount / BigInt(Math.max(1, job.headcount));

    const updated = await this.prisma.attendance.update({
      where: { assignmentId },
      data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedVia: via },
    });
    await this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { status: "CONFIRMED" },
    });

    // Release this worker's share of escrow -> their payout wallet.
    await this.escrow.release(jobId, workerUserId, perPerson);

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

    // Fire same-day payout for this worker's share.
    await this.payments.payoutWorker({
      userId: workerUserId,
      amount: perPerson,
      destination: { walletId: workerUserId },
      reference: `payout:${jobId}:${workerUserId}`,
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
