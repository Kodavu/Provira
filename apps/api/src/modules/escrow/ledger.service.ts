import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AccountType, LedgerTxnType, Prisma } from "@tally/db";

interface PostingLeg {
  accountId: string;
  direction: "DEBIT" | "CREDIT";
  amount: bigint;
}

/**
 * Minimal double-entry ledger. Every movement is a balanced LedgerTransaction
 * (sum of debits == sum of credits) posted atomically, with cached balances
 * updated in the same transaction. Idempotency keys prevent double-posting.
 */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreatePlatformAccount(type: AccountType): Promise<string> {
    const existing = await this.prisma.account.findFirst({
      where: { type, ownerId: null },
    });
    if (existing) return existing.id;
    const created = await this.prisma.account.create({ data: { type } });
    return created.id;
  }

  async ensureUserAccount(ownerId: string, type: AccountType): Promise<string> {
    const existing = await this.prisma.account.findFirst({
      where: { type, ownerId },
    });
    if (existing) return existing.id;
    const created = await this.prisma.account.create({
      data: { type, ownerId },
    });
    return created.id;
  }

  /** Post a balanced set of legs atomically. */
  async post(params: {
    type: LedgerTxnType;
    legs: PostingLeg[];
    reference?: string;
    idempotencyKey?: string;
    metadata?: Prisma.InputJsonValue;
  }) {
    const debits = params.legs
      .filter((l) => l.direction === "DEBIT")
      .reduce((s, l) => s + l.amount, 0n);
    const credits = params.legs
      .filter((l) => l.direction === "CREDIT")
      .reduce((s, l) => s + l.amount, 0n);
    if (debits !== credits) {
      throw new Error(`Unbalanced ledger transaction: ${debits} != ${credits}`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (params.idempotencyKey) {
        const dup = await tx.ledgerTransaction.findUnique({
          where: { idempotencyKey: params.idempotencyKey },
        });
        if (dup) return dup; // already posted — no-op
      }

      const txn = await tx.ledgerTransaction.create({
        data: {
          type: params.type,
          status: "POSTED",
          reference: params.reference,
          idempotencyKey: params.idempotencyKey,
          metadata: params.metadata,
          postedAt: new Date(),
          entries: {
            create: params.legs.map((l) => ({
              accountId: l.accountId,
              direction: l.direction,
              amount: l.amount,
            })),
          },
        },
      });

      // Update cached balances. DEBIT increases asset-style balances here; we
      // keep a simple signed convention where CREDIT adds funds to a wallet.
      for (const leg of params.legs) {
        const delta = leg.direction === "CREDIT" ? leg.amount : -leg.amount;
        await tx.account.update({
          where: { id: leg.accountId },
          data: { balance: { increment: delta } },
        });
      }

      return txn;
    });
  }
}
