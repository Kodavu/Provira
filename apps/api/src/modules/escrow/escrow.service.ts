import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LedgerService } from "./ledger.service.js";

/**
 * Escrow lifecycle: an employer funds a per-job holding account BEFORE the job
 * runs; pay releases to the worker only on confirmed attendance. Money flow is
 * expressed as balanced ledger postings.
 */
@Injectable()
export class EscrowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /**
   * Fund escrow from an external source (the employer paying money in). Models
   * the inbound leg as SUSPENSE -> job escrow so the demo doesn't require the
   * employer to pre-load a wallet. Idempotent per job.
   */
  async fundFromExternal(jobId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { jobId },
    });
    if (!escrow) throw new BadRequestException("No escrow for job");
    if (escrow.fundedAt) return escrow;

    const suspense = await this.ledger.getOrCreatePlatformAccount("SUSPENSE");
    await this.ledger.post({
      type: "ESCROW_FUND",
      reference: `escrow-fund:${jobId}`,
      idempotencyKey: `escrow-fund:${jobId}`,
      legs: [
        { accountId: suspense, direction: "DEBIT", amount: escrow.amount },
        { accountId: escrow.accountId, direction: "CREDIT", amount: escrow.amount },
      ],
    });

    await this.prisma.job.update({ where: { id: jobId }, data: { status: "FILLED" } });
    return this.prisma.escrowAccount.update({
      where: { jobId },
      data: { fundedAt: new Date() },
    });
  }

  /** Create a holding account for a job (called when a job is published). */
  async createForJob(jobId: string, amount: bigint) {
    const account = await this.prisma.account.create({
      data: { type: "JOB_ESCROW" },
    });
    return this.prisma.escrowAccount.create({
      data: { jobId, accountId: account.id, amount },
    });
  }

  /**
   * Mark escrow funded: employer funding wallet -> job escrow account.
   * (The employer's wallet is topped up separately via a PaymentIntent inbound.)
   */
  async fund(jobId: string, employerUserId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { jobId },
    });
    if (!escrow) throw new BadRequestException("No escrow for job");
    if (escrow.fundedAt) return escrow; // idempotent

    const employerAccount = await this.ledger.ensureUserAccount(
      employerUserId,
      "EMPLOYER_FUNDING",
    );

    await this.ledger.post({
      type: "ESCROW_FUND",
      reference: `escrow-fund:${jobId}`,
      idempotencyKey: `escrow-fund:${jobId}`,
      legs: [
        { accountId: employerAccount, direction: "DEBIT", amount: escrow.amount },
        { accountId: escrow.accountId, direction: "CREDIT", amount: escrow.amount },
      ],
    });

    return this.prisma.escrowAccount.update({
      where: { jobId },
      data: { fundedAt: new Date() },
    });
  }

  /**
   * Release escrow to a worker's payout wallet on confirmed attendance.
   * Returns the worker payout account id so PaymentsService can push it out.
   */
  async release(jobId: string, workerUserId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { jobId },
    });
    if (!escrow) throw new BadRequestException("No escrow for job");
    if (!escrow.fundedAt) throw new BadRequestException("Escrow not funded");
    if (escrow.releasedAt) return escrow; // idempotent

    const workerAccount = await this.ledger.ensureUserAccount(
      workerUserId,
      "WORKER_PAYOUT",
    );

    await this.ledger.post({
      type: "ESCROW_RELEASE",
      reference: `escrow-release:${jobId}`,
      idempotencyKey: `escrow-release:${jobId}`,
      legs: [
        { accountId: escrow.accountId, direction: "DEBIT", amount: escrow.amount },
        { accountId: workerAccount, direction: "CREDIT", amount: escrow.amount },
      ],
    });

    return this.prisma.escrowAccount.update({
      where: { jobId },
      data: { releasedAt: new Date() },
    });
  }
}
