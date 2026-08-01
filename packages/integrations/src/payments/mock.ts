import { randomUUID } from "node:crypto";
import {
  CreateEscrowAccountParams,
  EscrowAccountHandle,
  NormalizedWebhookEvent,
  PaymentProvider,
  PaymentOutcome,
  TransferParams,
} from "./types.js";

// In-memory mock. Transfers "succeed" immediately (configurable) and it can
// synthesize webhook events so local flows exercise the async callback path
// without any real provider or keys.
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  private readonly failRefs = new Set<string>();

  /** Test hook: force a given reference to fail. */
  forceFailure(reference: string) {
    this.failRefs.add(reference);
  }

  async createEscrowAccount(
    params: CreateEscrowAccountParams,
  ): Promise<EscrowAccountHandle> {
    return {
      providerRef: `mock_esc_${randomUUID()}`,
      virtualAccount: {
        bank: "Mock Bank",
        accountNumber: "0000000000",
        accountName: `TALLY/${params.reference}`,
      },
    };
  }

  async transfer(params: TransferParams): Promise<PaymentOutcome> {
    const failed = this.failRefs.has(params.reference);
    return {
      providerRef: `mock_txf_${randomUUID()}`,
      status: failed ? "failed" : "succeeded",
    };
  }

  async accountLookup(_bankCode: string, accountNumber: string): Promise<{ accountName: string }> {
    // Deterministic stand-in name so the flow is testable without a real bank.
    return { accountName: `TALLY TEST ${accountNumber.slice(-4)}` };
  }

  parseWebhook(
    _headers: Record<string, string>,
    rawBody: string,
  ): NormalizedWebhookEvent {
    const body = JSON.parse(rawBody);
    return {
      providerEventId: body.id ?? `mock_evt_${randomUUID()}`,
      type: body.type ?? "transfer.success",
      reference: body.reference,
      status: body.status ?? "succeeded",
      raw: body,
    };
  }
}
