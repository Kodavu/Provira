import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LedgerService } from "./ledger.service.js";

/**
 * Platform fee, in basis points of worker pay, borne by the employer (workers
 * are never charged — see the pricing FAQ). Configurable via env; defaults to
 * 10%. Escrow is funded for workerPay + fee so the worker always receives their
 * full posted rate and the fee is drawn from the same holding account.
 */
export const PLATFORM_FEE_BPS = Number(process.env.PLATFORM_FEE_BPS ?? 1000);

/** Employer-borne platform fee for a given worker-pay amount (kobo). */
export function platformFee(workerPay: bigint): bigint {
  return (workerPay * BigInt(PLATFORM_FEE_BPS)) / 10000n;
}

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

  /**
   * Create a holding account for a job (called when a job is published). The
   * required funding is the total worker pay PLUS the employer-borne platform
   * fee, so a completed job can pay every worker in full and still settle the
   * fee from the same escrow — no separate charge to reconcile.
   */
  async createForJob(jobId: string, workerPay: bigint) {
    const account = await this.prisma.account.create({
      data: { type: "JOB_ESCROW" },
    });
    return this.prisma.escrowAccount.create({
      data: { jobId, accountId: account.id, amount: workerPay + platformFee(workerPay) },
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
   * Release one worker's share of escrow to their payout wallet on confirmed
   * attendance. A job funds escrow for the whole headcount up front, so each
   * confirmed worker draws their per-person amount. Idempotent per (job, worker);
   * escrow is marked fully released once its holding account is drained.
   */
  async release(jobId: string, workerUserId: string, workerAmount: bigint, feeAmount: bigint = 0n) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { jobId },
    });
    if (!escrow) throw new BadRequestException("No escrow for job");
    if (!escrow.fundedAt) throw new BadRequestException("Escrow not funded");

    const workerAccount = await this.ledger.ensureUserAccount(
      workerUserId,
      "WORKER_PAYOUT",
    );
    const feeAccount = await this.ledger.getOrCreatePlatformAccount("PLATFORM_FEE");

    // One balanced transaction: escrow -> worker payout + platform fee. When the
    // fee is zero the fee leg drops out and this is a plain 2-leg release.
    const legs = [
      { accountId: escrow.accountId, direction: "DEBIT" as const, amount: workerAmount + feeAmount },
      { accountId: workerAccount, direction: "CREDIT" as const, amount: workerAmount },
    ];
    if (feeAmount > 0n) legs.push({ accountId: feeAccount, direction: "CREDIT" as const, amount: feeAmount });

    await this.ledger.post({
      type: "ESCROW_RELEASE",
      reference: `escrow-release:${jobId}:${workerUserId}`,
      idempotencyKey: `escrow-release:${jobId}:${workerUserId}`,
      legs,
    });

    // Mark the escrow released once its holding account is drained to zero.
    const account = await this.prisma.account.findUnique({
      where: { id: escrow.accountId },
    });
    if (account && account.balance <= 0n && !escrow.releasedAt) {
      return this.prisma.escrowAccount.update({
        where: { jobId },
        data: { releasedAt: new Date() },
      });
    }
    return escrow;
  }

  /**
   * Refund the UNRELEASED remainder of a job's escrow back to the employer's
   * in-platform funding wallet (from where they can reuse or withdraw it). Only
   * the balance still sitting in the holding account is returned, so money
   * already released to confirmed workers is never clawed back. Idempotent:
   * a fully-drained or already-refunded escrow is a no-op.
   */
  async refund(jobId: string) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { jobId, },
      include: { job: { include: { employer: true } } },
    });
    if (!escrow) throw new BadRequestException("No escrow for job");
    if (escrow.refundedAt) return escrow; // idempotent

    const account = await this.prisma.account.findUnique({ where: { id: escrow.accountId } });
    const remaining = account?.balance ?? 0n;

    if (remaining > 0n) {
      const employerAccount = await this.ledger.ensureUserAccount(
        escrow.job.employer.userId,
        "EMPLOYER_FUNDING",
      );
      await this.ledger.post({
        type: "ESCROW_REFUND",
        reference: `escrow-refund:${jobId}`,
        idempotencyKey: `escrow-refund:${jobId}`,
        legs: [
          { accountId: escrow.accountId, direction: "DEBIT", amount: remaining },
          { accountId: employerAccount, direction: "CREDIT", amount: remaining },
        ],
      });
    }

    return this.prisma.escrowAccount.update({
      where: { jobId },
      data: { refundedAt: new Date() },
    });
  }

  /**
   * Resolve a dispute against the held escrow: split the remaining balance
   * between the worker (releaseAmount) and the employer (refundAmount) in one
   * balanced posting. Platform fee is waived on dispute resolutions. The two
   * amounts must not exceed the balance still held. Idempotent per dispute via
   * the caller-supplied key. Marks the escrow released and/or refunded, and
   * fully drained escrow flips both timestamps.
   */
  async resolveDispute(
    jobId: string,
    params: { workerUserId?: string; releaseAmount?: bigint; refundAmount?: bigint; idempotencyKey: string },
  ) {
    const escrow = await this.prisma.escrowAccount.findUnique({
      where: { jobId },
      include: { job: { include: { employer: true } } },
    });
    if (!escrow) throw new BadRequestException("No escrow for job");

    const release = params.releaseAmount ?? 0n;
    const refund = params.refundAmount ?? 0n;
    if (release <= 0n && refund <= 0n) throw new BadRequestException("Nothing to release or refund");
    if (release > 0n && !params.workerUserId) throw new BadRequestException("A worker is required to release funds");

    const account = await this.prisma.account.findUnique({ where: { id: escrow.accountId } });
    const held = account?.balance ?? 0n;
    if (release + refund > held) throw new BadRequestException("Resolution exceeds the escrow still held");

    const legs: { accountId: string; direction: "DEBIT" | "CREDIT"; amount: bigint }[] = [
      { accountId: escrow.accountId, direction: "DEBIT", amount: release + refund },
    ];
    if (release > 0n) {
      const workerAccount = await this.ledger.ensureUserAccount(params.workerUserId!, "WORKER_PAYOUT");
      legs.push({ accountId: workerAccount, direction: "CREDIT", amount: release });
    }
    if (refund > 0n) {
      const employerAccount = await this.ledger.ensureUserAccount(escrow.job.employer.userId, "EMPLOYER_FUNDING");
      legs.push({ accountId: employerAccount, direction: "CREDIT", amount: refund });
    }

    await this.ledger.post({
      type: "ESCROW_REFUND",
      reference: `dispute-resolve:${jobId}`,
      idempotencyKey: params.idempotencyKey,
      legs,
      metadata: { kind: "dispute_resolution", release: release.toString(), refund: refund.toString() },
    });

    const drained = (await this.prisma.account.findUnique({ where: { id: escrow.accountId } }))?.balance ?? 0n;
    return this.prisma.escrowAccount.update({
      where: { jobId },
      data: {
        releasedAt: release > 0n || drained <= 0n ? escrow.releasedAt ?? new Date() : escrow.releasedAt,
        refundedAt: refund > 0n || drained <= 0n ? escrow.refundedAt ?? new Date() : escrow.refundedAt,
      },
    });
  }
}
