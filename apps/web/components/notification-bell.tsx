"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { api, type Notification } from "@/lib/api";
import { getUserId } from "@/lib/session";

const POLL_MS = 30_000;

type TimeT = ReturnType<typeof useTranslations<"Time">>;

function timeAgo(iso: string, tt: TimeT): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return tt("justNow");
  const m = Math.floor(s / 60);
  if (m < 60) return tt("minutes", { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return tt("hours", { n: h });
  return tt("days", { n: Math.floor(h / 24) });
}

export function NotificationBell() {
  const t = useTranslations("Notifications");
  const tt = useTranslations("Time");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const feed = await api.notifications(userId, 15);
      setItems(feed.items);
      setUnread(feed.unread);
    } catch {
      /* offline / not logged in — leave the bell quiet */
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    return () => clearInterval(t);
  }, [load]);

  // Close on outside click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function openItem(n: Notification) {
    const userId = getUserId();
    if (!userId) return;
    if (!n.readAt) {
      const feed = await api.markNotificationRead(userId, n.id);
      setItems(feed.items);
      setUnread(feed.unread);
    }
  }

  async function markAll() {
    const userId = getUserId();
    if (!userId) return;
    const feed = await api.markAllNotificationsRead(userId);
    setItems(feed.items);
    setUnread(feed.unread);
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("ariaLabel")}
        className="relative grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface text-ink-soft hover:text-ink"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7}>
          <path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
        </svg>
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-80 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">{t("title")}</p>
            {unread > 0 && (
              <button onClick={markAll} className="text-xs font-medium text-brand-600 hover:text-brand-700">
                {t("markAllRead")}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {!loaded && items.length === 0 ? (
              <div className="divide-y divide-line">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-3 px-4 py-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-line" />
                    <div className="flex-1 space-y-2">
                      <span className="block h-3.5 w-2/3 animate-pulse rounded bg-line/70" />
                      <span className="block h-3 w-1/2 animate-pulse rounded bg-line/50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-muted">{t("allCaughtUp")}</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => openItem(n)}
                  className={`flex w-full gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-canvas ${
                    n.readAt ? "" : "bg-brand-50/40"
                  }`}
                >
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-brand-600"}`} />
                  <span className="min-w-0">
                    {n.title && <span className="block text-sm font-medium text-ink">{n.title}</span>}
                    <span className="block text-sm text-ink-soft">{n.body}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-muted">{timeAgo(n.createdAt, tt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
