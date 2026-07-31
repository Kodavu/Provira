"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, type NotificationPreferences } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { Card, Wordmark } from "@/components/ui";

// Only mutable categories are user-controllable; the rest always send.
const MUTABLE = [
  { key: "ACTIVITY", label: "Activity", hint: "Case replies, job offers, attendance, score changes" },
  { key: "MARKETING", label: "Tips & offers", hint: "Occasional nudges and promotions" },
] as const;

const CHANNELS = [
  { key: "INAPP", label: "In-app" },
  { key: "SMS", label: "SMS" },
  { key: "WHATSAPP", label: "WhatsApp" },
  { key: "PUSH", label: "Push" },
  { key: "EMAIL", label: "Email" },
] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function Toggle({ on, onClick, disabled }: { on: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        on ? "bg-brand-600" : "bg-line"
      } ${disabled ? "opacity-40" : ""}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [data, setData] = useState<NotificationPreferences | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      setData(await api.notificationPreferences(userId));
    } catch {
      /* leave null → shows loading */
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  // Effective state: a channel is on unless a preference row explicitly disables it.
  function enabled(category: string, channel: string): boolean {
    const row = data?.preferences.find((p) => p.category === category && p.channel === channel);
    return row ? row.enabled : true;
  }

  async function toggle(category: string, channel: string) {
    const userId = getUserId();
    if (!userId || busy) return;
    setBusy(true);
    try {
      setData(await api.setNotificationPreference(userId, { category, channel, enabled: !enabled(category, channel) }));
    } finally {
      setBusy(false);
    }
  }

  async function patchSetting(patch: { muteAll?: boolean; quietStart?: number | null; quietEnd?: number | null }) {
    const userId = getUserId();
    if (!userId) return;
    setBusy(true);
    try {
      setData(await api.setNotificationSetting(userId, patch));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <Wordmark />
          <Link href="/worker" className="text-sm font-medium text-ink-soft hover:text-ink">
            &larr; Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Notification settings</h1>
        <p className="mt-1 text-sm text-ink-soft">Choose how Tally reaches you. Security and payment alerts are always sent.</p>

        {!data ? (
          <p className="mt-8 text-sm text-ink-muted">Loading…</p>
        ) : (
          <div className="mt-6 space-y-5">
            {/* Global mute */}
            <Card className="flex items-center justify-between p-5">
              <div>
                <p className="font-semibold text-ink">Pause non-urgent notifications</p>
                <p className="text-sm text-ink-soft">Mutes activity and offers. You&apos;ll still get security and payment alerts.</p>
              </div>
              <Toggle on={data.setting.muteAll} disabled={busy} onClick={() => patchSetting({ muteAll: !data.setting.muteAll })} />
            </Card>

            {/* Per-category channel matrix */}
            {MUTABLE.map((cat) => (
              <Card key={cat.key} className="p-5">
                <p className="font-semibold text-ink">{cat.label}</p>
                <p className="text-sm text-ink-soft">{cat.hint}</p>
                <div className="mt-4 divide-y divide-line">
                  {CHANNELS.map((ch) => (
                    <div key={ch.key} className="flex items-center justify-between py-2.5">
                      <span className="text-sm text-ink">{ch.label}</span>
                      <Toggle
                        on={!data.setting.muteAll && enabled(cat.key, ch.key)}
                        disabled={busy || data.setting.muteAll}
                        onClick={() => toggle(cat.key, ch.key)}
                      />
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Quiet hours */}
            <Card className="p-5">
              <p className="font-semibold text-ink">Quiet hours</p>
              <p className="text-sm text-ink-soft">Hold non-urgent alerts during these hours (urgent ones still come through).</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <label className="flex items-center gap-2">
                  <span className="text-ink-soft">From</span>
                  <select
                    value={data.setting.quietStart ?? ""}
                    onChange={(e) => patchSetting({ quietStart: e.target.value === "" ? null : Number(e.target.value) })}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-ink outline-none focus:border-brand-500"
                  >
                    <option value="">Off</option>
                    {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
                  </select>
                </label>
                <label className="flex items-center gap-2">
                  <span className="text-ink-soft">to</span>
                  <select
                    value={data.setting.quietEnd ?? ""}
                    onChange={(e) => patchSetting({ quietEnd: e.target.value === "" ? null : Number(e.target.value) })}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-ink outline-none focus:border-brand-500"
                  >
                    <option value="">Off</option>
                    {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
                  </select>
                </label>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
