"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

// Per-user impersonation launcher. "View as" (READ) is auto-approved and starts
// immediately; "Act as" (WRITE) files a request that a second admin must approve.
export function ImpersonateUser({ userId, userName }: { userId: string; userName: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "act">("idle");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function request(m: "READ" | "WRITE", why: string) {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/impersonation", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, mode: m, reason: why }),
    });
    const grant = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(grant.message || "Failed");
      setBusy(false);
      return null;
    }
    return grant as { id: string };
  }

  async function viewAs() {
    const grant = await request("READ", `Support view of ${userName}`);
    if (!grant) return;
    // READ is auto-approved — start the session and jump straight in.
    const res = await fetch(`/api/impersonation/${grant.id}/consume`, { method: "POST" });
    if (!res.ok) {
      setError("Could not start session");
      setBusy(false);
      return;
    }
    router.push(`/impersonation?session=${grant.id}`);
  }

  async function requestActAs() {
    if (!reason.trim()) {
      setError("A reason is required");
      return;
    }
    const grant = await request("WRITE", reason.trim());
    if (!grant) return;
    setBusy(false);
    setMode("idle");
    setReason("");
    setNote("Request sent for approval");
    router.refresh();
  }

  if (mode === "act") {
    return (
      <div className="flex items-center justify-end gap-2">
        <input
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for acting as this user"
          className="w-56 rounded-lg border border-app surface px-2.5 py-1.5 text-sm outline-none focus:border-brand-500"
        />
        <Button size="sm" disabled={busy} onClick={requestActAs}>{busy ? "…" : "Send"}</Button>
        <Button size="sm" variant="outline" onClick={() => { setMode("idle"); setError(null); }}>Cancel</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {error && <span className="text-xs text-red-600">{error}</span>}
      {note && <span className="text-xs text-green-600">{note}</span>}
      <Button size="sm" variant="outline" disabled={busy} onClick={viewAs}>View as</Button>
      <Button size="sm" variant="outline" onClick={() => { setMode("act"); setNote(null); }}>Act as…</Button>
    </div>
  );
}
