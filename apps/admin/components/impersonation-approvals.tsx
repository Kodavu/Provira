"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, EmptyState } from "./ui";

interface Pending {
  id: string;
  mode: "READ" | "WRITE";
  reason: string;
  createdAt: string;
  requestedBy: { fullName: string } | null;
  targetUser: { fullName: string | null; phone: string } | null;
}

const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export function ImpersonationApprovals({ pending }: { pending: Pending[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/impersonation/${id}/approve`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not approve");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (pending.length === 0) return <EmptyState>No requests waiting for approval.</EmptyState>;

  return (
    <div className="space-y-3">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {pending.map((g) => (
        <Card key={g.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium">{g.targetUser?.fullName ?? "User"}</span>
              <span className="font-mono text-xs text-muted">{g.targetUser?.phone}</span>
              <Badge tone="red">act as</Badge>
            </div>
            <p className="mt-1 text-sm text-soft">{g.reason}</p>
            <p className="mt-0.5 text-xs text-muted">
              Requested by {g.requestedBy?.fullName ?? "an admin"} · {when(g.createdAt)}
            </p>
          </div>
          <Button size="sm" disabled={busy === g.id} onClick={() => approve(g.id)}>
            {busy === g.id ? "…" : "Approve"}
          </Button>
        </Card>
      ))}
    </div>
  );
}
