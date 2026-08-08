"use client";

import { ReactNode, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion, MotionConfig } from "framer-motion";
import { toast } from "sonner";
import { PageTransition } from "@/components/page-transition";
import { NavProgress } from "@/components/nav-progress";
import {
  BadgeCheck,
  Banknote,
  BarChart3,
  Briefcase,
  ChevronsUpDown,
  HandCoins,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { clearSession } from "@/lib/session";
import { useSession } from "@/lib/session-context";
import { type Role } from "@/lib/auth";
import { Wordmark } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";

// Legacy SVG-path icon set kept for any component still importing `icons`.
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
  wallet: <Icon path="M3 7h15a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
};

export type { Role };

interface NavLink {
  key: string; // Shell.nav.* i18n key
  href: string;
  icon: LucideIcon;
}

// Resolved nav item with a translated label, used by the sidebar + command menu.
interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// Each role's sidebar — every entry is a real route, no scroll anchors.
const NAV_BY_ROLE: Record<Role, NavLink[]> = {
  WORKER: [
    { key: "overview", href: "/overview", icon: LayoutDashboard },
    { key: "jobs", href: "/jobs", icon: Briefcase },
    { key: "earnings", href: "/earnings", icon: Wallet },
    { key: "loans", href: "/loans", icon: HandCoins },
    { key: "standing", href: "/standing", icon: TrendingUp }
  ],
  TRADER: [
    { key: "overview", href: "/overview", icon: LayoutDashboard },
    { key: "sales", href: "/sales", icon: Receipt },
    { key: "loans", href: "/loans", icon: HandCoins },
    { key: "standing", href: "/standing", icon: TrendingUp },
  ],
  EMPLOYER: [
    { key: "overview", href: "/overview", icon: LayoutDashboard },
    { key: "jobs", href: "/jobs", icon: Briefcase },
    { key: "postJob", href: "/jobs/new", icon: PlusCircle },
    { key: "reports", href: "/reports", icon: BarChart3 },
    { key: "escrow", href: "/escrow", icon: Banknote },
  ],
};

