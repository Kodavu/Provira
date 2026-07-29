"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, WorkerDashboard } from "@/lib/api";
import { getUserId, clearSession } from "@/lib/session";
import {
  ScoreCard,
  WalletCard,
  AssignmentsList,
  JobsNearby,
  LoanOffers,
} from "@/components/worker";

export default function WorkerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<WorkerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

  if (error)
    return (
      <main className="mx-auto max-w-md px-6 py-20 text-center">
        <p className="text-red-600">Couldn&apos;t load your dashboard.</p>
        <p className="mt-2 text-sm text-neutral-500">{error}</p>
        <Link href="/login" className="mt-4 inline-block text-brand-700 underline">
          Sign in again
        </Link>
      </main>
    );

  if (!data)
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        <div className="h-8 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="mt-6 h-40 w-full animate-pulse rounded-2xl bg-neutral-100" />
      </main>
    );

  const firstName = data.user.fullName?.split(" ")[0] ?? "there";

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">Worker dashboard</p>
          <h1 className="text-2xl font-extrabold text-neutral-900">
            Hi, {firstName} 👋
          </h1>
        </div>
        <button
          onClick={() => {
            clearSession();
            router.push("/login");
          }}
          className="text-sm text-neutral-500 hover:text-neutral-800"
        >
          Sign out
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ScoreCard score={data.score} />
        <WalletCard wallet={data.wallet} />
      </div>

      <Section title="Your jobs">
        <AssignmentsList assignments={data.assignments} onConfirmed={load} />
      </Section>

      <Section title="Jobs nearby">
        <JobsNearby jobs={data.openJobs} />
      </Section>

      <Section title="Loan offers">
        <LoanOffers offers={data.loanOffers} />
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-bold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}
