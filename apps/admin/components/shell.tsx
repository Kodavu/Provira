"use client";

import { type CSSProperties, ReactNode, Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NavProgress } from "./nav-progress";
import {
  Bell,
  ChevronLeft,
  Command,
  Eye,
  Flag,
  Home,
  KeyRound,
  Landmark,
  ListChecks,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Users,
  UserSquare2,
} from "lucide-react";
import { visibleNav } from "@/lib/nav";
import type { Me } from "@/lib/admin-api";
import { CommandPalette } from "./command-palette";

const ICONS = {
  home: Home,
  users: Users,
  flag: Flag,
  key: KeyRound,
  list: ListChecks,
  id: UserSquare2,
  bell: Bell,
  eye: Eye,
  cash: Landmark,
  shield: ShieldCheck,
};

function NavIcon({ name }: { name: string }) {
  const Icon = ICONS[name as keyof typeof ICONS] ?? Home;
  return <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />;
}

export function AdminShell({ me, children }: { me: Me; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const sidebarWidth = collapsed ? "72px" : "272px";
  const [dark, setDark] = useState(
    typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark"),
  );
  const nav = visibleNav(me.permissions);
  const initials = me.admin.fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
    <div
      className="relative min-h-screen overflow-x-hidden bg-app"
      style={{ "--admin-sidebar-width": sidebarWidth } as CSSProperties}
    >
      <div className="admin-ambient pointer-events-none fixed inset-0 -z-10" />
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <CommandPalette items={nav} />

      <motion.aside
        animate={{ width: collapsed ? 72 : 272 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r border-app bg-white/75 shadow-2xl shadow-slate-200/50 backdrop-blur-xl dark:bg-slate-950/60 dark:shadow-black/20 md:flex"
      >
        <div
          className={`flex h-20 items-center gap-3 border-b border-app px-4 ${collapsed ? "justify-center" : ""}`}
        >
          <motion.span
            whileHover={{ rotate: -8, scale: 1.04 }}
            className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 text-sm font-black text-white shadow-lg shadow-brand-600/25"
          >
            T
          </motion.span>
          {!collapsed && (
            <div>
              <span className="font-bold tracking-tight">Truvo Admin</span>
              <p className="text-[11px] font-medium text-muted">
                Premium operations suite
              </p>
            </div>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          {nav.map((item, index) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.025 }}
              >
                <Link
                  href={item.href as never}
                  title={item.label}
                  className={`relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/20"
                      : "text-soft hover:bg-slate-900/5 hover:text-[color:var(--text)] dark:hover:bg-white/5"
                  } ${collapsed ? "justify-center" : ""}`}
                >
                  <NavIcon name={item.icon} />
                  {!collapsed && <span>{item.label}</span>}
                  {active && (
                    <motion.span
                      layoutId="nav-glow"
                      className="absolute inset-0 -z-10 rounded-2xl bg-brand-500/20 blur-xl"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed((c) => !c)}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="m-3 inline-flex items-center justify-center gap-2 rounded-2xl border border-app px-3 py-2 text-xs font-semibold text-soft transition hover:bg-app"
        >
          {collapsed ? (
            <Menu className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" /> Collapse
            </>
          )}
        </button>
      </motion.aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-[var(--admin-sidebar-width)] md:transition-[padding-left] md:duration-300 md:ease-[cubic-bezier(0.22,1,0.36,1)]">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-3 border-b border-white/30 bg-white/70 px-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/60 sm:px-6">
          <button
            onClick={() => (window as any).__openPalette?.()}
            className="group flex flex-1 items-center gap-3 rounded-2xl border border-app bg-white/75 px-3 py-2.5 text-sm text-muted shadow-sm transition hover:border-brand-500/40 hover:bg-white dark:bg-white/[0.03]"
          >
            <Search className="h-4 w-4 transition group-hover:text-brand-500" />
            <span className="flex-1 text-left">
              Search records, staff, disputes…
            </span>
            <kbd className="hidden items-center gap-1 rounded-lg border border-app bg-app px-2 py-1 text-[10px] font-bold sm:inline-flex">
              <Command className="h-3 w-3" />K
            </kbd>
          </button>
          <button
            onClick={toggleTheme}
            title="Toggle theme"
            className="grid h-11 w-11 place-items-center rounded-2xl border border-app bg-white/70 text-soft transition hover:bg-app dark:bg-white/[0.03]"
          >
            {dark ? (
              <Sun className="h-[18px] w-[18px]" />
            ) : (
              <Moon className="h-[18px] w-[18px]" />
            )}
          </button>
          <div className="flex items-center gap-2 border-l border-app pl-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-slate-900 to-brand-600 text-xs font-bold text-white shadow-lg">
              {initials}
            </span>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold leading-none">
                {me.admin.fullName}
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] leading-none text-muted">
                <Sparkles className="h-3 w-3" /> {me.roles.join(", ")}
              </p>
            </div>
            <button
              type="button"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="ml-1 inline-flex items-center gap-1.5 rounded-xl border border-app px-2.5 py-2 text-xs font-semibold text-soft transition hover:bg-app hover:text-[color:var(--text)]"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="sr-only lg:not-sr-only">Sign out</span>
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
