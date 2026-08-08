"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

// Provira logomark: a checkmark whose rising arm carries a gold tip —
// "verified, and rising". White check on the brand badge when boxed.
export function ProviraMark({
  className = "h-9 w-9",
  boxed = true,
}: {
  className?: string;
  boxed?: boolean;
}) {
  const glyph = (
    <svg viewBox="0 0 24 24" fill="none" className={boxed ? "h-[58%] w-[58%]" : className}>
      <path
        d="M4.5 12.6 L10 17.8 L14.8 11.7"
        stroke={boxed ? "#ffffff" : "currentColor"}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14.8 11.7 L20 5.4" stroke="#f5b301" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (!boxed) return glyph;
  return (
    <span className={`grid shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 ${className}`}>
      {glyph}
    </span>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`surface premium-card rounded-2xl border shadow-sm ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <Card className="group relative overflow-hidden p-5">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl transition group-hover:bg-brand-500/20" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{label}</p>
          <p
            className={`mt-2 text-3xl font-bold tracking-tight ${accent ? "text-brand-500" : ""}`}
          >
            {value}
          </p>
          {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
        </div>
        <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/20 bg-gradient-to-br from-white/60 to-white/10 text-brand-500 shadow-sm dark:from-white/10 dark:to-white/5">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

const BADGE: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  indigo: "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof BADGE;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ring-black/5 dark:ring-white/10 ${BADGE[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "primary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary:
      "bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-600/20 hover:shadow-brand-600/30",
    outline:
      "border border-app surface text-soft hover:bg-app hover:text-[color:var(--text)]",
    danger:
      "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg shadow-red-600/20",
    ghost: "text-soft hover:bg-app hover:text-[color:var(--text)]",
  }[variant];
  const pad = size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm";
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition disabled:opacity-40 ${pad} ${styles} ${className}`}
    >
      {children}
    </motion.button>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-7 overflow-hidden rounded-3xl border border-white/20 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.22),transparent_35%),linear-gradient(135deg,rgba(255,255,255,0.86),rgba(255,255,255,0.56))] p-6 shadow-xl shadow-slate-200/60 backdrop-blur dark:bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.28),transparent_35%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.68))] dark:shadow-black/20"
    >
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-500/20 bg-brand-500/10 px-3 py-1 text-xs font-semibold text-brand-600 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Command center
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-2xl text-sm text-soft">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </motion.div>
  );
}

export function Table({
  head,
  children,
}: {
  head: string[];
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-10 bg-[color:var(--bg)]/95 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--bg)]/80">
            <tr className="border-b border-app text-left">
              {head.map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap border-b border-app px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted first:pl-5 last:pr-5"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&_tr]:transition [&_tr:hover]:bg-slate-50/80 dark:[&_tr:hover]:bg-white/[0.04] [&_td]:border-b [&_td]:border-[color:var(--border)] [&_td]:py-3.5 [&_td]:align-middle [&_td]:first:pl-5 [&_td]:last:pr-5">
            {children}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="p-10 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/10 text-brand-500">
        <Sparkles className="h-5 w-5" />
      </div>
      <p className="text-sm text-muted">{children}</p>
    </Card>
  );
}