const ACCOUNT: NavLink[] = [
  { key: "profile", href: "/profile", icon: UserCircle },
  { key: "verify", href: "/verify", icon: ShieldCheck },
  { key: "settings", href: "/settings", icon: Settings },
  { key: "help", href: "/support", icon: LifeBuoy },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/overview") return pathname === "/overview";
  if (href === "/jobs") return pathname === "/jobs"; // keep /jobs/new distinct
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function UserMenu({
  displayName,
  initials,
  activeRole,
  onSignOut,
}: {
  displayName: string;
  initials: string;
  activeRole: Role;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("Shell");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={displayName}
        className={`grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-xs font-bold text-white ring-2 ring-transparent transition hover:ring-brand-200 ${open ? "ring-brand-300" : ""
          }`}
      >
        {initials}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
          >
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-tight text-ink">
                  {displayName}
                </p>
                <p className="mt-0.5 text-[11px] leading-none text-ink-muted">
                  {t(`roles.${activeRole}`)}
                </p>
              </div>
            </div>

            <div className="p-1.5">
              <button
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onSignOut();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-ink-soft transition hover:bg-canvas hover:text-ink"
              >
                <LogOut className="h-[18px] w-[18px] text-ink-muted" strokeWidth={1.8} />
                {t("signOut")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { fullName, roles, activeRole, setActiveRole } = useSession();
  const t = useTranslations("Shell");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const navItems: NavItem[] = NAV_BY_ROLE[activeRole].map((n) => ({ ...n, label: t(`nav.${n.key}`) }));
  const accountItems: NavItem[] = ACCOUNT.map((n) => ({ ...n, label: t(`nav.${n.key}`) }));
  const displayName = fullName?.trim() || "there";
  const initials = getInitials(displayName).toUpperCase() || "??";

  // Restore the collapse preference on mount.
  useEffect(() => {
    if (localStorage.getItem("sidebar-collapsed") === "1") setCollapsed(true);
  }, []);

  function toggleCollapse() {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  // Ctrl/Cmd+K opens the command menu.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function signOut() {
    clearSession();
    toast.success(t("signedOut"), { description: t("signedOutDesc") });
    router.push("/login");
  }

  function renderSidebar(collapsed: boolean, showToggle: boolean) {
    return (
      <>
        <Link
          href="/overview"
          className={collapsed ? "flex justify-center py-1" : "px-2"}
          title="Home"
        >
          {collapsed ? (
            // Replace this tile with your actual logo mark.
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-700 text-sm font-bold text-white">
              T
            </span>
          ) : (
            <Wordmark />
          )}
        </Link>

        {roles.length > 1 && !collapsed && (
          <div className="mt-6">
            <RoleSwitcher roles={roles} active={activeRole} onChange={setActiveRole} />
          </div>
        )}

        <nav className="mt-6 flex flex-1 flex-col justify-between">
          <div className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavButton
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>

          <div className="flex flex-col gap-1">
            {collapsed ? (
              <div className="mx-auto mt-6 h-px w-8 bg-line" />
            ) : (
              <p className="eyebrow mt-6 px-3">{t("account")}</p>
            )}
            {accountItems.map((item) => (
              <NavButton
                key={item.href}
                item={item}
                active={isActive(pathname, item.href)}
                collapsed={collapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            ))}
          </div>
        </nav>

        {showToggle && (
          <button
            onClick={toggleCollapse}
            title={collapsed ? "Expand" : "Collapse"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`mt-2 flex items-center rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-canvas hover:text-ink ${collapsed ? "justify-center" : "gap-2.5"
              }`}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-[18px] w-[18px]" strokeWidth={1.8} />
            ) : (
              <>
                <PanelLeftClose className="h-[18px] w-[18px]" strokeWidth={1.8} />
                Collapse
              </>
            )}
          </button>
        )}

        <button
          onClick={signOut}
          title={collapsed ? t("signOut") : undefined}
          className={`mt-2 flex items-center rounded-xl border border-line px-3 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-canvas hover:text-ink ${collapsed ? "justify-center" : "gap-2.5"
            }`}
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={1.8} />
          {!collapsed && t("signOut")}
        </button>
      </>
    );
  }
  return (
    <MotionConfig reducedMotion="user">
    <Suspense fallback={null}>
      <NavProgress />
    </Suspense>
    <div className="flex min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-line bg-surface px-4 py-6 transition-[width] duration-200 md:flex ${collapsed ? "w-20" : "w-64"
          }`}
      >
        {renderSidebar(collapsed, true)}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <motion.div
              className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="absolute left-0 top-0 flex h-full w-72 max-w-[82%] flex-col border-r border-line bg-surface px-4 py-6 shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
            >
              {renderSidebar(false, false)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-line bg-canvas/85 px-4 py-3 backdrop-blur sm:gap-4 sm:px-6 sm:py-3.5">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-line bg-surface text-ink-soft md:hidden"
          >
            <Menu className="h-5 w-5" strokeWidth={1.8} />
          </button>

          <button
            onClick={() => setCmdOpen(true)}
            className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-ink-muted transition hover:border-brand-200"
          >
            <Search className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span className="min-w-0 flex-1 truncate text-sm">{t(`searchHints.${activeRole}`)}</span>
            <kbd className="hidden rounded-md border border-line px-1.5 py-0.5 text-[10px] sm:inline">
              Ctrl K
            </kbd>
          </button>

          <NotificationBell />

          <UserMenu
            displayName={displayName}
            initials={initials}
            activeRole={activeRole}
            onSignOut={signOut}
          />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>

      <CommandMenu
        open={cmdOpen}
        onClose={() => setCmdOpen(false)}
        nav={[...navItems, ...accountItems]}
        onSignOut={signOut}
      />
    </div>
    </MotionConfig>
  );
}

function NavButton({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate: () => void;
}) {
  const Ico = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
      className={`relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${collapsed ? "justify-center" : "gap-3"
        } ${active ? "text-brand-700" : "text-ink-soft hover:bg-canvas hover:text-ink"}`}
    >
      {active && (
        <motion.span
          layoutId="nav-active"
          className="absolute inset-0 rounded-xl bg-brand-50"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      )}
      <span className={`relative z-10 ${active ? "text-brand-600" : "text-ink-muted"}`}>
        <Ico className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      {!collapsed && <span className="relative z-10">{item.label}</span>}
    </Link>
  );
}

function RoleSwitcher({
  roles,
  active,
  onChange,
}: {
  roles: Role[];
  active: Role;
  onChange: (r: Role) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const t = useTranslations("Shell");

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl border border-line bg-canvas px-3 py-2.5 text-left transition hover:border-brand-200"
      >
        <span>
          <span className="eyebrow block">{t("viewingAs")}</span>
          <span className="text-sm font-semibold text-ink">{t(`roles.${active}`)}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 text-ink-muted" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 right-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
          >
            {roles.map((r) => (
              <button
                key={r}
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                  toast.success(t("switchedTo", { role: t(`roles.${r}`) }));
                }}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition hover:bg-canvas ${r === active ? "font-semibold text-brand-700" : "text-ink-soft"
                  }`}
              >
                {t(`roles.${r}`)}
                {r === active && <BadgeCheck className="h-4 w-4 text-brand-600" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CommandMenu({
  open,
  onClose,
  nav,
  onSignOut,
}: {
  open: boolean;
  onClose: () => void;
  nav: NavItem[];
  onSignOut: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("Shell");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nav;
    return nav.filter((n) => n.label.toLowerCase().includes(q));
  }, [query, nav]);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search className="h-4 w-4 text-ink-muted" strokeWidth={2} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) go(results[0].href);
                }}
                placeholder={t("searchPlaceholder")}
                className="w-full bg-transparent py-3.5 text-sm text-ink outline-none placeholder:text-ink-muted"
              />
              <kbd className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-ink-muted">Esc</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-ink-muted">{t("noMatches")}</p>
              ) : (
                results.map((n) => {
                  const Ico = n.icon;
                  return (
                    <button
                      key={n.href}
                      onClick={() => go(n.href)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-soft transition hover:bg-canvas hover:text-ink"
                    >
                      <Ico className="h-[18px] w-[18px] text-ink-muted" strokeWidth={1.8} />
                      {n.label}
                    </button>
                  );
                })
              )}
              <button
                onClick={() => {
                  onClose();
                  onSignOut();
                }}
                className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-ink-soft transition hover:bg-canvas hover:text-ink"
              >
                <LogOut className="h-[18px] w-[18px] text-ink-muted" strokeWidth={1.8} />
                {t("signOut")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
