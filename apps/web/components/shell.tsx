"use client";

import { ReactNode, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import { Wordmark } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";

export type Role = "worker" | "trader" | "employer";

export interface NavItem {
  label: string;
  href: string; // in-page anchor (#id) or route
  icon: ReactNode;
}

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" strokeWidth={1.7} stroke="currentColor">
      <path d={path} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const icons = {
  overview: <Icon path="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" />,
  jobs: <Icon path="M3 8h18v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8Zm5 0V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />,
  earnings: <Icon path="M4 19V5m4 14V9m4 10V7m4 12v-6m4 6V4" />,
  wallet: <Icon path="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 2.5-3H17M16 13h2" />,
  savings: <Icon path="M4 12a6 6 0 0 1 12 0v3h2a1 1 0 0 0 1-1 8 8 0 1 0-3 6M9 10h.01" />,
  loans: <Icon path="M3 10 12 4l9 6M5 10v9h14v-9M9 19v-5h6v5" />,
  standing: <Icon path="M4 18 10 12l4 4 6-7M14 6h6v6" />,
  sales: <Icon path="M6 6h15l-2 9H8L6 6Zm0 0-.8-3H3M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  post: <Icon path="M12 5v14M5 12h14" />,
  settings: <Icon path="M10.3 3.3a1 1 0 0 1 3.4 0l.2 1a7 7 0 0 1 2 .8l.9-.5a1 1 0 0 1 1.4 1.4l-.5.9a7 7 0 0 1 .8 2l1 .2a1 1 0 0 1 0 3.4l-1 .2a7 7 0 0 1-.8 2l.5.9a1 1 0 0 1-1.4 1.4l-.9-.5a7 7 0 0 1-2 .8l-.2 1a1 1 0 0 1-3.4 0l-.2-1a7 7 0 0 1-2-.8l-.9.5a1 1 0 0 1-1.4-1.4l.5-.9a7 7 0 0 1-.8-2l-1-.2a1 1 0 0 1 0-3.4l1-.2a7 7 0 0 1 .8-2l-.5-.9A1 1 0 0 1 6.5 4.6l.9.5a7 7 0 0 1 2-.8l.2-1ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  help: <Icon path="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm-1.8-7.3c0-2 3-2 3-4a1.5 1.5 0 0 0-3-.4M12 17h.01" />,
};

const ACCOUNT: NavItem[] = [
  { label: "Settings", href: "#", icon: icons.settings },
  { label: "Help center", href: "#", icon: icons.help },
];

export function AppShell({
  role,
  userName,
  nav,
  active,
  topbarPlaceholder = "Search…",
  children,
}: {
  role: Role;
  userName: string;
  nav: NavItem[];
  active: string;
  topbarPlaceholder?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState(active);
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = userName.slice(0, 2).toUpperCase();
  const roleLabel = role[0].toUpperCase() + role.slice(1);

  function go(item: NavItem) {
    setMobileOpen(false);
    if (item.href.startsWith("#")) {
      setCurrent(item.label);
      document
        .getElementById(item.href.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      router.push(item.href);
    }
  }

  const sidebar = (
    <>
      <Wordmark className="px-2" />

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const isActive = current === item.label;
          return (
            <button
              key={item.label}
              onClick={() => go(item)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-brand-50 text-brand-700"
                  : "text-ink-soft hover:bg-canvas hover:text-ink"
              }`}
            >
              <span className={isActive ? "text-brand-600" : "text-ink-muted"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}

        <p className="eyebrow mt-6 px-3">Account</p>
        {ACCOUNT.map((item) => (
          <div
            key={item.label}
            className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-soft"
          >
            <span className="text-ink-muted">{item.icon}</span>
            {item.label}
          </div>
        ))}
      </nav>

      <button
        onClick={() => {
          clearSession();
          router.push("/login");
        }}
        className="mt-2 rounded-xl border border-line px-3 py-2.5 text-left text-sm font-medium text-ink-soft hover:bg-canvas"
      >
        Sign out
      </button>
    </>
  );

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col border-r border-line bg-surface px-4 py-6 shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur sm:gap-4 sm:px-6 sm:py-3.5">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink-soft md:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
            <input
              placeholder={topbarPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
            />
            <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] text-ink-muted sm:inline">
              Ctrl K
            </kbd>
          </div>
          <NotificationBell />
          <div className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface py-1.5 pl-1.5 pr-1.5 sm:pr-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-700 text-xs font-bold text-white">
              {initials}
            </span>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold leading-none text-ink">{userName}</p>
              <p className="mt-0.5 text-[11px] leading-none text-ink-muted">{roleLabel}</p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
