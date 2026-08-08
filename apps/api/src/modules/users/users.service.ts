import { createHash } from "node:crypto";
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LedgerService } from "../escrow/ledger.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { PAYMENT_PROVIDER } from "../../integrations/integrations.module.js";
import { meetsThreshold } from "@provira/core";
import { zVerificationStatus, zWalletData, zWorkerDashboard } from "@provira/contracts";
import type { PaymentProvider } from "@provira/integrations";
import type { KycLevel, Language, LedgerTxnType, RoleType, VerificationDocType } from "@provira/db";

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
    private readonly notifications: NotificationService,
    @Inject(PAYMENT_PROVIDER) private readonly payments: PaymentProvider,
  ) {}

  /** Resolve the account holder's name (name-enquiry) before saving it. */
  async lookupBankAccount(bankCode: string, accountNumber: string): Promise<{ accountName: string }> {
    if (!bankCode || !/^\d{10}$/.test(accountNumber ?? "")) {
      throw new BadRequestException("A bank and a 10-digit account number are required");
    }
    let res: { accountName: string };
    try {
      res = await this.payments.accountLookup(bankCode, accountNumber);
    } catch (e) {
      // Provider errors (bad bank code, unreachable, misconfigured Squad) must
      // surface as a clean 400 with a readable message — never a raw 500.
      const msg =
        typeof (e as { body?: unknown })?.body === "string"
          ? (e as { body: string }).body
          : (e as Error)?.message || "Couldn't verify that account with the bank";
      throw new BadRequestException(msg);
    }
    if (!res.accountName)
      throw new BadRequestException("We couldn't confirm a name for that account. Check the bank and number.");
    return { accountName: res.accountName };
  }

  /** Save the user's verified payout destination. */
  async saveBankAccount(
    userId: string,
    input: { bankCode: string; bankName?: string; accountNumber: string; accountName: string },
  ): Promise<{ ok: true }> {
    if (!input.bankCode || !/^\d{10}$/.test(input.accountNumber ?? "") || !input.accountName) {
      throw new BadRequestException("bankCode, a 10-digit accountNumber, and accountName are required");
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        payoutBankCode: input.bankCode,
        payoutBankName: input.bankName ?? null,
        payoutAccountNumber: input.accountNumber,
        payoutAccountName: input.accountName,
      },
    });
    return { ok: true };
  }

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

    return zWalletData.parse({
      available: account?.balance ?? 0n,
      currency: "NGN",
      payoutDestination: {
        bank: "OPay Digital Services",
        accountName: user.fullName ?? "—",
        accountNumber: "••••4821",
      },
      activity: entries.map((e) => ({
        id: e.id,
        direction: e.direction === "CREDIT" ? "in" : "out",
        amount: e.amount,
        type: e.transaction.type,
        label: TXN_LABELS[e.transaction.type] ?? e.transaction.type,
        at: e.createdAt,
      })),
    });
  }

  /**
   * Request a withdrawal to the linked bank. Funds are held immediately (moved
   * from the payout wallet into suspense) and a PaymentIntent is created in
   * CREATED — awaiting finance approval before the payout is actually dispatched.
   * Holding at request time prevents double-spending the same balance.
   */
  async withdraw(userId: string, amount: bigint) {
    if (amount <= 0n) throw new BadRequestException("Amount must be positive");
    const account = await this.prisma.account.findFirst({
      where: { ownerId: userId, type: "WORKER_PAYOUT" },
    });
    if (!account || account.balance < amount)
      throw new BadRequestException("Insufficient balance");

    const suspense = await this.ledger.getOrCreatePlatformAccount("SUSPENSE");
    const hold = await this.ledger.post({
      type: "WITHDRAWAL",
      reference: `withdraw-hold:${userId}:${Date.now()}`,
      legs: [
        { accountId: account.id, direction: "DEBIT", amount },
        { accountId: suspense, direction: "CREDIT", amount },
      ],
    });
    await this.prisma.paymentIntent.create({
      data: {
        direction: "OUTBOUND",
        status: "CREATED", // awaiting finance approval
        amount,
        provider: "mock",
        transactionId: hold.id,
        metadata: { kind: "withdrawal", userId },
      },
    });
    await this.notifications.notify(userId, "withdrawal.requested", {
      amount: `₦${(Number(amount) / 100).toLocaleString("en-NG")}`,
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

    const assignmentRows = user.workerProfile
      ? await this.prisma.jobAssignment.findMany({
          where: { workerId: user.workerProfile.id },
          include: {
            job: { include: { location: true, employer: true } },
            attendance: true,
          },
          orderBy: { updatedAt: "desc" },
          take: 30,
        })
      : [];

    const assignments = assignmentRows.map((a) => ({
      id: a.id,
      status: a.status,
      matchScore: a.matchScore,
      job: {
        id: a.job.id,
        title: a.job.title,
        payAmount: a.job.payAmount.toString(),
        status: a.job.status,
        location: a.job.location?.label ?? null,
        startAt: a.job.startAt,
        endAt: a.job.endAt,
        employerName: a.job.employer?.businessName ?? null,
      },
      // The attendance code is deliberately NOT exposed to the worker — the
      // employer reads it out on site. Workers only ever confirm by entering it.
      attendance: a.attendance ? { status: a.attendance.status } : null,
    }));

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

    // Validated against the shared contract — the response is guaranteed to
    // match the schema the clients infer their types from (and extra fields like
    // attendance.confirmCodeHash are stripped).
    return zWorkerDashboard.parse({
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
      wallet: { balance: payoutAccount?.balance ?? 0n, currency: "NGN" },
      assignments,
      openJobs,
      loanOffers,
    });
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
    data: { fullName?: string; language?: Language; hasSmartphone?: boolean; jobFeed?: string },
  ) {
    const jobFeed = data.jobFeed && ["ALL", "SKILLS", "NEARBY"].includes(data.jobFeed) ? data.jobFeed : undefined;
    return this.prisma.user.update({
      where: { id: userId },
      data: { ...data, jobFeed },
    });
  }

  /** The worker's editable profile: bio, skills, languages, and home location. */
  async workerProfile(userId: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        workerProfile: { include: { skills: { include: { skill: true } }, location: true } },
      },
    });
    if (!user) throw new NotFoundException("User not found");
    const wp = user.workerProfile;
    return {
      fullName: user.fullName,
      headline: wp?.headline ?? null,
      avatarUrl: user.avatarUrl ?? null,
      jobFeed: (user as { jobFeed?: string }).jobFeed ?? "ALL",
      bio: wp?.bio ?? null,
      languages: wp?.languages ?? ["EN"],
      skills: wp?.skills.map((s) => s.skill.slug) ?? [],
      location: {
        state: wp?.location?.state ?? null,
        area: wp?.location?.lga ?? null,
        ward: wp?.location?.ward ?? null,
        label: wp?.location?.label ?? null,
      },
    };
  }

  /** Update the worker's profile — creates the profile/location if missing. */
  async updateWorkerProfile(
    userId: string,
    input: {
      fullName?: string;
      headline?: string;
      avatarUrl?: string;
      bio?: string;
      languages?: Language[];
      skillSlugs?: string[];
      state?: string;
      area?: string;
      ward?: string;
      label?: string;
    },
  ): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { workerProfile: true },
    });
    if (!user) throw new NotFoundException("User not found");
    // Ensure a worker profile exists (a WORKER may not have one if role added elsewhere).
    const wp =
      user.workerProfile ??
      (await this.prisma.workerProfile.create({ data: { userId } }));

    const userPatch: { fullName?: string; avatarUrl?: string } = {};
    if (input.fullName?.trim()) userPatch.fullName = input.fullName.trim();
    if (input.avatarUrl !== undefined) userPatch.avatarUrl = input.avatarUrl || undefined;
    if (Object.keys(userPatch).length) {
      await this.prisma.user.update({ where: { id: userId }, data: userPatch });
    }

    // Upsert the worker's home location (state + area + optional label).
    let locationId = wp.locationId;
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

    // Replace the skill set if provided.
    if (input.skillSlugs) {
      const skills = await this.prisma.skill.findMany({ where: { slug: { in: input.skillSlugs } } });
      await this.prisma.workerSkill.deleteMany({ where: { workerId: wp.id } });
      await this.prisma.workerSkill.createMany({
        data: skills.map((s) => ({ workerId: wp.id, skillId: s.id })),
        skipDuplicates: true,
      });
    }

    await this.prisma.workerProfile.update({
      where: { id: wp.id },
      data: {
        bio: input.bio?.trim() ?? undefined,
        headline: input.headline?.trim() ?? undefined,
        languages: input.languages ?? undefined,
        locationId: locationId ?? undefined,
      },
    });

    return this.workerProfile(userId);
  }

  /** Resolve the worker's profile id, creating the profile if needed. */
  private async workerProfileId(userId: string): Promise<string> {
    const wp =
      (await this.prisma.workerProfile.findUnique({ where: { userId } })) ??
      (await this.prisma.workerProfile.create({ data: { userId } }));
    return wp.id;
  }

  /** List a worker's portfolio items (own management view). */
  async listPortfolio(userId: string): Promise<unknown> {
    const wpId = await this.workerProfileId(userId);
    const items = await this.prisma.portfolioItem.findMany({
      where: { workerProfileId: wpId },
      orderBy: { createdAt: "desc" },
    });
    return items.map((p) => ({
      id: p.id, kind: p.kind, title: p.title, description: p.description, url: p.url, thumbnailUrl: p.thumbnailUrl,
    }));
  }

  /** Add a portfolio item for the worker. */
  async addPortfolio(
    userId: string,
    input: { kind: string; title: string; description?: string; url: string; thumbnailUrl?: string },
  ): Promise<unknown> {
    if (!input.url?.trim()) throw new BadRequestException("A URL or file is required");
    if (!input.title?.trim()) throw new BadRequestException("A title is required");
    const wpId = await this.workerProfileId(userId);
    const kind = ["IMAGE", "PDF", "VIDEO", "LINK"].includes(input.kind) ? input.kind : "LINK";
    await this.prisma.portfolioItem.create({
      data: {
        workerProfileId: wpId,
        kind: kind as "IMAGE" | "PDF" | "VIDEO" | "LINK",
        title: input.title.trim(),
        description: input.description?.trim() || null,
        url: input.url.trim(),
        thumbnailUrl: input.thumbnailUrl?.trim() || null,
      },
    });
    return this.listPortfolio(userId);
  }

  /** Delete one of the worker's own portfolio items. */
  async deletePortfolio(userId: string, itemId: string): Promise<unknown> {
    const wpId = await this.workerProfileId(userId);
    await this.prisma.portfolioItem.deleteMany({ where: { id: itemId, workerProfileId: wpId } });
    return this.listPortfolio(userId);
  }

  /** The user's current KYC level plus their latest verification request (if any). */
  async verificationStatus(userId: string): Promise<unknown> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycLevel: true,
        payoutBankCode: true,
        payoutBankName: true,
        payoutAccountNumber: true,
        payoutAccountName: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    const latest = await this.prisma.verificationRequest.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: { documents: { select: { type: true, label: true } } },
    });
    return zVerificationStatus.parse({
      kycLevel: user.kycLevel,
      request: latest
        ? {
            id: latest.id,
            requestedLevel: latest.requestedLevel,
            status: latest.status,
            decisionReason: latest.decisionReason,
            createdAt: latest.createdAt,
            documents: latest.documents,
          }
        : null,
      bankAccount: user.payoutAccountNumber
        ? {
            bankCode: user.payoutBankCode,
            bankName: user.payoutBankName,
            accountNumber: user.payoutAccountNumber,
            accountName: user.payoutAccountName,
          }
        : null,
    });
  }

  /**
   * Submit a KYC verification request for review. Raw BVN/NIN is hashed here and
   * never stored in the clear. Only one request may be pending at a time.
   */
  async submitVerification(
    userId: string,
    input: {
      requestedLevel: KycLevel;
      bvn?: string;
      documents?: Array<{ type: VerificationDocType; label: string; url: string }>;
    },
  ): Promise<{ id: string; status: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) throw new NotFoundException("User not found");
    const existing = await this.prisma.verificationRequest.findFirst({
      where: { userId, status: "PENDING" },
      select: { id: true },
    });
    if (existing) throw new BadRequestException("You already have a verification in review");
    const bvnHash = input.bvn?.trim() ? createHash("sha256").update(input.bvn.trim()).digest("hex") : null;
    const req = await this.prisma.verificationRequest.create({
      data: {
        userId,
        requestedLevel: input.requestedLevel,
        bvnHash,
        documents: input.documents?.length
          ? { create: input.documents.map((d) => ({ type: d.type, label: d.label, url: d.url })) }
          : undefined,
      },
    });
    return { id: req.id, status: req.status };
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
