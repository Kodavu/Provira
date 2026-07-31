"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "./ui";

export function VerificationActions({
  id,
  canApprove,
  canReject,
}: {
  id: string;
  canApprove: boolean;
  canReject: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject", body?: unknown) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/verification/${id}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body ?? {}),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || (res.status === 403 ? "Not permitted" : "Failed"));
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  }

  if (!canApprove && !canReject)
    return <Card className="p-5"><p className="text-sm text-muted">You have review-only access.</p></Card>;

  return (
    <Card className="space-y-3 p-5">
      <h3 className="font-semibold">Decision</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mode === "reject" ? (
        <div className="space-y-2">
          <textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why is this being rejected? (shared with the user)"
            className="w-full rounded-lg border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="danger" disabled={busy !== null} onClick={() => run("reject", { reason })}>
              {busy === "reject" ? "…" : "Confirm rejection"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setMode("idle"); setError(null); }}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {canApprove && (
            <Button size="sm" disabled={busy !== null} onClick={() => run("approve")}>
              {busy === "approve" ? "…" : "Approve"}
            </Button>
          )}
          {canReject && (
            <Button size="sm" variant="outline" onClick={() => setMode("reject")}>Reject</Button>
          )}
        </div>
      )}
    </Card>
  );
}
