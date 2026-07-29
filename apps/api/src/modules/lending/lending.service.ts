import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LedgerService } from "../escrow/ledger.service.js";
import { PaymentsService } from "../payments/payments.service.js";
import { meetsThreshold } from "@tally/core";

/**
 * Micro-lending. Tally is the lender of record (Lender.isPlatform = true) but
 * every loan references a Lender, so a partner lender can be introduced without
 * schema change. Eligibility is gated by the reliability score/tier.
 */
@Injectable()
export class LendingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly payments: PaymentsService,
  ) {}

  /** Which active products does this user currently qualify for? */
  async eligibility(userId: string) {
    const profile = await this.prisma.scoreProfile.findUnique({
      where: { userId },
    });
    const score = profile?.score ?? 0;
    const tier = profile?.tier ?? "BUILDING";

    const products = await this.prisma.loanProduct.findMany({
      where: { isActive: true },
    });

    return products.map((p) => ({
      productId: p.id,
      name: p.name,
      maxAmount: p.maxAmount.toString(),
      eligible: meetsThreshold({ score, tier }, p.minScore, p.minTier),
      minScore: p.minScore,
      minTier: p.minTier,
    }));
  }

  async apply(userId: string, productId: string, amount: bigint) {
    const product = await this.prisma.loanProduct.findUnique({
      where: { id: productId },
    });
    if (!product) throw new BadRequestException("Unknown product");

    const profile = await this.prisma.scoreProfile.findUnique({
      where: { userId },
    });
    const score = profile?.score ?? 0;
    const tier = profile?.tier ?? "BUILDING";
    const eligible = meetsThreshold({ score, tier }, product.minScore, product.minTier);

    if (amount < product.minAmount || amount > product.maxAmount)
      throw new BadRequestException("Amount outside product limits");

    return this.prisma.loanApplication.create({
      data: {
        userId,
        productId,
        lenderId: product.lenderId,
        amount,
        scoreAtApply: score,
        status: eligible ? "APPROVED" : "REJECTED",
        decisionReason: eligible ? "Meets score threshold" : "Below score threshold",
        decidedAt: new Date(),
      },
    });
  }

  /** Disburse an approved loan: platform cash -> worker payout wallet + payout. */
  async disburse(applicationId: string) {
    const app = await this.prisma.loanApplication.findUnique({
      where: { id: applicationId },
      include: { product: true },
    });
    if (!app || app.status !== "APPROVED")
      throw new BadRequestException("Application not approved");

    const loan = await this.prisma.loan.create({
      data: {
        userId: app.userId,
        lenderId: app.lenderId,
        productId: app.productId,
        applicationId: app.id,
        principal: app.amount,
        interestBps: app.product.interestBps,
        dueAt: new Date(Date.now() + app.product.termDays * 86400000),
      },
    });

    const platformCash = await this.ledger.getOrCreatePlatformAccount("PLATFORM_CASH");
    const receivable = await this.ledger.getOrCreatePlatformAccount("LOAN_RECEIVABLE");
    await this.ledger.post({
      type: "LOAN_DISBURSEMENT",
      reference: `loan-disburse:${loan.id}`,
      idempotencyKey: `loan-disburse:${loan.id}`,
      legs: [
        { accountId: platformCash, direction: "DEBIT", amount: app.amount },
        { accountId: receivable, direction: "CREDIT", amount: app.amount },
      ],
    });

    await this.payments.payoutWorker({
      userId: app.userId,
      amount: app.amount,
      destination: { walletId: app.userId },
      reference: `loan-payout:${loan.id}`,
    });

    return loan;
  }
}
