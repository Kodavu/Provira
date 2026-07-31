"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

export function WithdrawalActions({ id }: { id: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "approve" | "reject", body?: unknown) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/finance/withdrawals/${id}/${action}`, {
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

  if (mode === "reject") {
    return (
      <div className="flex items-center justify-end gap-2">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason"
          className="w-40 rounded-lg border border-app surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
        />
        <Button size="sm" variant="danger" disabled={busy !== null} onClick={() => run("reject", { reason })}>
          {busy === "reject" ? "…" : "Confirm"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setMode("idle"); setError(null); }}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      <Button size="sm" disabled={busy !== null} onClick={() => run("approve")}>
        {busy === "approve" ? "…" : "Approve"}
      </Button>
      <Button size="sm" variant="outline" onClick={() => setMode("reject")}>Reject</Button>
    </div>
  );
}
