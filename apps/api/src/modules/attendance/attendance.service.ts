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

    const code = String(randomInt(1000, 10000));
    await this.prisma.$transaction([
      this.prisma.jobAssignment.update({
        where: { id: assignmentId },
        data: { status: "ACCEPTED" },
      }),
      this.prisma.attendance.create({
        data: {
          jobId: assignment.jobId,
          assignmentId,
          confirmCodeHash: hash(code),
        },
      }),
    ]);
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

    const updated = await this.prisma.attendance.update({
      where: { assignmentId },
      data: { status: "CONFIRMED", confirmedAt: new Date(), confirmedVia: via },
    });
    await this.prisma.jobAssignment.update({
      where: { id: assignmentId },
      data: { status: "CONFIRMED" },
    });

    // Release escrow -> worker payout wallet.
    await this.escrow.release(jobId, workerUserId);

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

    // Fire same-day payout (worker wallet destination in this scaffold).
    await this.payments.payoutWorker({
      userId: workerUserId,
      amount: attendance.assignment.job.payAmount,
      destination: { walletId: workerUserId },
      reference: `payout:${jobId}:${workerUserId}`,
    });

    await this.prisma.job.update({
      where: { id: jobId },
      data: { status: "COMPLETED" },
    });

    return updated;
  }
}
