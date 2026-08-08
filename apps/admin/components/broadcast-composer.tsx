"use client";

import { useEffect, useRef, useState } from "react";
import { Badge, Button, Card } from "./ui";

// Swap this for your brand token / config if you centralise it elsewhere.
const APP_NAME = "Provira";

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

// Channels that carry real cost or a deliverability catch worth flagging.
const CHANNEL_NOTES: Partial<Record<Channel, string>> = {
  SMS: "Billed per segment. Long messages split into multiple texts.",
  WHATSAPP: "Only reaches users who opted in. Everyone else is skipped.",
};

// Preview order — controls the tabs above the live preview.
const PREVIEW_ORDER: Channel[] = ["INAPP", "PUSH", "EMAIL", "WHATSAPP", "SMS"];

const SMS_SEGMENT = 160; // GSM-7 single-segment length (approximate; concatenated SMS uses 153/segment).

type Result = { recipients: number; sends: number };

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

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
  const [previewChannel, setPreviewChannel] = useState<Channel>("INAPP");

  function toggleChannel(c: Channel) {
    setChannels((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  }

  function selectAllChannels() {
    setChannels(CHANNELS.map((c) => c.value));
  }

  function clearChannels() {
    setChannels([]);
  }

  // Any edit to the outgoing message invalidates a pending confirmation and any
  // stale success/error banner, so the admin can never confirm a draft they've
  // since changed.
  useEffect(() => {
    setConfirming(false);
    setResult(null);
    setError(null);
  }, [audience, role, userId, channels, title, body]);

  const trimmedBody = body.trim();
  const trimmedTitle = title.trim();

  const canSend =
    trimmedBody.length > 0 &&
    channels.length > 0 &&
    (audience !== "USER" || userId.trim().length > 0);

  // Tell the admin *why* the button is inert instead of leaving them guessing.
  const blockReason =
    trimmedBody.length === 0
      ? "Write a message to continue."
      : channels.length === 0
        ? "Pick at least one channel."
        : audience === "USER" && userId.trim().length === 0
          ? "Enter a user ID to target."
          : null;

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
          title: trimmedTitle,
          body: trimmedBody,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(data.message || (res.status === 403 ? "You don't have permission to broadcast." : "Send failed. Try again."));
      setResult(data as Result);
      setConfirming(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  // Clear the message for a fresh broadcast, keeping audience + channels so the
  // admin can fire a similar one without re-picking everything.
  function reset() {
    setTitle("");
    setBody("");
    setResult(null);
    setError(null);
    setConfirming(false);
  }

  // Cmd/Ctrl+Enter sends. A ref keeps the handler pointed at the latest state
  // without re-binding the listener on every keystroke.
  const triggerRef = useRef<() => void>(() => {});
  triggerRef.current = () => {
    if (!canSend || busy) return;
    if (confirming) send();
    else setConfirming(true);
  };
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        triggerRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const audienceLabel =
    audience === "ALL"
      ? "everyone"
      : audience === "ROLE"
        ? `all ${role.toLowerCase()}s`
        : userId.trim()
          ? `user ${userId.trim()}`
          : "one user";

  const channelLabels = channels
    .map((c) => CHANNELS.find((x) => x.value === c)?.label)
    .filter(Boolean)
    .join(", ");

  // SMS text as the recipient sees it, plus segment maths for the counter.
  const smsText = (trimmedTitle ? `${trimmedTitle}: ` : "") + trimmedBody;
  const smsSegments = smsText.length === 0 ? 0 : Math.ceil(smsText.length / SMS_SEGMENT);

  // Keep the preview tab pointed at a channel that's actually selected.
  const activePreview = channels.includes(previewChannel) ? previewChannel : channels[0];
  const previewTabs = PREVIEW_ORDER.filter((c) => channels.includes(c));

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Send a broadcast</h2>
          <p className="mt-0.5 text-sm text-soft">
            A one-off message, no template. Channels a user can't receive are skipped for them.
          </p>
        </div>
        <Badge tone="indigo">Audited</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
        {/* ---- Composer ---- */}
        <div className="space-y-5">
          {/* Audience */}
          <div>
            <p className="eyebrow mb-2">Audience</p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCES.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  aria-pressed={audience === a.value}
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
                    aria-pressed={role === r}
                    onClick={() => setRole(r)}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                      role === r
                        ? "border-brand-500 bg-brand-500/10 text-brand-600 dark:text-brand-300"
                        : "border-app surface text-soft hover:text-[color:var(--text)]"
                    }`}
                  >
                    {titleCase(r)}
                  </button>
                ))}
              </div>
            )}
            {audience === "USER" && (
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="User ID"
                aria-label="Target user ID"
                className="mt-3 w-full rounded-xl border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            )}
          </div>

          {/* Channels */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="eyebrow">
                Channels{channels.length > 0 && <span className="ml-1.5 text-muted">· {channels.length} on</span>}
              </p>
              <button
                type="button"
                onClick={channels.length === CHANNELS.length ? clearChannels : selectAllChannels}
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-300"
              >
                {channels.length === CHANNELS.length ? "Clear" : "Select all"}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CHANNELS.map((c) => {
                const on = channels.includes(c.value);
                return (
                  <button
                    key={c.value}
                    type="button"
                    aria-pressed={on}
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
            {/* Cost / deliverability notes only for the channels actually chosen. */}
            {channels.some((c) => CHANNEL_NOTES[c]) && (
              <ul className="mt-2 space-y-1">
                {channels
                  .filter((c) => CHANNEL_NOTES[c])
                  .map((c) => (
                    <li key={c} className="flex gap-1.5 text-[11px] text-muted">
                      <span className="text-amber-500">•</span>
                      <span>
                        <strong className="font-medium">{CHANNELS.find((x) => x.value === c)?.label}:</strong>{" "}
                        {CHANNEL_NOTES[c]}
                      </span>
                    </li>
                  ))}
              </ul>
            )}
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
                aria-label="Broadcast title"
                className="w-full rounded-xl border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              {channels.includes("SMS") && (
                <p className="mt-1 text-[11px] text-muted">SMS has no title — it's prepended to the message text.</p>
              )}
            </div>
            <div>
              <p className="eyebrow mb-2">Message</p>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                placeholder="What do you want to tell them?"
                aria-label="Broadcast message"
                className="w-full resize-y rounded-xl border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                <span>
                  {channels.includes("SMS") && smsSegments > 0 && (
                    <span className={smsSegments > 1 ? "text-amber-600 dark:text-amber-400" : ""}>
                      SMS: {smsSegments} segment{smsSegments === 1 ? "" : "s"} ({smsText.length} chars)
                    </span>
                  )}
                </span>
                <span>{body.length} characters</span>
              </div>
            </div>
          </div>
        </div>

        {/* ---- Live preview ---- */}
        <div className="lg:border-l lg:border-app lg:pl-6">
          <div className="mb-3 flex items-center justify-between">
            <p className="eyebrow">Preview</p>
            {previewTabs.length > 1 && (
              <div className="flex gap-1">
                {previewTabs.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setPreviewChannel(c)}
                    className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition ${
                      activePreview === c
                        ? "bg-brand-500/15 text-brand-600 dark:text-brand-300"
                        : "text-muted hover:text-[color:var(--text)]"
                    }`}
                  >
                    {CHANNELS.find((x) => x.value === c)?.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-app bg-[color:var(--bg-muted,transparent)] p-4">
            {!activePreview ? (
              <p className="py-8 text-center text-sm text-muted">Pick a channel to preview it.</p>
            ) : (
              <ChannelPreview
                channel={activePreview}
                title={trimmedTitle}
                body={trimmedBody}
                smsText={smsText}
              />
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted">Delivering to {audienceLabel}.</p>
        </div>
      </div>

      {/* Confirmation banner */}
      {confirming && !result && (
        <div className="mt-5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="font-medium">You're about to message real users.</p>
          <p className="mt-0.5 text-soft">
            Sending to <strong>{audienceLabel}</strong> over <strong>{channelLabels}</strong>.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-app pt-4">
        <div className="text-sm">
          {result ? (
            <span className="text-emerald-600 dark:text-emerald-400">
              Sent to {result.recipients} {result.recipients === 1 ? "person" : "people"} · {result.sends}{" "}
              {result.sends === 1 ? "delivery" : "deliveries"}
            </span>
          ) : error ? (
            <span className="text-red-600">{error}</span>
          ) : blockReason ? (
            <span className="text-muted">{blockReason}</span>
          ) : (
            <span className="text-muted">Check the audience before you send. ⌘/Ctrl + Enter sends.</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {result ? (
            <Button size="sm" onClick={reset}>
              Send another
            </Button>
          ) : (
            <>
              {confirming && (
                <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={busy}>
                  Cancel
                </Button>
              )}
              <Button disabled={!canSend || busy} onClick={() => (confirming ? send() : setConfirming(true))}>
                {busy ? "Sending…" : confirming ? "Confirm & send" : "Send broadcast"}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

/** Renders the message the way it lands on the selected channel. */
function ChannelPreview({
  channel,
  title,
  body,
  smsText,
}: {
  channel: Channel;
  title: string;
  body: string;
  smsText: string;
}) {
  const heading = title || "Title";
  const text = body || "Your message shows up here as you type.";
  const faded = !body;

  if (channel === "INAPP") {
    return (
      <div className="flex gap-3">
        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-500 text-xs font-bold text-white">
          {APP_NAME.charAt(0)}
        </div>
        <div className="min-w-0">
          {title && <p className="truncate text-sm font-semibold">{heading}</p>}
          <p className={`text-sm ${faded ? "text-muted" : "text-soft"}`}>{text}</p>
          <p className="mt-1 text-[11px] text-muted">now</p>
        </div>
      </div>
    );
  }

  if (channel === "PUSH") {
    return (
      <div className="rounded-xl border border-app bg-[color:var(--surface,rgba(0,0,0,0.03))] px-3 py-2 shadow-sm">
        <div className="mb-1 flex items-center justify-between text-[11px] text-muted">
          <span className="flex items-center gap-1.5">
            <span className="grid h-4 w-4 place-items-center rounded bg-brand-500 text-[9px] font-bold text-white">
              {APP_NAME.charAt(0)}
            </span>
            {APP_NAME.toUpperCase()}
          </span>
          <span>now</span>
        </div>
        {title && <p className="text-sm font-semibold leading-snug">{heading}</p>}
        <p className={`text-sm leading-snug ${faded ? "text-muted" : ""}`}>{text}</p>
      </div>
    );
  }

  if (channel === "EMAIL") {
    return (
      <div className="text-sm">
        <p className="text-[11px] text-muted">From</p>
        <p className="font-medium">{APP_NAME} &lt;no-reply@{APP_NAME.toLowerCase()}.app&gt;</p>
        <p className="mt-2 text-[11px] text-muted">Subject</p>
        <p className="font-semibold">{title || "(no subject)"}</p>
        <hr className="my-3 border-app" />
        <p className={`whitespace-pre-wrap leading-relaxed ${faded ? "text-muted" : "text-soft"}`}>{text}</p>
      </div>
    );
  }

  // SMS + WhatsApp both render as a chat bubble; SMS uses the flattened text.
  const bubbleText = channel === "SMS" ? smsText || text : title ? `${title}\n${text}` : text;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted">{channel === "WHATSAPP" ? "WhatsApp" : "SMS"}</span>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tl-sm px-3 py-2 text-sm ${
          channel === "WHATSAPP"
            ? "bg-emerald-500/15 text-[color:var(--text)]"
            : "bg-brand-500/10 text-[color:var(--text)]"
        } ${faded ? "text-muted" : ""}`}
      >
        {bubbleText}
      </div>
    </div>
  );
}