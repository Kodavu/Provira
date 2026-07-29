"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, EmployerDashboard } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { AppShell, NavItem, icons } from "@/components/shell";
import { SectionHeader, StatCard, formatNaira } from "@/components/ui";
import { PostJobCard, JobsBoard } from "@/components/employer";

const NAV: NavItem[] = [
  { label: "Overview", href: "#top", icon: icons.overview },
  { label: "Post a job", href: "#post", icon: icons.post },
  { label: "Your jobs", href: "#jobs", icon: icons.jobs },
  { label: "Escrow", href: "#escrow", icon: icons.wallet },
];

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
        <Link href="/login" className="mt-4 inline-block text-brand-700 underline">
          Sign in again
        </Link>
      </main>
    );

  if (!data)
    return (
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="h-8 w-40 animate-pulse rounded bg-line" />
        <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-line" />
      </div>
    );

  const name = data.user.businessName ?? data.user.fullName?.split(" ")[0] ?? "there";

  return (
    <AppShell
      role="employer"
      userName={name}
      nav={NAV}
      active="Overview"
      topbarPlaceholder="Search jobs, applicants…"
    >
      <div id="top" className="scroll-mt-24">
        <h1 className="font-display text-4xl font-semibold text-ink">Your jobs, funded and filled</h1>
        <p className="mt-1 text-ink-soft">
          Post a shift, fund escrow up front, and pay releases on a confirmed attendance code.
        </p>
      </div>

      <div id="escrow" className="mt-6 grid scroll-mt-24 grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Active jobs" value={data.stats.activeJobs} caption="Open, filled, or in progress." />
        <StatCard label="In escrow" value={formatNaira(data.stats.committed)} caption="Funded, awaiting confirmation." accent="amber" />
        <StatCard label="Paid out" value={formatNaira(data.stats.released)} caption="Released to workers." />
      </div>

      <section id="post" className="mt-8 scroll-mt-24">
        <PostJobCard employerProfileId={data.employerProfileId} onPosted={load} />
      </section>

      <section id="jobs" className="mt-10 scroll-mt-24">
        <SectionHeader title="Your jobs" subtitle="Fund escrow to secure a shift, then find workers. Pay releases when the worker confirms with their code." />
        <JobsBoard jobs={data.jobs} onChange={load} />
      </section>
    </AppShell>
  );
}
