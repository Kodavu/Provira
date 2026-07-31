"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { visibleNav } from "@/lib/nav";
import type { Me } from "@/lib/admin-api";
import { CommandPalette } from "./command-palette";

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5",
    users: "M16 19a4 4 0 0 0-8 0M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM20 19a3 3 0 0 0-4-2.8M18 11a2.5 2.5 0 0 0 0-5",
    flag: "M5 21V4m0 0 9 2-2 4 6 1-2 4-11-2",
    key: "M14 7a4 4 0 1 1-5.4 3.7L3 16v3h3l1-1h2l1-1v-2l1.3-1.3A4 4 0 0 1 14 7Z",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    id: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-2.5 5a2.5 2.5 0 0 1 5 0M14 9h4M14 13h3",
    bell: "M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6ZM10 19a2 2 0 0 0 4 0",
    eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.7}>
      <path d={paths[name] ?? paths.home} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AdminShell({ me, children }: { me: Me; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  const nav = visibleNav(me.permissions);
  const initials = me.admin.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  function toggleTheme() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    localStorage.setItem("admin-theme", next ? "dark" : "light");
    setDark(next);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-app">
      <CommandPalette items={nav} />

      {/* Sidebar */}
      <aside
        className={`surface sticky top-0 hidden h-screen shrink-0 flex-col border-r md:flex ${collapsed ? "w-16" : "w-60"} transition-[width]`}
      >
        <div className={`flex h-16 items-center gap-2 border-b border-app px-4 ${collapsed ? "justify-center" : ""}`}>
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">T</span>
          {!collapsed && <span className="font-bold tracking-tight">Tally Admin</span>}
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as never}
                title={item.label}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400" : "text-soft hover:bg-app"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Icon name={item.icon} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="m-3 rounded-lg border border-app px-3 py-2 text-xs font-medium text-soft hover:bg-app"
        >
          {collapsed ? "»" : "« Collapse"}
        </button>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="surface sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 sm:px-6">
          <button
            onClick={() => (window as any).__openPalette?.()}
            className="flex flex-1 items-center gap-2 rounded-lg border border-app px-3 py-2 text-sm text-muted hover:bg-app"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" strokeLinecap="round" />
            </svg>
            <span className="flex-1 text-left">Search or jump to…</span>
            <kbd className="hidden rounded border border-app px-1.5 py-0.5 text-[10px] sm:inline">⌘K</kbd>
          </button>
          <button onClick={toggleTheme} title="Toggle theme" className="grid h-9 w-9 place-items-center rounded-lg border border-app text-soft hover:bg-app">
            {dark ? (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" strokeLinecap="round" /></svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth={1.8}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </button>
          <div className="flex items-center gap-2 border-l border-app pl-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-xs font-bold text-white">{initials}</span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none">{me.admin.fullName}</p>
              <p className="mt-0.5 text-[11px] leading-none text-muted">{me.roles.join(", ")}</p>
            </div>
            <button onClick={logout} title="Sign out" className="ml-1 rounded-lg border border-app px-2.5 py-1.5 text-xs font-medium text-soft hover:bg-app">
              Sign out
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
