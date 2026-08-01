import { createHmac } from "node:crypto";
import type {
  CreateEscrowAccountParams,
  EscrowAccountHandle,
  NormalizedWebhookEvent,
  PaymentOutcome,
  PaymentOutcomeStatus,
  PaymentProvider,
  TransferParams,
} from "./types.js";

// Squad (squadco.com) implementation of the provider-neutral PaymentProvider.
// Covers the flows Tally uses — payouts (Transfer API), escrow collection
// (Virtual Accounts), and webhook verification — plus a few read helpers.
// Everything else in Squad's catalogue (VAS, POS, mandates, card modal…) is
// intentionally not implemented.

const SANDBOX_BASE = "https://sandbox-api-d.squadco.com";
const WEBHOOK_SIG_HEADER = "x-squad-encrypted-body";

export interface SquadConfig {
  secretKey: string;
  /** Merchant ID — Squad requires transfer references to be prefixed with it. */
  merchantId: string;
  /** Defaults to the sandbox host; set the production host for live. */
  baseUrl?: string;
  /** Public key — only needed for the (unused) dynamic-VA encryption flow. */
  publicKey?: string;
  /** Injectable for tests. Defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

export class SquadError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(`Squad API error ${status}`);
    this.name = "SquadError";
  }
}

export class SquadPaymentProvider implements PaymentProvider {
  readonly name = "squad";
  private readonly base: string;
  private readonly doFetch: typeof fetch;

  constructor(private readonly cfg: SquadConfig) {
    if (!cfg.secretKey) throw new Error("SquadPaymentProvider: secretKey is required");
    if (!cfg.merchantId) throw new Error("SquadPaymentProvider: merchantId is required");
    this.base = (cfg.baseUrl ?? SANDBOX_BASE).replace(/\/$/, "");
    this.doFetch = cfg.fetchImpl ?? fetch;
  }

  // --- PaymentProvider interface ---

  /**
   * Push money out (worker payout, withdrawal, loan disbursement, settlement).
   * Looks up the account name when the caller didn't supply it. A 424 from
   * Squad means "pending — re-query later", so it maps to `processing` rather
   * than an error; a 412 (reversed) maps to `failed`.
   */
  async transfer(params: TransferParams): Promise<PaymentOutcome> {
    const dest = params.destination;
    let accountName = dest.accountName;
    if (!accountName && dest.bankCode && dest.accountNumber) {
      accountName = (await this.accountLookup(dest.bankCode, dest.accountNumber)).accountName;
    }
    const reference = this.prefixRef(params.reference);
    try {
      const res = await this.call<SquadEnvelope>("POST", "/payout/transfer", {
        transaction_reference: reference,
        amount: params.amount.amount.toString(), // kobo (minor units)
        bank_code: dest.bankCode,
        account_number: dest.accountNumber,
        account_name: accountName,
        currency_id: params.amount.currency,
        remark: params.narration ?? "Tally payout",
      });
      return {
        providerRef: pick(res?.data, "transaction_reference") ?? reference,
        status: this.transferStatus(res),
        raw: res,
      };
    } catch (e) {
      if (e instanceof SquadError && e.status === 424) {
        return { providerRef: reference, status: "processing", raw: e.body };
      }
      if (e instanceof SquadError && e.status === 412) {
        return { providerRef: reference, status: "failed", raw: e.body };
      }
      throw e;
    }
  }

