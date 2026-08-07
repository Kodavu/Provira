import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { EscrowService } from "../escrow/escrow.service.js";
import { PAYMENT_PROVIDER } from "../../integrations/integrations.module.js";
import type { NormalizedWebhookEvent, PaymentProvider } from "@truvo/integrations";
import type { PaymentIntent } from "@truvo/db";

/**
 * Payments orchestrates external money movement through the provider-neutral
 * adapter and records a PaymentIntent for every attempt. Same-day worker payouts
 * and loan disbursements are OUTBOUND transfers; employer funding is INBOUND.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly escrow: EscrowService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  /** Same-day payout to a worker after escrow release. */
  async payoutWorker(params: {
    userId: string;
    amount: bigint;
    destination: { bankCode?: string; accountNumber?: string; walletId?: string };
    reference: string;
  }): Promise<PaymentIntent> {
    const intent = await this.prisma.paymentIntent.create({
      data: {
        direction: "OUTBOUND",
        amount: params.amount,
        provider: this.provider.name,
        idempotencyKey: params.reference,
        status: "PROCESSING",
      },
    });

    const outcome = await this.provider.transfer({
      reference: params.reference,
      amount: { amount: params.amount, currency: "NGN" },
      destination: {
        type: params.destination.walletId ? "wallet" : "bank_account",
        ...params.destination,
      },
      narration: "Truvo payout",
    });

    return this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        providerRef: outcome.providerRef,
        status: outcome.status === "succeeded" ? "SUCCEEDED" : "PROCESSING",
      },
    });
  }

  /**
   * Verify + (idempotently) process a provider webhook. parseWebhook throws on a
   * bad signature, so a forged webhook never reaches here. Already-processed
   * events short-circuit; new ones update the PaymentIntent and, for a confirmed
   * collection into a job-escrow account, mark the escrow funded.
   */
  async handleWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): Promise<{ received: boolean; duplicate?: boolean }> {
    // A bad signature (or unparseable body) is rejected with 401 — never 500,
    // and never processed. Providers treat 401 as "don't retry / it's invalid".
    let event: NormalizedWebhookEvent;
    try {
      event = this.provider.parseWebhook(headers, rawBody);
    } catch {
      throw new UnauthorizedException("Invalid webhook signature");
    }

    const existing = await this.prisma.paymentWebhookEvent.findUnique({
      where: { providerEventId: event.providerEventId },
      select: { processedAt: true },
    });
    if (existing?.processedAt) return { received: true, duplicate: true };

    await this.prisma.paymentWebhookEvent.upsert({
      where: { providerEventId: event.providerEventId },
      create: {
        provider: this.provider.name,
        eventType: event.type,
        providerEventId: event.providerEventId,
        payload: event.raw as object,
      },
      update: { eventType: event.type },
    });

    await this.applyEvent(event);

    await this.prisma.paymentWebhookEvent.updateMany({
      where: { providerEventId: event.providerEventId },
      data: { processedAt: new Date() },
    });
    return { received: true };
  }

  /** Apply a verified webhook: update the intent, and fund escrow on collection. */
  private async applyEvent(event: NormalizedWebhookEvent): Promise<void> {
    // Match the PaymentIntent by any of the references we might hold. Providers
    // like Squad prefix the reference with a merchant id, so also try the part
    // after the first "_".
    const refs = new Set<string>();
    if (event.reference) {
      refs.add(event.reference);
      const us = event.reference.indexOf("_");
      if (us >= 0) refs.add(event.reference.slice(us + 1));
    }
    if (refs.size) {
      const list = [...refs];
      const intent = await this.prisma.paymentIntent.findFirst({
        where: { OR: [{ idempotencyKey: { in: list } }, { providerRef: { in: list } }, { id: { in: list } }] },
        select: { id: true, status: true, providerRef: true },
      });
      // Don't move away from a terminal state.
      if (intent && intent.status !== "SUCCEEDED" && intent.status !== "REVERSED") {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status:
              event.status === "succeeded" ? "SUCCEEDED" : event.status === "failed" ? "FAILED" : "PROCESSING",
            providerRef: intent.providerRef ?? event.providerEventId,
          },
        });
      }
    }

    // A confirmed collection into a job-escrow account funds that job. We set the
    // EscrowAccount id as the provider customer_identifier when creating the
    // account, so it resolves directly. fundFromExternal is idempotent.
    if (event.status === "succeeded" && event.customerIdentifier) {
      const escrow = await this.prisma.escrowAccount.findUnique({
        where: { id: event.customerIdentifier },
        select: { jobId: true, fundedAt: true },
      });
      if (escrow && !escrow.fundedAt) await this.escrow.fundFromExternal(escrow.jobId);
    }
  }
}
