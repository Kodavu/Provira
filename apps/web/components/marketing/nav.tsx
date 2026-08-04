"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Briefcase,
  ChevronDown,
  HelpCircle,
  Menu,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Wordmark } from "@/components/ui";

interface MenuItem {
  label: string;
  href: string;
  desc: string;
  icon: typeof Users;
}

const PRODUCT: MenuItem[] = [
  { label: "For workers", href: "/#workers", desc: "Find jobs, get paid same-day", icon: Users },
  { label: "For employers", href: "/#employers", desc: "Hire verified workers, pay on confirmation", icon: Briefcase },
  { label: "For traders", href: "/#traders", desc: "Log sales, grow your business", icon: Store },
  { label: "Roadmap", href: "/#roadmap", desc: "POS, payments & what's next", icon: TrendingUp },
];

const COMPANY: MenuItem[] = [
  { label: "About", href: "/about", desc: "Our mission and story", icon: Sparkles },
  { label: "Careers", href: "/careers", desc: "Build the future of work", icon: Briefcase },
  { label: "Press", href: "/press", desc: "News and media kit", icon: Newspaper },
  { label: "Security", href: "/security", desc: "How we protect your money", icon: ShieldCheck },
];

const RESOURCES: MenuItem[] = [
  { label: "Help center", href: "/help", desc: "Guides and answers", icon: HelpCircle },
  { label: "FAQ", href: "/faq", desc: "Common questions", icon: HelpCircle },
  { label: "Blog", href: "/blog", desc: "Product and company updates", icon: Newspaper },
  { label: "Contact", href: "/contact", desc: "Talk to our team", icon: Banknote },
];

const SIMPLE = [{ label: "How it works", href: "/#how" }];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false); // mobile
  const [menu, setMenu] = useState<string | null>(null); // desktop dropdown
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors ${
        scrolled ? "border-b border-line bg-white/80 backdrop-blur-xl" : "border-b border-transparent bg-white/0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="Tally home" className="shrink-0">
          <Wordmark />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex" onMouseLeave={() => setMenu(null)}>
          <Dropdown label="Product" items={PRODUCT} open={menu === "product"} onOpen={() => setMenu("product")} />
          {SIMPLE.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-canvas hover:text-ink">
              {l.label}
            </Link>
          ))}
          <Dropdown label="Company" items={COMPANY} open={menu === "company"} onOpen={() => setMenu("company")} />
          <Dropdown label="Resources" items={RESOURCES} open={menu === "resources"} onOpen={() => setMenu("resources")} />
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href="/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-ink-soft transition hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700"
          >
            Get started
          </Link>
        </div>

        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-soft md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-white md:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex h-16 items-center justify-between border-b border-line px-4">
              <Wordmark />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-xl border border-line text-ink-soft">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[calc(100vh-4rem)] overflow-y-auto px-4 py-4">
              <MobileGroup title="Product" items={PRODUCT} />
              <MobileGroup title="Company" items={COMPANY} />
              <MobileGroup title="Resources" items={RESOURCES} />
              <Link href="/#how" className="block border-b border-line py-3 text-base font-medium text-ink">How it works</Link>
              <div className="mt-6 flex flex-col gap-3">
                <Link href="/login" className="rounded-xl border border-line py-3 text-center font-semibold text-ink">Sign in</Link>
                <Link href="/signup" className="rounded-xl bg-brand-600 py-3 text-center font-semibold text-white">Get started</Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Dropdown({ label, items, open, onOpen }: { label: string; items: MenuItem[]; open: boolean; onOpen: () => void }) {
  return (
    <div className="relative" onMouseEnter={onOpen}>
      <button className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-canvas hover:text-ink">
        {label}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 top-full w-80 pt-3"
          >
            <div className="overflow-hidden rounded-2xl border border-line bg-white p-2 shadow-xl shadow-slate-900/5">
              {items.map((it) => {
                const Icon = it.icon;
                return (
                  <Link key={it.label} href={it.href} className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-canvas">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-ink">{it.label}</span>
                      <span className="block text-xs text-ink-muted">{it.desc}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MobileGroup({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <div className="border-b border-line py-3">
      <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
      {items.map((it) => (
        <Link key={it.label} href={it.href} className="flex items-center gap-3 rounded-lg px-1 py-2.5 text-base font-medium text-ink">
          <it.icon className="h-5 w-5 text-brand-600" strokeWidth={1.8} />
          {it.label}
        </Link>
      ))}
    </div>
  );
}
