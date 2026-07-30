import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LedgerService } from "../escrow/ledger.service.js";
import { meetsThreshold } from "@tally/core";
import type { Language, LedgerTxnType, RoleType } from "@tally/db";

// Human labels for ledger transaction types shown in the wallet activity feed.
const TXN_LABELS: Partial<Record<LedgerTxnType, string>> = {
  ESCROW_RELEASE: "Shift payout",
  WITHDRAWAL: "Withdrawal",
  LOAN_DISBURSEMENT: "Loan disbursed",
  LOAN_REPAYMENT: "Loan repayment",
  PAYOUT: "Payout",
  ADJUSTMENT: "Adjustment",
};

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /** Wallet view: available balance, where withdrawals land, and the ledger. */
  async wallet(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const account = await this.prisma.account.findFirst({
      where: { ownerId: userId, type: "WORKER_PAYOUT" },
    });

    const entries = account
      ? await this.prisma.ledgerEntry.findMany({
          where: { accountId: account.id },
          include: { transaction: true },
          orderBy: { createdAt: "desc" },
          take: 30,
        })
      : [];

    return {
      available: (account?.balance ?? 0n).toString(),
      currency: "NGN",
      payoutDestination: {
        bank: "OPay Digital Services",
        accountName: user.fullName ?? "—",
        accountNumber: "••••4821",
      },
      activity: entries.map((e) => ({
        id: e.id,
        direction: e.direction === "CREDIT" ? "in" : "out",
        amount: e.amount.toString(),
        type: e.transaction.type,
        label: TXN_LABELS[e.transaction.type] ?? e.transaction.type,
        at: e.createdAt,
      })),
    };
  }

  /** Withdraw from the Guild wallet to the linked bank (money out). */
  async withdraw(userId: string, amount: bigint) {
    if (amount <= 0n) throw new BadRequestException("Amount must be positive");
    const account = await this.prisma.account.findFirst({
      where: { ownerId: userId, type: "WORKER_PAYOUT" },
    });
    if (!account || account.balance < amount)
      throw new BadRequestException("Insufficient balance");

    const suspense = await this.ledger.getOrCreatePlatformAccount("SUSPENSE");
    await this.ledger.post({
      type: "WITHDRAWAL",
      reference: `withdraw:${userId}:${Date.now()}`,
      legs: [
        { accountId: account.id, direction: "DEBIT", amount },
        { accountId: suspense, direction: "CREDIT", amount },
      ],
    });
    return this.wallet(userId);
  }

  /**
   * One aggregate payload for the worker dashboard: identity, reliability score,
   * wallet balance, active assignments (with attendance/confirm state), open
   * jobs nearby, and score-gated loan eligibility. Keeps the frontend to a
   * single request on load.
   */
  async workerDashboard(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        scoreProfile: true,
        workerProfile: { include: { location: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");

    const payoutAccount = await this.prisma.account.findFirst({
      where: { ownerId: userId, type: "WORKER_PAYOUT" },
    });

    const assignments = user.workerProfile
      ? await this.prisma.jobAssignment.findMany({
          where: { workerId: user.workerProfile.id },
          include: { job: true, attendance: true },
          orderBy: { updatedAt: "desc" },
          take: 20,
        })
      : [];

    const openJobs = await this.prisma.job.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { location: true, skills: { include: { skill: true } } },
    });

    const score = user.scoreProfile?.score ?? 0;
    const tier = user.scoreProfile?.tier ?? "BUILDING";
    const products = await this.prisma.loanProduct.findMany({
      where: { isActive: true },
    });
    const loanOffers = products.map((p) => ({
      productId: p.id,
      name: p.name,
      maxAmount: p.maxAmount.toString(),
      minScore: p.minScore,
      minTier: p.minTier,
      eligible: meetsThreshold({ score, tier }, p.minScore, p.minTier),
    }));

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        language: user.language,
        hasSmartphone: user.hasSmartphone,
      },
      score: {
        value: score,
        tier,
        jobsCompleted: user.scoreProfile?.jobsCompleted ?? 0,
        onTimeRate: user.scoreProfile?.onTimeRate ?? 0,
      },
      wallet: { balance: (payoutAccount?.balance ?? 0n).toString(), currency: "NGN" },
      assignments,
      openJobs,
      loanOffers,
    };
  }

  async get(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        workerProfile: true,
        traderProfile: true,
        employerProfile: true,
        scoreProfile: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; language?: Language; hasSmartphone?: boolean },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  /** Attach a role and create its profile row if missing. */
  async addRole(userId: string, role: RoleType) {
    await this.prisma.userRole.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role },
      update: { isActive: true },
    });
    if (role === "WORKER")
      await this.prisma.workerProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    if (role === "TRADER")
      await this.prisma.traderProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    if (role === "EMPLOYER")
      await this.prisma.employerProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    return this.get(userId);
  }
}
