"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, TraderDashboard } from "@/lib/api";
import { getUserId } from "@/lib/session";
import { AppShell, NavItem, icons } from "@/components/shell";
import { SectionHeader, StatCard, formatNaira } from "@/components/ui";
import { LogSaleCard, TraderStanding, SalesList } from "@/components/trader";
import { LoanOffers } from "@/components/worker";

const NAV: NavItem[] = [
  { label: "Overview", href: "#top", icon: icons.overview },
  { label: "Sales", href: "#sales", icon: icons.sales },
  { label: "Loans", href: "#loans", icon: icons.loans },
  { label: "My standing", href: "#standing", icon: icons.standing },
];

export default function TraderDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<TraderDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = getUserId();
    if (!userId) {
      router.push("/login");
      return;
    }
    try {
      setData(await api.traderDashboard(userId));
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
        <p className="text-red-600">Couldn&apos;t load your stall.</p>
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
      role="trader"
      userName={name}
      nav={NAV}
      active="Overview"
      topbarPlaceholder="Search sales, loans…"
    >
      <div id="top" className="scroll-mt-24">
        <h1 className="font-display text-4xl font-semibold text-ink">Your stall, counted</h1>
        <p className="mt-1 text-ink-soft">
          Log every sale — {data.user.marketName ? `${data.user.marketName} · ` : ""}
          building the track record that unlocks stock loans.
        </p>
      </div>

      <div id="standing" className="mt-6 grid scroll-mt-24 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <TraderStanding score={data.score} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="Sales this week" value={formatNaira(data.totals.thisWeek)} caption="Logged in the last 7 days." />
          <StatCard label="All-time sales" value={formatNaira(data.totals.allTime)} caption="Across your whole record." accent="amber" />
          <StatCard label="Transactions" value={data.totals.count} caption="Total sales logged." />
        </div>
      </div>

      <section id="sales" className="mt-8 scroll-mt-24 space-y-4">
        <LogSaleCard userId={data.user.id} onLogged={load} />
        <div>
          <SectionHeader title="Sales history" subtitle="Every sale you've logged, most recent first." />
          <SalesList sales={data.sales} />
        </div>
      </section>

      <section id="loans" className="mt-10 scroll-mt-24">
        <SectionHeader title="Stock loans" subtitle="Qualify for working capital once you've built a track record." />
        <LoanOffers offers={data.loanOffers} />
      </section>
    </AppShell>
  );
}
