"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState } from "./ui";

export interface Grant {
  id: string;
  mode: "READ" | "WRITE";
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CONSUMED" | "EXPIRED";
  createdAt: string;
  expiresAt: string | null;
  active: boolean;
  targetUser: { fullName: string | null; phone: string } | null;
}

const STATUS_TONE: Record<Grant["status"], "neutral" | "amber" | "green" | "red" | "indigo"> = {
  PENDING: "amber", APPROVED: "indigo", REJECTED: "red", CONSUMED: "green", EXPIRED: "neutral",
};
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export function ImpersonationGrants({ grants }: { grants: Grant[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function consume(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/impersonation/${id}/consume`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not start session");
      window.open(`/impersonate/${id}`, "_blank", "noopener,noreferrer");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (grants.length === 0)
    return <EmptyState>No access yet. Start a &quot;View as&quot; or request &quot;act as&quot; from the Users list.</EmptyState>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {grants.map((g) => (
        <Card key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{g.targetUser?.fullName ?? "User"}</span>
              <span className="font-mono text-xs text-muted">{g.targetUser?.phone}</span>
              <Badge tone={g.mode === "WRITE" ? "red" : "indigo"}>{g.mode === "WRITE" ? "act as" : "view as"}</Badge>
              <Badge tone={STATUS_TONE[g.status]}>{g.active ? "active" : g.status.toLowerCase()}</Badge>
            </div>
            <p className="mt-1 text-sm text-soft">{g.reason}</p>
            <p className="mt-0.5 text-xs text-muted">{when(g.createdAt)}</p>
          </div>
          <div className="flex gap-2">
            {g.status === "APPROVED" && (
              <Button size="sm" disabled={busy === g.id} onClick={() => consume(g.id)}>
                {busy === g.id ? "…" : "Start session"}
              </Button>
            )}
            {g.active && (
              <Button size="sm" variant="outline" onClick={() => window.open(`/impersonate/${g.id}`, "_blank", "noopener,noreferrer")}>
                Open window
              </Button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}
