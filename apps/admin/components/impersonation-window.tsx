"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  Check,
  Eye,
  Lock,
  LogOut,
  MapPin,
  ShieldAlert,
  Wallet,
} from "lucide-react";

export interface ViewData {
  grant: { id: string; mode: "READ" | "WRITE"; expiresAt: string | null };
  user: {
    id: string;
    fullName: string | null;
    phone: string;
    email: string | null;
    language: string;
    status: string;
    kycLevel: string;
    hasSmartphone: boolean;
  } | null;
  roles: string[];
  score: { score: number; tier: string; jobsCompleted: number; onTimeRate: number } | null;
  wallet: { balance: string };
  assignments: Array<{ id: string; status: string; title: string; payAmount: string; location: string | null }>;
  notifications: Array<{ id: string; title: string | null; body: string; readAt: string | null; createdAt: string }>;
  disputes: Array<{ id: string; code: string; title: string; status: string; createdAt: string }>;
}

const LANGUAGES = ["EN", "PCM", "YO", "HA", "IG"];
const naira = (kobo: string) => `₦${(Number(kobo) / 100).toLocaleString("en-NG")}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

// A read-only, user-styled window an admin sees when impersonating. It mirrors
// the look of the Truvo user app; every mutating control is disabled (except a
// small whitelist of audited actions for WRITE "act as" grants). Forces a light
// user-app palette regardless of the admin theme.
export function ImpersonationWindow({ data }: { data: ViewData }) {
  const write = data.grant.mode === "WRITE";
  const u = data.user;
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState(u?.language ?? "EN");

  async function act(action: string, extra: Record<string, unknown> = {}) {
    setBusy(true);
    setError(null);
    setFlash(null);
    try {
      const res = await fetch(`/api/impersonation/${data.grant.id}/act`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Action failed");
      setFlash(body.result ?? "Done");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!u) {
    return (
      <div style={{ colorScheme: "light" }} className="grid min-h-screen place-items-center bg-[#f8fafc] p-6 text-center text-slate-500">
        This session has expired. Close this window and request access again.
      </div>
    );
  }

  const roleLabel = data.roles.includes("EMPLOYER") ? "Employer" : data.roles.includes("TRADER") ? "Trader" : "Worker";
  const firstName = u.fullName?.split(" ")[0] ?? "there";
  const initials = (u.fullName ?? u.phone).slice(0, 2).toUpperCase();
  const shifts = data.assignments.filter((a) => ["ACCEPTED", "CONFIRMED"].includes(a.status));

  return (
    <div style={{ colorScheme: "light" }} className="min-h-screen bg-[#f8fafc] text-slate-900">
      {/* Impersonation banner (sticky, unmissable) */}
      <div className={`sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm text-white ${write ? "bg-red-600" : "bg-brand-600"}`}>
        <div className="flex items-center gap-2">
          {write ? <ShieldAlert className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span className="font-semibold">{write ? "Acting as" : "Viewing as"} {u.fullName ?? u.phone}</span>
          <span className="hidden opacity-80 sm:inline">
            — {write ? "changes are audited to you" : "read-only preview"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {data.grant.expiresAt && <span className="text-xs opacity-80">Ends {when(data.grant.expiresAt)}</span>}
          <button
            onClick={() => window.close()}
            className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-2.5 py-1 text-xs font-medium hover:bg-white/25"
          >
            <LogOut className="h-3.5 w-3.5" /> Exit
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Top bar, user-app style */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-sm font-bold text-white">T</span>
            <span className="text-lg font-bold tracking-tight">truvo</span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-3">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-700 text-xs font-bold text-white">{initials}</span>
            <div className="text-left">
              <p className="text-sm font-semibold leading-none">{u.fullName ?? "User"}</p>
              <p className="mt-0.5 text-[11px] leading-none text-slate-400">{roleLabel}</p>
            </div>
          </div>
        </motion.div>

        <h1 className="text-3xl font-semibold tracking-tight">Welcome back, {firstName}</h1>
        <p className="mt-1 text-slate-500">This is what {firstName} sees in their account.</p>

        {/* Stat cards */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3"
        >
          <StatCard icon={<Wallet className="h-4 w-4" />} label="Wallet" value={naira(data.wallet.balance)} caption="Available balance" gold />
          {data.score && (
            <>
              <StatCard icon={<Briefcase className="h-4 w-4" />} label="Reliability" value={String(data.score.score)} caption={`${cap(data.score.tier)} tier`} />
              <StatCard icon={<Check className="h-4 w-4" />} label="On-time" value={`${Math.round(data.score.onTimeRate * 100)}%`} caption={`${data.score.jobsCompleted} shifts done`} />
            </>
          )}
        </motion.div>

        {/* Shifts */}
        <Panel title="Their shifts" className="mt-6">
          {shifts.length === 0 ? (
            <Empty>No active shifts.</Empty>
          ) : (
            <div className="divide-y divide-slate-100">
              {shifts.map((a) => (
                <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-slate-400">
                      {naira(a.payAmount)}{a.location ? ` · ${a.location}` : ""}
                    </p>
                  </div>
                  {a.status === "CONFIRMED" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      <Check className="h-3.5 w-3.5" /> Confirmed
                    </span>
                  ) : (
                    <DisabledBtn>Confirm attendance</DisabledBtn>
                  )}
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Notifications */}
        <Panel
          title="Notifications"
          className="mt-6"
          action={
            write ? (
              <button
                onClick={() => act("mark_notifications_read")}
                disabled={busy}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Mark all read
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Lock className="h-3 w-3" /> read-only</span>
            )
          }
        >
          {flash && <p className="px-5 pt-3 text-sm text-emerald-600">{flash}</p>}
          {error && <p className="px-5 pt-3 text-sm text-red-600">{error}</p>}
          {data.notifications.length === 0 ? (
            <Empty>No notifications.</Empty>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.notifications.slice(0, 6).map((n) => (
                <div key={n.id} className="flex gap-3 px-5 py-3">
                  <Bell className={`mt-0.5 h-4 w-4 shrink-0 ${n.readAt ? "text-slate-300" : "text-brand-500"}`} />
                  <div className="min-w-0">
                    {n.title && <p className="text-sm font-medium">{n.title}</p>}
                    <p className="text-sm text-slate-500">{n.body}</p>
                    <p className="mt-0.5 text-[11px] text-slate-400">{when(n.createdAt)}{n.readAt ? "" : " · unread"}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* Cases */}
        {data.disputes.length > 0 && (
          <Panel title="Their cases" className="mt-6">
            <div className="divide-y divide-slate-100">
              {data.disputes.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
                  <span><span className="font-mono text-xs text-slate-400">{d.code}</span> · {d.title}</span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {d.status.replace(/_/g, " ").toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {/* WRITE act panel */}
        {write && (
          <Panel title="Act on their behalf" className="mt-6">
            <div className="flex flex-wrap items-center gap-2 p-5">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
              >
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <button
                onClick={() => act("set_language", { language })}
                disabled={busy || language === u.language}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
              >
                Set language
              </button>
              <span className="text-xs text-slate-400">Actions here are limited and audited to your admin account.</span>
            </div>
          </Panel>
        )}

        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
          <Lock className="h-3.5 w-3.5" />
          {write ? "Acting-as session — a limited, audited surface." : "Read-only impersonation — actions like applying, withdrawing, and confirming are disabled."}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, caption, gold }: { icon: React.ReactNode; label: string; value: string; caption: string; gold?: boolean }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center justify-between">
        <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-lg ${gold ? "bg-gold-50 text-gold-700" : "bg-brand-50 text-brand-700"}`}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{caption}</p>
    </motion.div>
  );
}

function Panel({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-6 text-sm text-slate-400">{children}</p>;
}

function DisabledBtn({ children }: { children: React.ReactNode }) {
  return (
    <span
      title="Disabled in view-only mode"
      className="inline-flex cursor-not-allowed items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400"
    >
      <Lock className="h-3 w-3" /> {children}
    </span>
  );
}
