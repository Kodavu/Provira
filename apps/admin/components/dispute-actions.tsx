"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "./ui";

interface Staff {
  id: string;
  fullName: string;
  department: string | null;
}

export interface DisputePerms {
  assign: boolean;
  escalate: boolean;
  resolve: boolean;
  close: boolean;
  note: boolean;
}

export function DisputeActions({
  id,
  status,
  assignedAdminId,
  perms,
  staff,
  jobDispute = false,
}: {
  id: string;
  status: string;
  assignedAdminId: string | null;
  perms: DisputePerms;
  staff: Staff[];
  jobDispute?: boolean;
}) {
  const router = useRouter();
  const [assignee, setAssignee] = useState(assignedAdminId ?? "");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Escrow outcome for job disputes.
  const [splitOpen, setSplitOpen] = useState(false);
  const [releaseNaira, setReleaseNaira] = useState("");
  const [refundNaira, setRefundNaira] = useState("");

  const terminal = status === "CLOSED";
  const nothing = !perms.assign && !perms.escalate && !perms.resolve && !perms.close && !perms.note;

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/disputes/${id}/action`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) throw new Error(res.status === 403 ? "Not permitted" : "Action failed");
      setReason("");
      setNote("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (nothing)
    return (
      <Card className="p-5">
        <p className="text-sm text-muted">You have read-only access to this case.</p>
      </Card>
    );

  const input =
    "w-full rounded-lg border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <Card className="space-y-5 p-5">
      <h3 className="font-semibold">Take action</h3>

      {perms.assign && (
        <div>
          <label className="eyebrow">Assign to</label>
          <div className="mt-1.5 flex gap-2">
            <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={input}>
              <option value="">Select an admin…</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}{s.department ? ` · ${s.department}` : ""}
                </option>
              ))}
            </select>
            <Button size="sm" disabled={!assignee || busy === "assign"} onClick={() => run("assign", { adminUserId: assignee })}>
              {busy === "assign" ? "…" : "Assign"}
            </Button>
          </div>
        </div>
      )}

      {!terminal && (
        <div>
          <label className="eyebrow">Reason (optional, attached to the action)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className={`mt-1.5 ${input}`} placeholder="Why are you taking this action?" />
          <div className="mt-2 flex flex-wrap gap-2">
            {perms.assign && (
              <>
                <Button size="sm" variant="outline" disabled={busy !== null || status === "UNDER_REVIEW"} onClick={() => run("status", { status: "UNDER_REVIEW" })}>Under review</Button>
                <Button size="sm" variant="outline" disabled={busy !== null || status === "WAITING_FOR_USER"} onClick={() => run("status", { status: "WAITING_FOR_USER" })}>Waiting for user</Button>
              </>
            )}
            {perms.escalate && <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => run("escalate", { note: reason })}>Escalate</Button>}
            {perms.resolve && !jobDispute && <Button size="sm" disabled={busy !== null} onClick={() => run("resolve", { note: reason })}>Resolve</Button>}
            {perms.close && <Button size="sm" variant="danger" disabled={busy !== null} onClick={() => run("close", { note: reason })}>Close</Button>}
          </div>

          {/* Escrow settlement — only for job disputes with held funds. */}
          {perms.resolve && jobDispute && !terminal && (
            <div className="mt-3 rounded-lg border border-app p-3">
              <p className="eyebrow">Resolve & settle escrow</p>
              <p className="mt-1 text-xs text-muted">Choose how the money held for this job is released.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button size="sm" disabled={busy !== null} onClick={() => run("resolve", { note: reason, resolution: { outcome: "REFUND_EMPLOYER" } })}>
                  {busy === "resolve" ? "…" : "Refund employer"}
                </Button>
                <Button size="sm" disabled={busy !== null} onClick={() => run("resolve", { note: reason, resolution: { outcome: "RELEASE_WORKER" } })}>
                  Release to worker
                </Button>
                <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => setSplitOpen((v) => !v)}>
                  Split…
                </Button>
              </div>
              {splitOpen && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-xs text-muted">To worker (₦)</span>
                    <input value={releaseNaira} onChange={(e) => setReleaseNaira(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className={input} placeholder="0" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-28 text-xs text-muted">To employer (₦)</span>
                    <input value={refundNaira} onChange={(e) => setRefundNaira(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" className={input} placeholder="0" />
                  </div>
                  <p className="text-xs text-muted">Amounts must add up to the escrow still held for this job.</p>
                  <Button
                    size="sm"
                    disabled={busy !== null || (!releaseNaira && !refundNaira)}
                    onClick={() =>
                      run("resolve", {
                        note: reason,
                        resolution: {
                          outcome: "SPLIT",
                          releaseAmount: String(Math.round(Number(releaseNaira || 0) * 100)),
                          refundAmount: String(Math.round(Number(refundNaira || 0) * 100)),
                        },
                      })
                    }
                  >
                    {busy === "resolve" ? "…" : "Resolve with split"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {perms.note && (
        <div className="border-t border-app pt-4">
          <label className="eyebrow">Internal note</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={`mt-1.5 ${input}`} placeholder="Add a note for the team…" />
          <div className="mt-2">
            <Button size="sm" variant="outline" disabled={!note.trim() || busy === "note"} onClick={() => run("note", { note })}>
              {busy === "note" ? "…" : "Add internal note"}
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}
