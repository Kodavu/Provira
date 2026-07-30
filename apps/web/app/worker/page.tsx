"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, WorkerDashboard } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { AppShell, NavItem, icons } from "@/components/shell";
import { SectionHeader } from "@/components/ui";
import {
  StandingCard,
  HustleStats,
  NextGoal,
  AssignmentsList,
  JobsNearby,
  LoanOffers,
  ApplyCodeBanner,
} from "@/components/worker";

const NAV: NavItem[] = [
  { label: "Overview", href: "#top", icon: icons.overview },
  { label: "Jobs", href: "#jobs", icon: icons.jobs },
  { label: "Earnings", href: "/worker/wallet", icon: icons.earnings },
  { label: "Loans", href: "#loans", icon: icons.loans },
  { label: "My standing", href: "#standing", icon: icons.standing },
];

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<WorkerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{
    jobTitle: string;
    code: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      setData(await api.workerDashboard(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [router]);

  async function handleApply(jobId: string) {
    const userId = getUserId();
    if (!userId || !data) return;
    setApplyingId(jobId);
    try {
      const res = await api.applyToJob(jobId, userId);
      const job = data.openJobs.find((j) => j.id === jobId);
      setApplyResult({ jobTitle: job?.title ?? "this shift", code: res.code });
      await load();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApplyingId(null);
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-red-600">Couldn&apos;t load your dashboard.</p>
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

  const firstName = data.user.fullName?.split(" ")[0] ?? "there";
  const confirmedCount = data.assignments.filter(
    (a) => a.attendance?.status === "CONFIRMED",
  ).length;
  const assignedJobIds = new Set(data.assignments.map((a) => a.job.id));
  const availableJobs = data.openJobs.filter((j) => !assignedJobIds.has(j.id));

  return (
    <AppShell
      role="worker"
      userName={firstName}
      nav={NAV}
      active="Overview"
      topbarPlaceholder="Search jobs, earnings, history…"
    >
      <div id="top" className="scroll-mt-24">
        <h1 className="font-display text-4xl font-semibold text-ink">Welcome back</h1>
        <p className="mt-1 text-ink-soft">
          Your standing, your shifts, what you&apos;ve earned this week.
        </p>
      </div>

      {applyResult && (
        <div className="mt-6">
          <ApplyCodeBanner
            jobTitle={applyResult.jobTitle}
            code={applyResult.code}
            onDismiss={() => setApplyResult(null)}
          />
        </div>
      )}

      <div id="standing" className="mt-6 grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <StandingCard score={data.score} />
        <HustleStats score={data.score} assignments={data.assignments} wallet={data.wallet} />
      </div>

      <div className="mt-6">
        <NextGoal done={confirmedCount} target={10} />
      </div>

      <section id="jobs" className="mt-10 scroll-mt-24">
        <SectionHeader title="Your jobs" subtitle="Shifts you're on. Enter the employer's 4-digit code to confirm attendance and get paid." />
        <AssignmentsList assignments={data.assignments} onConfirmed={load} />
      </section>

      <section id="earnings" className="mt-10 scroll-mt-24">
        <SectionHeader title="Jobs nearby" subtitle="Open jobs near you — tap apply to get your confirmation code." />
        <JobsNearby jobs={availableJobs} onApply={handleApply} applyingId={applyingId} />
      </section>

      <section id="loans" className="mt-10 scroll-mt-24">
        <SectionHeader title="Loan offers" subtitle="Built off the work you've done. The more you show up, the more we trust you." />
        <LoanOffers offers={data.loanOffers} />
      </section>
    </AppShell>
  );
}
