"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card } from "./ui";

type Channel = "INAPP" | "EMAIL" | "SMS" | "WHATSAPP" | "IVR" | "PUSH";
type Language = "EN" | "PCM" | "YO" | "HA" | "IG";

interface EventDef {
  eventKey: string;
  category: "SECURITY" | "TRANSACTIONAL" | "ACTIVITY" | "MARKETING";
  channels: Channel[];
  defaults: { title?: string; body: string };
}
interface Template {
  id: string;
  eventKey: string;
  channel: Channel;
  language: Language;
  subject: string | null;
  body: string;
  isActive: boolean;
}

const CATEGORY_TONE: Record<EventDef["category"], "neutral" | "amber" | "green" | "red" | "indigo"> = {
  SECURITY: "red",
  TRANSACTIONAL: "green",
  ACTIVITY: "indigo",
  MARKETING: "amber",
};

// Sample values for the live preview, covering the placeholders used across events.
const SAMPLE: Record<string, string> = {
  code: "DSP-1042",
  preview: "We've released your payment…",
  amount: "NGN 8,000",
  title: "Warehouse loading (1 day)",
  pay: "NGN 8,000",
  location: "Ikeja",
  disputeId: "abc12345",
};

function interpolate(tpl: string): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => SAMPLE[k] ?? `{${k}}`);
}

// Channels that carry a title/subject (SMS/IVR are body-only).
const HAS_SUBJECT: Channel[] = ["INAPP", "EMAIL", "PUSH"];
const CHANNEL_LABEL: Record<Channel, string> = {
  INAPP: "In-app", EMAIL: "Email", SMS: "SMS", WHATSAPP: "WhatsApp", IVR: "Voice (IVR)", PUSH: "Push",
};

const slotKey = (e: string, c: Channel, l: Language) => `${e}|${c}|${l}`;

export function TemplateManager({
  events,
  languages,
  templates,
}: {
  events: EventDef[];
  languages: Language[];
  templates: Template[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(events[0]?.eventKey ?? "");
  const [lang, setLang] = useState<Record<string, Language>>({}); // per channel
  const [drafts, setDrafts] = useState<Record<string, { subject: string; body: string }>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byKey = useMemo(() => {
    const m = new Map<string, Template>();
    for (const t of templates) m.set(slotKey(t.eventKey, t.channel, t.language), t);
    return m;
  }, [templates]);

  const customCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of templates) m.set(t.eventKey, (m.get(t.eventKey) ?? 0) + 1);
    return m;
  }, [templates]);

  const event = events.find((e) => e.eventKey === selected);

  function langFor(channel: Channel): Language {
    return lang[`${selected}|${channel}`] ?? "EN";
  }

  function draftFor(channel: Channel, l: Language, def: EventDef) {
    const key = slotKey(selected, channel, l);
    if (drafts[key]) return drafts[key];
    const tpl = byKey.get(key);
    return {
      subject: tpl?.subject ?? (HAS_SUBJECT.includes(channel) ? def.defaults.title ?? "" : ""),
      body: tpl?.body ?? def.defaults.body,
    };
  }

  function setDraft(channel: Channel, l: Language, patch: Partial<{ subject: string; body: string }>, def: EventDef) {
    const key = slotKey(selected, channel, l);
    setDrafts((d) => ({ ...d, [key]: { ...draftFor(channel, l, def), ...patch } }));
  }

  async function save(channel: Channel, l: Language, def: EventDef) {
    const key = slotKey(selected, channel, l);
    const draft = draftFor(channel, l, def);
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/notification-templates", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          eventKey: selected,
          channel,
          language: l,
          subject: HAS_SUBJECT.includes(channel) ? draft.subject : null,
          body: draft.body,
          isActive: true,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Could not save");
      setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function revert(tpl: Template) {
    const key = slotKey(tpl.eventKey, tpl.channel, tpl.language);
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/notification-templates/${tpl.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Could not reset");
      setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const input =
    "w-full rounded-lg border border-app surface px-3 py-2 text-sm outline-none focus:border-brand-500";

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Event list */}
      <div className="space-y-1">
        {events.map((e) => {
          const active = e.eventKey === selected;
          const count = customCount.get(e.eventKey) ?? 0;
          return (
            <button
              key={e.eventKey}
              onClick={() => setSelected(e.eventKey)}
              className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm ${
                active ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10" : "text-soft hover:bg-app"
              }`}
            >
              <span className="font-mono text-xs">{e.eventKey}</span>
              {count > 0 && <Badge tone="indigo">{count}</Badge>}
            </button>
          );
        })}
      </div>

      {/* Editor for the selected event */}
      <div className="space-y-5">
        {!event ? (
          <p className="text-sm text-muted">No events.</p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-sm font-semibold">{event.eventKey}</h2>
              <Badge tone={CATEGORY_TONE[event.category]}>{event.category.toLowerCase()}</Badge>
              {(event.category === "SECURITY" || event.category === "TRANSACTIONAL") && (
                <span className="text-xs text-muted">always delivered</span>
              )}
            </div>

            {event.channels.map((channel) => {
              const l = langFor(channel);
              const key = slotKey(selected, channel, l);
              const tpl = byKey.get(key);
              const draft = draftFor(channel, l, event);
              return (
                <Card key={channel} className="p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{CHANNEL_LABEL[channel]}</span>
                      <Badge tone={tpl ? "green" : "neutral"}>{tpl ? "custom" : "default"}</Badge>
                    </div>
                    <div className="flex gap-1">
                      {languages.map((lc) => (
                        <button
                          key={lc}
                          onClick={() => setLang((s) => ({ ...s, [`${selected}|${channel}`]: lc }))}
                          className={`rounded-md px-2 py-1 text-xs font-medium ${
                            lc === l ? "bg-brand-600 text-white" : "border border-app text-soft hover:bg-app"
                          }`}
                        >
                          {lc}
                        </button>
                      ))}
                    </div>
                  </div>

                  {HAS_SUBJECT.includes(channel) && (
                    <input
                      value={draft.subject}
                      onChange={(e) => setDraft(channel, l, { subject: e.target.value }, event)}
                      className={`mb-2 ${input}`}
                      placeholder="Title / subject"
                    />
                  )}
                  <textarea
                    value={draft.body}
                    onChange={(e) => setDraft(channel, l, { body: e.target.value }, event)}
                    rows={2}
                    className={input}
                    placeholder="Message body — use {placeholders}"
                  />

                  <div className="mt-2 rounded-lg bg-app px-3 py-2 text-xs">
                    <span className="eyebrow">Preview</span>
                    {HAS_SUBJECT.includes(channel) && draft.subject && (
                      <p className="mt-1 font-medium text-[color:var(--text)]">{interpolate(draft.subject)}</p>
                    )}
                    <p className="mt-0.5 text-soft">{interpolate(draft.body)}</p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" disabled={busy === key || !draft.body.trim()} onClick={() => save(channel, l, event)}>
                      {busy === key ? "Saving…" : "Save"}
                    </Button>
                    {tpl && (
                      <Button size="sm" variant="outline" disabled={busy === key} onClick={() => revert(tpl)}>
                        Reset to default
                      </Button>
                    )}
                    {l !== "EN" && !tpl && (
                      <span className="text-xs text-muted">Falls back to English until saved.</span>
                    )}
                  </div>
                </Card>
              );
            })}
            {error && <p className="text-sm text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
