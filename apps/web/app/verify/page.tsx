"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type VerificationStatus } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { Button, Card, Wordmark } from "@/components/ui";

const LEVELS = ["NONE", "BASIC", "BVN_VERIFIED", "FULL"] as const;
const LEVEL_LABEL: Record<string, string> = { NONE: "Not verified", BASIC: "Basic", BVN_VERIFIED: "BVN verified", FULL: "Fully verified" };
const DOC_TYPES = [
  { value: "NIN", label: "NIN slip" },
  { value: "NATIONAL_ID", label: "National ID card" },
  { value: "DRIVERS_LICENSE", label: "Driver's licence" },
  { value: "VOTERS_CARD", label: "Voter's card" },
  { value: "PASSPORT", label: "International passport" },
  { value: "UTILITY_BILL", label: "Utility bill" },
  { value: "SELFIE", label: "Selfie with ID" },
];

interface DocRow {
  type: string;
  file: File | null;
}

const input = "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand-500";

export default function VerifyPage() {
  const router = useRouter();
  const [data, setData] = useState<VerificationStatus | null>(null);
  const [level, setLevel] = useState("BVN_VERIFIED");
  const [bvn, setBvn] = useState("");
  const [docs, setDocs] = useState<DocRow[]>([{ type: "NIN", file: null }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      const s = await api.verificationStatus(userId);
      setData(s);
      // Default the requested level to the first level above the current one.
      const above = LEVELS.slice(LEVELS.indexOf(s.kycLevel) + 1).filter((l) => l !== "NONE");
      if (above.length) setLevel(above.includes("BVN_VERIFIED") ? "BVN_VERIFIED" : above[0]);
    } catch {
      /* leave null → loading */
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  function setDoc(i: number, patch: Partial<DocRow>) {
    setDocs((d) => d.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  async function submit() {
    const userId = getUserId();
    if (!userId) return;
    const ready = docs.filter((d) => d.file);
    if (ready.length === 0 && !bvn.trim()) {
      setError("Add your BVN or at least one document.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // Upload each file to object storage first, then attach the stored URLs.
      const documents = await Promise.all(
        ready.map(async (d) => {
          const up = await api.uploadFile(d.file as File, "kyc");
          return { type: d.type, label: (d.file as File).name, url: up.url };
        }),
      );
      await api.submitVerification(userId, {
        requestedLevel: level as "BVN_VERIFIED" | "FULL" | "BASIC",
        bvn: bvn.trim() || undefined,
        documents,
      });
      await load();
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+: /, ""));
    } finally {
      setBusy(false);
    }
  }

  const levelOptions = data ? LEVELS.slice(LEVELS.indexOf(data.kycLevel) + 1).filter((l) => l !== "NONE") : [];
  const pending = data?.request?.status === "PENDING";
  const rejected = data?.request?.status === "REJECTED";
  const maxedOut = data?.kycLevel === "FULL";

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <Wordmark />
          <Link href="/worker" className="text-sm font-medium text-ink-soft hover:text-ink">&larr; Back</Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Verify your identity</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Verifying unlocks higher payout limits and loan eligibility. Your details are encrypted and only reviewed by our team.
        </p>

        {!data ? (
          <p className="mt-8 text-sm text-ink-muted">Loading…</p>
        ) : (
          <div className="mt-6 space-y-5">
            <Card className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-ink-soft">Current status</p>
                <p className="text-lg font-semibold text-ink">{LEVEL_LABEL[data.kycLevel]}</p>
              </div>
              {maxedOut && <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-700">✓ Verified</span>}
            </Card>

            {maxedOut ? (
              <Card className="p-6 text-center">
                <p className="text-sm text-ink-soft">You&apos;re fully verified. Nothing more to do here.</p>
              </Card>
            ) : pending ? (
              <Card className="p-5">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <p className="font-semibold text-ink">In review</p>
                </div>
                <p className="mt-1 text-sm text-ink-soft">
                  We&apos;re reviewing your {LEVEL_LABEL[data.request!.requestedLevel].toLowerCase()} request. You&apos;ll be notified once it&apos;s decided.
                </p>
                {data.request!.documents.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                    {data.request!.documents.map((d, i) => (
                      <li key={i}>• {d.label}</li>
                    ))}
                  </ul>
                )}
              </Card>
            ) : (
              <Card className="space-y-4 p-5">
                {rejected && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    Your last request was declined: {data.request!.decisionReason}. Please resubmit.
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-ink">Verification level</label>
                  <select value={level} onChange={(e) => setLevel(e.target.value)} className={`mt-1.5 ${input}`}>
                    {levelOptions.map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">BVN or NIN <span className="text-ink-muted">(recommended)</span></label>
                  <input
                    value={bvn}
                    onChange={(e) => setBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    inputMode="numeric"
                    placeholder="11-digit number"
                    className={`mt-1.5 ${input}`}
                  />
                  <p className="mt-1 text-xs text-ink-muted">Stored encrypted — we never keep the raw number.</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-ink">Documents</label>
                  <div className="mt-1.5 space-y-2">
                    {docs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <select value={doc.type} onChange={(e) => setDoc(i, { type: e.target.value })} className={`${input} max-w-[46%]`}>
                          {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input
                          ref={(el) => { fileRefs.current[i] = el; }}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          className="hidden"
                          onChange={(e) => setDoc(i, { file: e.target.files?.[0] ?? null })}
                        />
                        <button
                          type="button"
                          onClick={() => fileRefs.current[i]?.click()}
                          className="flex-1 truncate rounded-lg border border-dashed border-line px-3 py-2 text-left text-sm text-ink-soft hover:border-brand-500"
                        >
                          {doc.file?.name ?? "Choose file…"}
                        </button>
                        {docs.length > 1 && (
                          <button type="button" onClick={() => setDocs((d) => d.filter((_, idx) => idx !== i))} className="text-ink-muted hover:text-red-600" aria-label="Remove">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={() => setDocs((d) => [...d, { type: "SELFIE", file: null }])} className="mt-2 text-sm font-medium text-brand-600 hover:text-brand-700">
                    + Add another document
                  </button>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}
                <Button onClick={submit} disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
