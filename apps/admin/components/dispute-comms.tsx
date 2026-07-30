"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "./ui";

const input =
  "w-full rounded-lg border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500";

async function post(id: string, action: string, extra: Record<string, unknown>) {
  const res = await fetch(`/api/disputes/${id}/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action, ...extra }),
  });
  if (!res.ok) {
    const msg = res.status === 403 ? "Not permitted" : (await res.json().catch(() => ({}))).message ?? "Failed";
    throw new Error(Array.isArray(msg) ? msg[0] : msg);
  }
}

/** Composer for a user-visible reply on the case conversation. */
export function ReplyForm({ id }: { id: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setError(null);
    try {
      await post(id, "reply", { body });
      setBody("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
        className={input}
        placeholder="Reply to the user…"
      />
      <div className="mt-2 flex items-center gap-3">
        <Button size="sm" disabled={!body.trim() || busy} onClick={send}>
          {busy ? "Sending…" : "Send reply"}
        </Button>
        <span className="text-xs text-muted">Visible to the user.</span>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    </div>
  );
}

/** Attach a piece of evidence (a label + a link to the stored file). */
export function EvidenceForm({ id }: { id: string }) {
  const router = useRouter();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function attach() {
    setBusy(true);
    setError(null);
    try {
      await post(id, "evidence", { label, url });
      setLabel("");
      setUrl("");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
      <input value={label} onChange={(e) => setLabel(e.target.value)} className={input} placeholder="Label" />
      <input value={url} onChange={(e) => setUrl(e.target.value)} className={input} placeholder="https://…" />
      <Button size="sm" variant="outline" disabled={!label.trim() || !url.trim() || busy} onClick={attach}>
        {busy ? "…" : "Attach"}
      </Button>
      {error && <span className="text-xs text-red-600 sm:col-span-3">{error}</span>}
    </div>
  );
}
