// Provider-neutral payment interface. NOT modeled on any single vendor — a
// Paystack/OPay/Flutterwave adapter implements this same surface. The backend
// only ever depends on PaymentProvider, never a concrete SDK.

export type Currency = "NGN";

export interface Money {
  amount: bigint; // minor units (kobo)
  currency: Currency;
}

export interface CreateEscrowAccountParams {
  reference: string; // our EscrowAccount id
  amount: Money;
  metadata?: Record<string, unknown>;
}

export interface EscrowAccountHandle {
  providerRef: string;
  // For providers that issue a dedicated virtual account to fund into.
  virtualAccount?: { bank: string; accountNumber: string; accountName: string };
}

export interface TransferParams {
  reference: string; // idempotency key (our PaymentIntent id)
  amount: Money;
  destination: PayoutDestination;
  narration?: string;
  metadata?: Record<string, unknown>;
}

export interface PayoutDestination {
  type: "bank_account" | "wallet";
  bankCode?: string;
  accountNumber?: string;
  accountName?: string;
  walletId?: string;
}

export type PaymentOutcomeStatus =
  | "processing"
  | "succeeded"
  | "failed";

export interface PaymentOutcome {
  providerRef: string;
  status: PaymentOutcomeStatus;
  raw?: unknown;
}

export interface NormalizedWebhookEvent {
  providerEventId: string;
  type: string; // "transfer.success" | "charge.success" | ...
  reference?: string; // our reference echoed back
  status: PaymentOutcomeStatus;
  amount?: Money;
  /** For collections into a dedicated account (e.g. our EscrowAccount id). */
  customerIdentifier?: string;
  /** The virtual account the money landed in, when applicable. */
  virtualAccountNumber?: string;
  raw: unknown;
}

export interface PaymentProvider {
  readonly name: string;
  /** Create a holding account an employer funds before a job runs. */
  createEscrowAccount(
    params: CreateEscrowAccountParams,
  ): Promise<EscrowAccountHandle>;
  /** Push money out: worker payout or loan disbursement. */
  transfer(params: TransferParams): Promise<PaymentOutcome>;
  /** Verify + normalize a raw provider webhook into our shape. */
  parseWebhook(
    headers: Record<string, string>,
    rawBody: string,
  ): NormalizedWebhookEvent;
}
