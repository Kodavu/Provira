"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { BadgeCheck, Clock, ShieldCheck } from "lucide-react";
import { api, type VerificationStatus } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Button, Card } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { FadeIn } from "@/components/motion";

// Common Nigerian banks + NIP codes (a subset; the full list lives with Squad).
const input =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function VerifyPage() {
  const t = useTranslations("Verify");
  const { data, error, reload } = usePageData<VerificationStatus>((id) => api.verificationStatus(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <FadeIn delay={0.05} className="space-y-5">
        <IdentityCard data={data} onDone={reload} />
        <PayoutAccountCard data={data} onSaved={reload} />
      </FadeIn>
    </div>
  );
}

function IdentityCard({ data, onDone }: { data: VerificationStatus; onDone: () => void }) {
  const { userId } = useSession();
  const t = useTranslations("Verify");
  const [nin, setNin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verified = data.kycLevel !== "NONE";
  const pending = data.request?.status === "PENDING";
  const rejected = data.request?.status === "REJECTED";

  async function submit() {
    if (!/^\d{11}$/.test(nin)) {
      setError(t("enterNin"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.submitVerification(userId, { requestedLevel: "BVN_VERIFIED", bvn: nin, documents: [] });
      toast.success(t("submitted"), { description: t("submittedDesc") });
      onDone();
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error(t("submitFailed"), { description: msg });
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
            <p className="font-semibold text-ink">{t("identity")}</p>
            <p className="text-sm text-ink-soft">{t("status", { level: t(`levels.${data.kycLevel}`) })}</p>
          </div>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">
            <BadgeCheck className="h-4 w-4" /> {t("verified")}
          </span>
        )}
      </div>

      {verified ? null : pending ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-gold-50 px-3.5 py-2.5 text-sm text-gold-700 ring-1 ring-gold-200">
          <Clock className="h-4 w-4" /> {t("inReview")}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {rejected && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {t("declined", { reason: data.request!.decisionReason ?? "" })}
            </div>
          )}
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">{t("ninLabel")}</span>
            <input
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, "").slice(0, 11))}
              inputMode="numeric"
              placeholder={t("ninPlaceholder")}
              className={input}
            />
            <span className="mt-1 block text-xs text-ink-muted">{t("ninEncrypted")}</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={submit} loading={busy}>{t("submitForVerification")}</Button>
        </div>
      )}
    </Card>
  );
}

function PayoutAccountCard({ data, onSaved }: { data: VerificationStatus; onSaved: () => void }) {
  const { userId } = useSession();
  const t = useTranslations("Verify");
  const existing = data.bankAccount;
  const [editing, setEditing] = useState(!existing);
  const [banks, setBanks] = useState<{ code: string; name: string }[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [busy, setBusy] = useState<"lookup" | "save" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api.banks().then(setBanks).catch(() => setBanks([])); }, []);

  const canLookup = !!bankCode && /^\d{10}$/.test(accountNumber);

  async function lookup() {
    if (!canLookup) return;
    setBusy("lookup");
    setError(null);
    setResolvedName(null);
    try {
      const { accountName } = await api.lookupBankAccount(userId, bankCode, accountNumber);
      setResolvedName(accountName);
      toast.success(t("accountFound"), { description: accountName });
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error(t("accountVerifyFailed"), { description: msg });
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
        bankName: banks.find((b) => b.code === bankCode)?.name,
        accountNumber,
        accountName: resolvedName,
      });
      toast.success(t("payoutSaved"), { description: t("payoutSavedDesc", { name: resolvedName, last4: accountNumber.slice(-4) }) });
      setEditing(false);
      setResolvedName(null);
      onSaved();
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error(t("saveFailed"), { description: msg });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="p-5">
      <p className="font-semibold text-ink">{t("payoutAccount")}</p>
      <p className="text-sm text-ink-soft">{t("payoutSub")}</p>

      {existing && !editing ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-line bg-canvas px-4 py-3">
          <div>
            <p className="font-medium text-ink">{existing.accountName}</p>
            <p className="text-sm text-ink-soft">
              {existing.bankName ?? existing.bankCode} · ••••{existing.accountNumber.slice(-4)}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setEditing(true); setResolvedName(null); }}>{t("change")}</Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">{t("bank")}</span>
            <select value={bankCode} onChange={(e) => { setBankCode(e.target.value); setResolvedName(null); }} className={input}>
              <option value="">{t("selectBank")}</option>
              {banks.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">{t("accountNumber")}</span>
            <input
              value={accountNumber}
              onChange={(e) => { setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10)); setResolvedName(null); }}
              inputMode="numeric"
              placeholder={t("accountNumberPlaceholder")}
              className={input}
            />
          </label>

          {resolvedName ? (
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-wide text-brand-700">{t("accountName")}</p>
              <p className="mt-0.5 font-semibold text-ink">{resolvedName}</p>
            </div>
          ) : null}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            {!resolvedName ? (
              <Button onClick={lookup} loading={busy === "lookup"} disabled={!canLookup}>
                {t("verifyAccount")}
              </Button>
            ) : (
              <>
                <Button onClick={save} loading={busy === "save"}>{t("saveAccount")}</Button>
                <Button variant="outline" onClick={() => setResolvedName(null)}>{t("edit")}</Button>
              </>
            )}
            {existing && (
              <Button variant="ghost" onClick={() => { setEditing(false); setResolvedName(null); setError(null); }}>{t("cancel")}</Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
