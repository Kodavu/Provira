"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { api, type NotificationPreferences } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Card } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { FadeIn } from "@/components/motion";
import { LANGUAGES, useLanguagePreference } from "@/components/i18n/languages";

const MUTABLE = ["ACTIVITY", "MARKETING"] as const;
const CHANNELS = ["INAPP", "SMS", "WHATSAPP", "PUSH", "EMAIL"] as const;

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function Toggle({ on, onClick, disabled }: { on: boolean; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={on}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${on ? "bg-brand-600" : "bg-line"} ${disabled ? "opacity-40" : ""}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${on ? "translate-x-5" : "translate-x-0.5"}`} />
    </button>
  );
}

export default function SettingsPage() {
  const { userId } = useSession();
  const t = useTranslations("Settings");
  const { data, error, reload } = usePageData<NotificationPreferences>((id) => api.notificationPreferences(id));
  const [busy, setBusy] = useState(false);
  const [local, setLocal] = useState<NotificationPreferences | null>(null);

  const prefs = local ?? data;

  function enabled(category: string, channel: string): boolean {
    const row = prefs?.preferences.find((p) => p.category === category && p.channel === channel);
    return row ? row.enabled : true;
  }

  async function toggle(category: string, channel: string) {
    if (busy) return;
    setBusy(true);
    try {
      const next = await api.setNotificationPreference(userId, { category, channel, enabled: !enabled(category, channel) });
      setLocal(next);
    } catch {
      toast.error(t("prefFailed"));
    } finally {
      setBusy(false);
    }
  }

  async function patchSetting(patch: { muteAll?: boolean; quietStart?: number | null; quietEnd?: number | null }) {
    setBusy(true);
    try {
      const next = await api.setNotificationSetting(userId, patch);
      setLocal(next);
      if (patch.muteAll !== undefined) {
        toast.success(patch.muteAll ? t("paused") : t("resumed"));
      } else {
        toast.success(t("quietUpdated"));
      }
    } catch {
      toast.error(t("settingsFailed"));
    } finally {
      setBusy(false);
    }
  }

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!prefs) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <FadeIn delay={0.05} className="space-y-5">
        <LanguagePreference />
        <JobFeedPreference />

        <Card className="flex items-center justify-between p-5">
          <div>
            <p className="font-semibold text-ink">{t("pauseTitle")}</p>
            <p className="text-sm text-ink-soft">{t("pauseSub")}</p>
          </div>
          <Toggle on={prefs.setting.muteAll} disabled={busy} onClick={() => patchSetting({ muteAll: !prefs.setting.muteAll })} />
        </Card>

        {MUTABLE.map((cat) => (
          <Card key={cat} className="p-5">
            <p className="font-semibold text-ink">{t(`categories.${cat}.label`)}</p>
            <p className="text-sm text-ink-soft">{t(`categories.${cat}.hint`)}</p>
            <div className="mt-4 divide-y divide-line">
              {CHANNELS.map((ch) => (
                <div key={ch} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ink">{t(`channels.${ch}`)}</span>
                  <Toggle
                    on={!prefs.setting.muteAll && enabled(cat, ch)}
                    disabled={busy || prefs.setting.muteAll}
                    onClick={() => toggle(cat, ch)}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}

        <Card className="p-5">
          <p className="font-semibold text-ink">{t("quietHours")}</p>
          <p className="text-sm text-ink-soft">{t("quietHoursSub")}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <span className="text-ink-soft">{t("from")}</span>
              <select
                value={prefs.setting.quietStart ?? ""}
                onChange={(e) => patchSetting({ quietStart: e.target.value === "" ? null : Number(e.target.value) })}
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-ink outline-none focus:border-brand-500"
              >
                <option value="">{t("off")}</option>
                {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-ink-soft">{t("to")}</span>
              <select
                value={prefs.setting.quietEnd ?? ""}
                onChange={(e) => patchSetting({ quietEnd: e.target.value === "" ? null : Number(e.target.value) })}
                className="rounded-lg border border-line bg-surface px-2 py-1.5 text-ink outline-none focus:border-brand-500"
              >
                <option value="">{t("off")}</option>
                {HOURS.map((h) => <option key={h} value={h}>{String(h).padStart(2, "0")}:00</option>)}
              </select>
            </label>
          </div>
        </Card>
      </FadeIn>
    </div>
  );
}

const FEED_OPTIONS = ["ALL", "SKILLS", "NEARBY"] as const;

// Worker-only: controls which jobs the Find work feed surfaces by default.
function JobFeedPreference() {
  const { userId, activeRole } = useSession();
  const t = useTranslations("Settings");
  const [feed, setFeed] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (activeRole !== "WORKER") return;
    api.workerProfile(userId).then((p) => setFeed(p.jobFeed)).catch(() => setFeed("ALL"));
  }, [userId, activeRole]);

  if (activeRole !== "WORKER") return null;

  async function choose(key: string) {
    if (busy || key === feed) return;
    setBusy(true);
    const prev = feed;
    setFeed(key);
    try {
      await api.updateProfile(userId, { jobFeed: key });
      toast.success(t("feedUpdated"), { description: t(`feeds.${key}.label`) });
    } catch {
      setFeed(prev);
      toast.error(t("feedFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <p className="font-semibold text-ink">{t("jobFeed")}</p>
      <p className="text-sm text-ink-soft">{t("jobFeedSub")}</p>
      <div className="mt-4 space-y-2">
        {FEED_OPTIONS.map((key) => {
          const on = feed === key;
          return (
            <button
              key={key}
              onClick={() => choose(key)}
              disabled={busy || feed === null}
              className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition ${
                on ? "border-brand-500 bg-brand-50" : "border-line bg-surface hover:bg-canvas"
              }`}
            >
              <span>
                <span className="block text-sm font-semibold text-ink">{t(`feeds.${key}.label`)}</span>
                <span className="block text-xs text-ink-muted">{t(`feeds.${key}.hint`)}</span>
              </span>
              <span className={`grid h-5 w-5 place-items-center rounded-full border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function LanguagePreference() {
  const { code, choose } = useLanguagePreference();
  const t = useTranslations("Settings");
  return (
    <Card className="p-5">
      <p className="font-semibold text-ink">{t("language")}</p>
      <p className="text-sm text-ink-soft">{t("languageSub")}</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {LANGUAGES.map((l) => {
          const on = code === l.code;
          return (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                on ? "border-brand-500 bg-brand-50" : "border-line bg-surface hover:bg-canvas"
              }`}
            >
              <span className="text-lg" aria-hidden>{l.flag}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-ink">{l.native}</span>
                <span className="block text-xs text-ink-muted">{l.label}</span>
              </span>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${on ? "border-brand-600 bg-brand-600 text-white" : "border-line"}`}>
                {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
