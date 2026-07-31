"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState } from "./ui";

export interface ViewData {
  grant: { id: string; mode: "READ" | "WRITE"; expiresAt: string | null };
  user: {
    id: string;
    fullName: string | null;
    phone: string;
    email: string | null;
    language: string;
    status: string;
    kycLevel: string;
    hasSmartphone: boolean;
  } | null;
  score: { score: number; tier: string; jobsCompleted: number; onTimeRate: number } | null;
  notifications: Array<{ id: string; title: string | null; body: string; readAt: string | null; createdAt: string }>;
  disputes: Array<{ id: string; code: string; title: string; status: string; createdAt: string }>;
}

const LANGUAGES = ["EN", "PCM", "YO", "HA", "IG"];
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export function ImpersonationView({ data }: { data: ViewData }) {
  const router = useRouter();
  const write = data.grant.mode === "WRITE";
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState(data.user?.language ?? "EN");

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch(`/api/impersonation/${data.grant.id}/act`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Action failed");
      setFlash(body.result ?? "Done");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!data.user) return <EmptyState>User not found.</EmptyState>;

  return (
    <Card className="overflow-hidden">
      {/* Session banner */}
      <div className={`flex flex-wrap items-center justify-between gap-2 px-5 py-3 ${write ? "bg-red-500/10" : "bg-brand-500/10"}`}>
        <div className="flex items-center gap-2 text-sm">
          <Badge tone={write ? "red" : "indigo"}>{write ? "Acting as" : "Viewing as"}</Badge>
          <span className="font-medium">{data.user.fullName ?? data.user.phone}</span>
          <span className="text-muted">— {write ? "changes are made on their behalf and audited" : "read-only"}</span>
        </div>
        <div className="flex items-center gap-3">
          {data.grant.expiresAt && (
            <span className="text-xs text-muted">Session ends {when(data.grant.expiresAt)}</span>
          )}
          <Button size="sm" variant="outline" onClick={() => router.push("/impersonation")}>End</Button>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-2">
        {/* Profile + score */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Phone" value={data.user.phone} mono />
            <Field label="Email" value={data.user.email ?? "—"} />
            <Field label="Status" value={data.user.status.toLowerCase()} />
            <Field label="KYC" value={data.user.kycLevel.replace("_", " ").toLowerCase()} />
            <Field label="Language" value={data.user.language} />
            <Field label="Smartphone" value={data.user.hasSmartphone ? "Yes" : "No"} />
          </div>
          {data.score && (
            <div className="rounded-xl border border-app p-4">
              <p className="eyebrow">Reliability</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{data.score.score}</p>
              <p className="text-sm text-soft">
                {data.score.tier.toLowerCase()} · {data.score.jobsCompleted} jobs · {Math.round(data.score.onTimeRate * 100)}% on time
              </p>
            </div>
          )}

          {write && (
            <div className="rounded-xl border border-app p-4">
              <p className="mb-2 text-sm font-semibold">Act on their behalf</p>
              {flash && <p className="mb-2 text-sm text-green-600">{flash}</p>}
              {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => act("mark_notifications_read")}>
                  Mark notifications read
                </Button>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="rounded-lg border border-app surface px-2 py-1.5 text-sm"
                >
                  {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <Button size="sm" variant="outline" disabled={busy || language === data.user.language} onClick={() => act("set_language", { language })}>
                  Set language
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Their notifications + disputes */}
        <div className="space-y-4">
          <div>
            <p className="eyebrow mb-2">Recent notifications</p>
            {data.notifications.length === 0 ? (
              <p className="text-sm text-muted">None.</p>
            ) : (
              <div className="space-y-2">
                {data.notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="rounded-lg border border-app px-3 py-2">
                    {n.title && <p className="text-sm font-medium">{n.title}</p>}
                    <p className="text-sm text-soft">{n.body}</p>
                    <p className="mt-0.5 text-xs text-muted">{when(n.createdAt)}{n.readAt ? "" : " · unread"}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="eyebrow mb-2">Their cases</p>
            {data.disputes.length === 0 ? (
              <p className="text-sm text-muted">None.</p>
            ) : (
              <div className="space-y-2">
                {data.disputes.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-lg border border-app px-3 py-2 text-sm">
                    <span><span className="font-mono text-xs text-muted">{d.code}</span> · {d.title}</span>
                    <Badge tone="neutral">{d.status.replace(/_/g, " ").toLowerCase()}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`mt-0.5 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
    </div>
  );
}
