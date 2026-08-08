import { createHmac } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { SquadPaymentProvider, SquadError } from "@provira/integrations";

const SECRET = "sandbox_sk_test";
const MERCHANT = "SBTEST01";

function provider(fetchImpl?: typeof fetch) {
  return new SquadPaymentProvider({ secretKey: SECRET, merchantId: MERCHANT, fetchImpl });
}

// A fake fetch that routes by URL and returns Response-like objects.
function fakeFetch(routes: Record<string, { ok?: boolean; status?: number; body: unknown }>): typeof fetch {
  return (async (url: string, opts?: RequestInit) => {
    const match = Object.keys(routes).find((k) => String(url).includes(k));
    const r = match ? routes[match] : { ok: false, status: 404, body: { message: "no route" } };
    (fakeFetch as any).lastBody = opts?.body ? JSON.parse(opts.body as string) : undefined;
    return {
      ok: r.ok ?? true,
      status: r.status ?? 200,
      text: async () => JSON.stringify(r.body),
    };
  }) as unknown as typeof fetch;
}

describe("SquadPaymentProvider.parseWebhook", () => {
  it("accepts a correctly-signed body and normalizes it", () => {
    const body = JSON.stringify({
      Event: "charge_successful",
      TransactionRef: "SBTEST01_intent123",
      Body: { transaction_reference: "SBTEST01_intent123", principal_amount: 500000, transaction_status: "success" },
    });
    const sig = createHmac("sha512", SECRET).update(body).digest("hex");
    const out = provider().parseWebhook({ "x-squad-encrypted-body": sig }, body);
    expect(out.status).toBe("succeeded");
    expect(out.reference).toBe("SBTEST01_intent123");
    expect(out.amount).toEqual({ amount: 500000n, currency: "NGN" });
    expect(out.type).toBe("charge_successful");
  });

  it("rejects a forged / missing signature", () => {
    const body = JSON.stringify({ Event: "x", TransactionRef: "r", Body: {} });
    expect(() => provider().parseWebhook({ "x-squad-encrypted-body": "deadbeef" }, body)).toThrow(SquadError);
    expect(() => provider().parseWebhook({}, body)).toThrow(SquadError);
  });

  it("maps failure-ish events to failed", () => {
    const body = JSON.stringify({ Event: "transfer_failed", TransactionRef: "r", Body: { transaction_status: "reversed" } });
    const sig = createHmac("sha512", SECRET).update(body).digest("hex");
    expect(provider().parseWebhook({ "x-squad-encrypted-body": sig }, body).status).toBe("failed");
  });
});

describe("SquadPaymentProvider.transfer", () => {
  it("prefixes the reference with the merchant id, sends kobo, and auto-resolves the account name", async () => {
    const f = fakeFetch({
      "/payout/account/lookup": { body: { data: { account_name: "Amaka Okafor" } } },
      "/payout/transfer": { body: { success: true, data: { transaction_reference: "SBTEST01_intent9" } } },
    });
    const spy = vi.fn(f);
    const out = await provider(spy as unknown as typeof fetch).transfer({
      reference: "intent9",
      amount: { amount: 1500000n, currency: "NGN" },
      destination: { type: "bank_account", bankCode: "058", accountNumber: "0123456789" },
      narration: "Payout",
    });
    expect(out.status).toBe("succeeded");
    // last call was the transfer; inspect its body
    const lastCall = spy.mock.calls[spy.mock.calls.length - 1];
    const sent = JSON.parse((lastCall[1] as RequestInit).body as string);
    expect(sent.transaction_reference).toBe("SBTEST01_intent9"); // merchant-prefixed
    expect(sent.amount).toBe("1500000"); // kobo, as string
    expect(sent.account_name).toBe("Amaka Okafor"); // looked up
    expect(sent.currency_id).toBe("NGN");
  });

  it("treats a 424 as processing (needs re-query), not an error", async () => {
    const out = await provider(
      fakeFetch({ "/payout/transfer": { ok: false, status: 424, body: { message: "pending" } } }),
    ).transfer({
      reference: "SBTEST01_intent10",
      amount: { amount: 1000n, currency: "NGN" },
      destination: { type: "bank_account", bankCode: "058", accountNumber: "0123456789", accountName: "Given Name" },
    });
    expect(out.status).toBe("processing");
  });
});
