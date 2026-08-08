import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { LedgerService } from "../escrow/ledger.service.js";
import { AuditService } from "./audit.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { PAYMENT_PROVIDER } from "../../integrations/integrations.module.js";
import type { PaymentProvider } from "@provira/integrations";
import type { AdminContext } from "./rbac.js";

interface Meta {
  ip?: string;
  device?: string;
}

/**
 * Finance back-office: the withdrawal approval queue and the ledger view.
 * A withdrawal is requested by the user (funds already held in suspense with a
 * PaymentIntent in CREATED). Finance either approves it — dispatching the payout
 * through the provider and settling — or rejects it, returning the held funds to
 * the user's wallet. Every decision is audited.
 */
@Injectable()
export class FinanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async summary(): Promise<unknown> {
    const [pending, settled] = await Promise.all([
      this.prisma.paymentIntent.aggregate({
        _count: true,
        _sum: { amount: true },
        where: { direction: "OUTBOUND", status: "CREATED" },
      }),
      this.prisma.paymentIntent.aggregate({
        _count: true,
        _sum: { amount: true },
        where: { direction: "OUTBOUND", status: "SUCCEEDED" },
      }),
    ]);
    return {
      pendingCount: pending._count,
      pendingAmount: (pending._sum.amount ?? 0n).toString(),
      settledCount: settled._count,
      settledAmount: (settled._sum.amount ?? 0n).toString(),
    };
  }

  /** Withdrawal intents (OUTBOUND) with the requesting user, joined by metadata.userId. */
  async withdrawals(status: "pending" | "all"): Promise<unknown> {
    const intents = await this.prisma.paymentIntent.findMany({
      where: {
        direction: "OUTBOUND",
        ...(status === "pending" ? { status: "CREATED" } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const userIds = [
      ...new Set(intents.map((i) => (i.metadata as { userId?: string })?.userId).filter(Boolean) as string[]),
    ];
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, phone: true },
    });
    const byId = new Map(users.map((u) => [u.id, u]));
    return intents.map((i) => {
      const userId = (i.metadata as { userId?: string })?.userId ?? null;
      return {
        id: i.id,
        amount: i.amount.toString(),
        status: i.status,
        providerRef: i.providerRef,
        createdAt: i.createdAt,
        user: userId ? byId.get(userId) ?? null : null,
      };
    });
  }

  async approve(id: string, actor: AdminContext, meta: Meta): Promise<unknown> {
    const intent = await this.requireWithdrawal(id);
    if (intent.status !== "CREATED") throw new BadRequestException("This withdrawal isn't awaiting approval");
    const userId = (intent.metadata as { userId?: string })?.userId ?? null;

    // Send to the user's verified payout account (name-enquiry-confirmed at save).
    const payout = userId
      ? await this.prisma.user.findUnique({
          where: { id: userId },
          select: { payoutBankCode: true, payoutAccountNumber: true, payoutAccountName: true },
        })
      : null;

    // Dispatch the payout through the provider (funds are already held in suspense).
    const outcome = await this.provider.transfer({
      reference: intent.id,
      amount: { amount: intent.amount, currency: "NGN" },
      destination: {
        type: "bank_account",
        bankCode: payout?.payoutBankCode ?? undefined,
        accountNumber: payout?.payoutAccountNumber ?? undefined,
        accountName: payout?.payoutAccountName ?? undefined,
      },
      narration: "Provira withdrawal",
    });
    const updated = await this.prisma.paymentIntent.update({
      where: { id },
      data: {
        providerRef: outcome.providerRef,
        status: outcome.status === "succeeded" ? "SUCCEEDED" : "PROCESSING",
      },
    });

    await this.audit.record({
      adminUserId: actor.id,
      action: "withdrawal.approve",
      resource: "PaymentIntent",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      newValue: { amount: intent.amount.toString(), status: updated.status, providerRef: outcome.providerRef },
    });
    if (userId) {
      await this.notifications.notify(userId, "payout.sent", {
        amount: `NGN ${(Number(intent.amount) / 100).toLocaleString()}`,
      });
    }
    return { id: updated.id, status: updated.status, providerRef: updated.providerRef };
  }

  async reject(id: string, reason: string, actor: AdminContext, meta: Meta): Promise<unknown> {
    const intent = await this.requireWithdrawal(id);
    if (intent.status !== "CREATED") throw new BadRequestException("This withdrawal isn't awaiting approval");
    const userId = (intent.metadata as { userId?: string })?.userId ?? null;
    if (!userId) throw new BadRequestException("Withdrawal has no owner to refund");

    // Return the held funds to the user's payout wallet (reverse the hold).
    const account = await this.prisma.account.findFirst({ where: { ownerId: userId, type: "WORKER_PAYOUT" } });
    const suspense = await this.ledger.getOrCreatePlatformAccount("SUSPENSE");
    if (!account) throw new BadRequestException("User payout account not found");
    await this.ledger.post({
      type: "WITHDRAWAL",
      reference: `withdraw-refund:${id}`,
      legs: [
        { accountId: suspense, direction: "DEBIT", amount: intent.amount },
        { accountId: account.id, direction: "CREDIT", amount: intent.amount },
      ],
      metadata: { refundOf: id, reason },
    });
    const updated = await this.prisma.paymentIntent.update({
      where: { id },
      data: { status: "FAILED", metadata: { ...(intent.metadata as object), rejectedReason: reason } },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "withdrawal.reject",
      resource: "PaymentIntent",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      newValue: { amount: intent.amount.toString(), reason },
    });
    return { id: updated.id, status: updated.status };
  }

  /** Recent ledger transactions with their legs, for the transactions view. */
  async transactions(): Promise<unknown> {
    const txns = await this.prisma.ledgerTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 60,
      include: { entries: { include: { account: { select: { type: true, ownerId: true } } } } },
    });
    return txns.map((t) => ({
      id: t.id,
      type: t.type,
      status: t.status,
      reference: t.reference,
      createdAt: t.createdAt,
      amount: (t.entries.find((e) => e.direction === "DEBIT")?.amount ?? 0n).toString(),
      legs: t.entries.map((e) => ({
        direction: e.direction,
        amount: e.amount.toString(),
        account: e.account.type,
      })),
    }));
  }

  private async requireWithdrawal(id: string) {
    const intent = await this.prisma.paymentIntent.findUnique({ where: { id } });
    if (!intent || intent.direction !== "OUTBOUND") throw new NotFoundException("Withdrawal not found");
    return intent;
  }
}