  /**
   * Create a dedicated virtual account an employer funds job escrow into.
   * Squad's B2C endpoint needs KYC fields; pass them through `metadata`
   * (firstName, lastName, mobileNum, dob, bvn, gender, address, email,
   * beneficiaryAccount). The escrow reference becomes the customer_identifier.
   */
  async createEscrowAccount(params: CreateEscrowAccountParams): Promise<EscrowAccountHandle> {
    const m = (params.metadata ?? {}) as Record<string, string | undefined>;
    const res = await this.call<SquadEnvelope>("POST", "/virtual-account", {
      customer_identifier: params.reference,
      first_name: m.firstName ?? "Tally",
      last_name: m.lastName ?? "Escrow",
      mobile_num: m.mobileNum,
      dob: m.dob,
      email: m.email,
      bvn: m.bvn,
      gender: m.gender,
      address: m.address,
      beneficiary_account: m.beneficiaryAccount,
    });
    const d = (res?.data ?? {}) as Record<string, unknown>;
    const accountNumber = String(d.virtual_account_number ?? "");
    return {
      providerRef: accountNumber || params.reference,
      virtualAccount: accountNumber
        ? {
            bank: String(d.bank_code ?? d.bank ?? "Squad"),
            accountNumber,
            accountName:
              `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim() || "Tally Escrow",
          }
        : undefined,
    };
  }

  /**
   * Verify the `x-squad-encrypted-body` HMAC-SHA512 signature (V1: hash of the
   * whole raw body) and normalize the payload. Throws on a bad signature so a
   * forged webhook never reaches domain logic.
   */
  parseWebhook(headers: Record<string, string>, rawBody: string): NormalizedWebhookEvent {
    const sig = headers[WEBHOOK_SIG_HEADER] ?? headers[WEBHOOK_SIG_HEADER.toUpperCase()];
    const expected = createHmac("sha512", this.cfg.secretKey).update(rawBody).digest("hex");
    if (!sig || sig.toLowerCase() !== expected.toLowerCase()) {
      throw new SquadError(401, { message: "Invalid Squad webhook signature" });
    }
    const payload = JSON.parse(rawBody) as SquadWebhook;
    const body = (payload.Body ?? payload.body ?? {}) as Record<string, unknown>;
    const reference =
      payload.TransactionRef ??
      (body.transaction_reference as string) ??
      (body.transactionRef as string) ??
      undefined;
    const rawAmount = body.principal_amount ?? body.settled_amount ?? body.amount;
    return {
      providerEventId:
        (body.gateway_transaction_ref as string) ?? reference ?? `${payload.Event}:${Date.now()}`,
      type: payload.Event ?? "unknown",
      reference,
      status: this.webhookStatus(payload, body),
      amount:
        rawAmount != null && !Number.isNaN(Number(rawAmount))
          ? { amount: BigInt(Math.round(Number(rawAmount))), currency: "NGN" }
          : undefined,
      customerIdentifier: (body.customer_identifier as string) ?? undefined,
      virtualAccountNumber: (body.virtual_account_number as string) ?? undefined,
      raw: payload,
    };
  }

  // --- Read/ops helpers (not part of the interface, used by the backend) ---

  async accountLookup(bankCode: string, accountNumber: string): Promise<{ accountName: string; raw: unknown }> {
    const res = await this.call<SquadEnvelope>("POST", "/payout/account/lookup", {
      bank_code: bankCode,
      account_number: accountNumber,
    });
    return { accountName: pick(res?.data, "account_name") ?? "", raw: res };
  }

  verifyTransaction(reference: string): Promise<unknown> {
    return this.call("GET", `/transaction/verify/${encodeURIComponent(reference)}`);
  }

  requeryTransfer(reference: string): Promise<unknown> {
    return this.call("POST", "/payout/requery", { transaction_reference: this.prefixRef(reference) });
  }

  /** Ledger balance in kobo. */
  getBalance(currency: Currency = "NGN"): Promise<unknown> {
    return this.call("GET", `/merchant/balance?currency_id=${currency}`);
  }

  /** Sandbox only — simulate a transfer into a virtual account. */
  simulatePayment(virtualAccountNumber: string, amount: bigint): Promise<unknown> {
    return this.call("POST", "/virtual-account/simulate/payment", {
      virtual_account_number: virtualAccountNumber,
      amount: amount.toString(),
    });
  }

  // --- internals ---

  private async call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await this.doFetch(`${this.base}${path}`, {
      method,
      headers: {
        authorization: `Bearer ${this.cfg.secretKey}`,
        "content-type": "application/json",
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const json: unknown = text ? safeJson(text) : {};
    if (!res.ok) throw new SquadError(res.status, json);
    return json as T;
  }

  private prefixRef(ref: string): string {
    const p = `${this.cfg.merchantId}_`;
    return ref.startsWith(p) ? ref : `${p}${ref}`;
  }

  private transferStatus(res: SquadEnvelope): PaymentOutcomeStatus {
    const s = String(pick(res?.data, "transaction_status") ?? "").toLowerCase();
    if (res?.success === true || /success/.test(s)) return "succeeded";
    if (/fail|revers|declin/.test(s)) return "failed";
    return "processing";
  }

  private webhookStatus(payload: SquadWebhook, body: Record<string, unknown>): PaymentOutcomeStatus {
    const s = `${payload.Event ?? ""} ${body.transaction_status ?? ""}`.toLowerCase();
    if (/success/.test(s)) return "succeeded";
    if (/fail|revers|declin|mismatch|expired/.test(s)) return "failed";
    return "processing";
  }
}

type Currency = "NGN";
interface SquadEnvelope {
  status?: number;
  success?: boolean;
  message?: string;
  data?: Record<string, unknown>;
}
interface SquadWebhook {
  Event?: string;
  TransactionRef?: string;
  Body?: Record<string, unknown>;
  body?: Record<string, unknown>;
}

function pick(obj: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = obj?.[key];
  return v == null ? undefined : String(v);
}
function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
