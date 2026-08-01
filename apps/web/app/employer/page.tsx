"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Banknote, Briefcase, Inbox, Plus, Wallet } from "lucide-react";
import { api, EmployerDashboard } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { AppShell, NavItem, icons } from "@/components/shell";
import { Card, SectionHeader, formatNaira } from "@/components/ui";
import { PostJobCard, JobsBoard } from "@/components/employer";

const NAV: NavItem[] = [
  { label: "Overview", href: "#top", icon: icons.overview },
  { label: "Post a job", href: "#post", icon: icons.post },
  { label: "Your jobs", href: "#jobs", icon: icons.jobs },
  { label: "Escrow", href: "#escrow", icon: icons.wallet },
];

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function EmployerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<EmployerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      setData(await api.employerDashboard(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-red-600">Couldn&apos;t load your jobs.</p>
        <p className="mt-2 text-sm text-ink-muted">{error}</p>
        <Link href="/login" className="mt-4 inline-block text-brand-700 underline">Sign in again</Link>
      </main>
    );

  if (!data)
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="h-8 w-48 animate-pulse rounded bg-line" />
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-line/70" />)}
        </div>
        <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-line/70" />
      </div>
    );

  const name = data.user.businessName ?? data.user.fullName?.split(" ")[0] ?? "there";
  const pendingApplications = data.jobs.reduce((s, j) => s + j.applicants, 0);

  return (
    <AppShell role="employer" userName={name} nav={NAV} active="Overview" topbarPlaceholder="Search jobs, applicants…">
      {/* Greeting */}
      <div id="top" className="flex flex-wrap items-start justify-between gap-4 scroll-mt-24">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink">Your site today</h1>
          <p className="mt-1 text-ink-soft">Post shifts, fund escrow up front, and pay releases on a confirmed attendance code.</p>
        </div>
        <button
          onClick={() => scrollTo("post")}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Plus className="h-4 w-4" /> New job
        </button>
      </div>

      {/* Escrow / payout strip */}
      <div id="escrow" className="mt-6 scroll-mt-24">
        <Card className="flex flex-wrap items-center gap-6 p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <Wallet className="h-6 w-6" />
          </span>
          <div className="flex flex-wrap gap-x-10 gap-y-3">
            <div>
              <p className="eyebrow">In escrow</p>
              <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-ink">{formatNaira(data.stats.committed)}</p>
            </div>
            <div>
              <p className="eyebrow">Paid out</p>
              <p className="mt-0.5 font-display text-2xl font-semibold tabular-nums text-ink">{formatNaira(data.stats.released)}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <button onClick={() => scrollTo("jobs")} className="text-sm font-semibold text-brand-600 hover:text-brand-700">View jobs</button>
            <button onClick={() => scrollTo("post")} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Post a job</button>
          </div>
        </Card>
      </div>

      {/* KPI row */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiHighlight label="Active jobs" value={data.stats.activeJobs} caption="Running or matching now" icon={<Briefcase className="h-5 w-5" />} />
        <Kpi label="Applicants" value={pendingApplications} caption="Across your jobs" icon={<Inbox className="h-5 w-5" />} />
        <Kpi label="In escrow" value={formatNaira(data.stats.committed)} caption="Funded, held" icon={<Wallet className="h-5 w-5" />} accent="amber" />
        <Kpi label="Paid out" value={formatNaira(data.stats.released)} caption="Released to workers" icon={<Banknote className="h-5 w-5" />} />
      </div>

      {/* Active jobs */}
      <section id="jobs" className="mt-10 scroll-mt-24">
        <SectionHeader title="Active jobs" subtitle="Jobs running, scheduled, or matching workers right now." />
        <JobsBoard jobs={data.jobs} onChange={load} />
      </section>

      {/* Post a job */}
      <section id="post" className="mt-10 scroll-mt-24">
        <PostJobCard employerProfileId={data.employerProfileId} onPosted={load} />
      </section>
    </AppShell>
  );
}

function KpiHighlight({ label, value, caption, icon }: { label: string; value: ReactNode; caption: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl bg-brand-600 p-5 text-white shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-white/80">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/15 text-white">{icon}</span>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-sm text-white/70">{caption}</p>
    </div>
  );
}

function Kpi({
  label,
  value,
  caption,
  icon,
  accent = "brand",
}: {
  label: string;
  value: ReactNode;
  caption: string;
  icon: ReactNode;
  accent?: "brand" | "amber";
}) {
  const chip = accent === "amber" ? "bg-gold-50 text-gold-600" : "bg-brand-50 text-brand-600";
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between">
        <p className="eyebrow">{label}</p>
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${chip}`}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-sm text-ink-muted">{caption}</p>
    </div>
  );
}
