"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { api, type VerificationStatus } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Button, Card } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { FadeIn } from "@/components/motion";

const LEVEL_LABEL: Record<string, string> = {
  NONE: "Not verified",
  BASIC: "Basic",
  BVN_VERIFIED: "Verified",
  FULL: "Fully verified",
};

// Common Nigerian banks + NIP codes (a subset; the full list lives with Squad).
const BANKS: { code: string; name: string }[] = [
  { code: "044", name: "Access Bank" },
  { code: "058", name: "GTBank" },
  { code: "057", name: "Zenith Bank" },
  { code: "033", name: "UBA" },
  { code: "011", name: "First Bank" },
  { code: "032", name: "Union Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "214", name: "FCMB" },
  { code: "221", name: "Stanbic IBTC" },
  { code: "035", name: "Wema Bank" },
  { code: "050", name: "Ecobank" },
  { code: "50211", name: "Kuda" },
  { code: "999992", name: "OPay" },
  { code: "999991", name: "PalmPay" },
  { code: "50515", name: "Moniepoint" },
];

const input =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function VerifyPage() {
  const { data, error, reload } = usePageData<VerificationStatus>((id) => api.verificationStatus(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Verify your identity"
        subtitle="Verifying unlocks higher limits and loan eligibility, and lets you receive payouts. Your details are encrypted."
      />
      <FadeIn delay={0.05} className="space-y-5">
        <IdentityCard data={data} onDone={reload} />
        <PayoutAccountCard data={data} onSaved={reload} />
      </FadeIn>
    </div>
  );
}

function IdentityCard({ data, onDone }: { data: VerificationStatus; onDone: () => void }) {
  const { userId } = useSession();
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verified = data.kycLevel !== "NONE";
  const pending = data.request?.status === "PENDING";
  const rejected = data.request?.status === "REJECTED";

  async function submit() {
    if (!/^\d{11}$/.test(nin)) {
      setError("Enter your 11-digit NIN.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.submitVerification(userId, { requestedLevel: "BVN_VERIFIED", bvn: nin, documents: [] });
      toast.success("Submitted for verification", { description: "We'll notify you once it's decided." });
      onDone();
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error("Couldn't submit", { description: msg });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <div>
            <p className="font-semibold text-ink">Identity (NIN)</p>
            <p className="text-sm text-ink-soft">Status: {LEVEL_LABEL[data.kycLevel]}</p>
          </div>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            <BadgeCheck className="h-4 w-4" /> Verified
          </span>
        )}
      </div>

      {verified ? null : pending ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gold-50 px-3.5 py-2.5 text-sm text-gold-700 ring-1 ring-gold-200">
          <Clock className="h-4 w-4" /> In review — we&apos;ll notify you once it&apos;s decided.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rejected && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Your last request was declined: {data.request!.decisionReason}. Please resubmit.
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">National Identification Number (NIN)</span>
            <input
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="numeric"
              placeholder="11-digit NIN"
              className={input}
            />
            <span className="mt-1 block text-xs text-ink-muted">Stored encrypted — we never keep the raw number.</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit for verification"}</Button>
        </div>
      )}
    </Card>
  );
}

function PayoutAccountCard({ data, onSaved }: { data: VerificationStatus; onSaved: () => void }) {
  const { userId } = useSession();
  const existing = data.bankAccount;
  const [editing, setEditing] = useState(!existing);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [busy, setBusy] = useState<"lookup" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canLookup = !!bankCode && /^\d{10}$/.test(accountNumber);

  async function lookup() {
    if (!canLookup) return;
    setBusy("lookup");
    setError(null);
    setResolvedName(null);
    try {
      const { accountName } = await api.lookupBankAccount(userId, bankCode, accountNumber);
      setResolvedName(accountName);
      toast.success("Account found", { description: accountName });
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error("Couldn't verify account", { description: msg });
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!resolvedName) return;
    setBusy("save");
    setError(null);
    try {
      await api.saveBankAccount(userId, {
        bankCode,
        bankName: BANKS.find((b) => b.code === bankCode)?.name,
        accountNumber,
        accountName: resolvedName,
      });
      toast.success("Payout account saved", { description: `${resolvedName} · ••••${accountNumber.slice(-4)}` });
      setEditing(false);
      setResolvedName(null);
      onSaved();
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error("Couldn't save account", { description: msg });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-5">
      <p className="font-semibold text-ink">Payout account</p>
      <p className="text-sm text-ink-soft">Where you receive your money. We confirm the name before saving.</p>

      {existing && !editing ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
          <div>
            <p className="font-medium text-ink">{existing.accountName}</p>
            <p className="text-sm text-ink-soft">
              {existing.bankName ?? existing.bankCode} · ••••{existing.accountNumber.slice(-4)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditing(true); setResolvedName(null); }}>Change</Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">Bank</span>
            <select value={bankCode} onChange={(e) => { setBankCode(e.target.value); setResolvedName(null); }} className={input}>
              <option value="">Select your bank…</option>
              {BANKS.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">Account number</span>
            <input
              value={accountNumber}
              onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setResolvedName(null); }}
              inputMode="numeric"
              placeholder="10-digit account number"
              className={input}
            />
          </label>

          {resolvedName ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">Account name</p>
              <p className="mt-0.5 font-semibold text-ink">{resolvedName}</p>
            </div>
          ) : null}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            {!resolvedName ? (
              <Button onClick={lookup} disabled={!canLookup || busy === "lookup"}>
                {busy === "lookup" ? "Checking…" : "Verify account"}
              </Button>
            ) : (
              <>
                <Button onClick={save} disabled={busy === "save"}>{busy === "save" ? "Saving…" : "Save account"}</Button>
                <Button variant="outline" onClick={() => setResolvedName(null)}>Edit</Button>
              </>
            )}
            {existing && (
              <Button variant="ghost" onClick={() => { setEditing(false); setResolvedName(null); setError(null); }}>Cancel</Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
