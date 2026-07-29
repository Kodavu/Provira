import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { PAYMENT_PROVIDER } from "../../integrations/integrations.module.js";
import type { PaymentProvider } from "@tally/integrations";
import type { PaymentIntent } from "@tally/db";

/**
 * Payments orchestrates external money movement through the provider-neutral
 * adapter and records a PaymentIntent for every attempt. Same-day worker payouts
 * and loan disbursements are OUTBOUND transfers; employer funding is INBOUND.
 */
@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
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
      narration: "Tally payout",
    });

    return this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: {
        providerRef: outcome.providerRef,
        status: outcome.status === "succeeded" ? "SUCCEEDED" : "PROCESSING",
      },
    });
  }

  /** Persist + (idempotently) process a normalized provider webhook. */
  async handleWebhook(headers: Record<string, string>, rawBody: string) {
    const event = this.provider.parseWebhook(headers, rawBody);
    await this.prisma.paymentWebhookEvent.upsert({
      where: { providerEventId: event.providerEventId },
      create: {
        provider: this.provider.name,
        eventType: event.type,
        providerEventId: event.providerEventId,
        payload: event.raw as object,
      },
      update: {},
    });

    if (event.reference) {
      await this.prisma.paymentIntent.updateMany({
        where: { idempotencyKey: event.reference },
        data: {
          status: event.status === "succeeded" ? "SUCCEEDED" : "FAILED",
        },
      });
    }
    return { received: true };
  }
}
