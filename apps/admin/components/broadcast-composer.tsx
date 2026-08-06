"use client";

import { useState } from "react";
import { Badge, Button, Card } from "./ui";

type Channel = "INAPP" | "PUSH" | "SMS" | "EMAIL" | "WHATSAPP";
type Audience = "ALL" | "ROLE" | "USER";
type Role = "WORKER" | "TRADER" | "EMPLOYER";

const CHANNELS: { value: Channel; label: string; hint: string }[] = [
  { value: "INAPP", label: "In-app", hint: "Notification feed" },
  { value: "PUSH", label: "Push", hint: "Mobile devices" },
  { value: "SMS", label: "SMS", hint: "Text message" },
  { value: "EMAIL", label: "Email", hint: "Inbox" },
  { value: "WHATSAPP", label: "WhatsApp", hint: "Opted-in only" },
];

const ROLES: Role[] = ["WORKER", "TRADER", "EMPLOYER"];

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: "ALL", label: "Everyone" },
  { value: "ROLE", label: "By role" },
  { value: "USER", label: "A single user" },
];

type Result = { recipients: number; sends: number };

/**
 * Compose and send a custom (non-templated) broadcast to an audience over any
 * mix of channels. Posts to the admin BFF, which forwards to the API's
 * notifications:manage-gated endpoint. Undeliverable channels for a given user
 * (no email, no push device, not WhatsApp-opted-in) are silently skipped
 * server-side, so `sends` can be lower than recipients × channels.
 */
export function BroadcastComposer() {
  const [audience, setAudience] = useState<Audience>("ALL");
  const [role, setRole] = useState<Role>("WORKER");
  const [userId, setUserId] = useState("");
  const [channels, setChannels] = useState<Channel[]>(["INAPP"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [confirming, setConfirming] = useState(false);

  function toggleChannel(c: Channel) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  const canSend =
    body.trim().length > 0 &&
    channels.length > 0 &&
    (audience !== "USER" || userId.trim().length > 0);

  async function send() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/notifications/broadcast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          audience,
          role: audience === "ROLE" ? role : undefined,
          userId: audience === "USER" ? userId.trim() : undefined,
          channels,
          title: title.trim(),
          body: body.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || (res.status === 403 ? "Not permitted" : "Failed to send"));
      setResult(data as Result);
      setConfirming(false);
      // Keep the message so the admin can see what was sent; clear the recipient target.
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const audienceLabel =
    audience === "ALL" ? "everyone" : audience === "ROLE" ? `all ${role.toLowerCase()}s` : "one user";

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Send a broadcast</h2>
          <p className="mt-0.5 text-sm text-soft">
            A one-off message — no template. Undeliverable channels are skipped per user.
          </p>
        </div>
        <Badge tone="indigo">Audited</Badge>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-5">
          {/* Audience */}
          <div>
            <p className="eyebrow mb-2">Audience</p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAudience(a.value)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                    audience === a.value
                      ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                      : "border-app surface text-soft hover:text-[color:var(--text)]"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
            {audience === "ROLE" && (
              <div className="mt-3 flex flex-wrap gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                      role === r
                        ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                        : "border-app surface text-soft hover:text-[color:var(--text)]"
                    }`}
                  >
                    {r.charAt(0) + r.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            )}
            {audience === "USER" && (
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
                className="mt-3 w-full rounded-xl border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            )}
          </div>

          {/* Channels */}
          <div>
            <p className="eyebrow mb-2">Channels</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CHANNELS.map((c) => {
                const on = channels.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => toggleChannel(c.value)}
                    className={`flex flex-col items-start rounded-xl border px-3 py-2 text-left transition ${
                      on
                        ? "border-brand-500 bg-brand-500/10"
                        : "border-app surface hover:border-brand-500/40"
                    }`}
                  >
                    <span className={`text-sm font-semibold ${on ? "text-brand-600 dark:text-brand-300" : ""}`}>
                      {c.label}
                    </span>
                    <span className="text-[11px] text-muted">{c.hint}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <div>
            <p className="eyebrow mb-2">Title (optional)</p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Scheduled maintenance"
              maxLength={120}
              className="w-full rounded-xl border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <p className="eyebrow mb-2">Message</p>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="What do you want to tell them?"
              className="w-full resize-y rounded-xl border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <p className="mt-1 text-right text-[11px] text-muted">{body.length} characters</p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-app pt-4">
        <div className="text-sm text-soft">
          {result ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              ✓ Sent to {result.recipients} {result.recipients === 1 ? "person" : "people"} ({result.sends} deliveries)
            </span>
          ) : error ? (
            <span className="text-red-600">{error}</span>
          ) : confirming ? (
            <span>
              Send to <strong>{audienceLabel}</strong> over{" "}
              <strong>{channels.map((c) => CHANNELS.find((x) => x.value === c)?.label).join(", ")}</strong>?
            </span>
          ) : (
            <span className="text-muted">Double-check the audience before sending — this reaches real users.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {confirming && (
            <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
              Cancel
            </Button>
          )}
          <Button
            disabled={!canSend || busy}
            onClick={() => (confirming ? send() : setConfirming(true))}
          >
            {busy ? "Sending…" : confirming ? "Confirm & send" : "Send broadcast"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
