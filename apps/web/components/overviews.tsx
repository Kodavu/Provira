"use client";

import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  Briefcase,
  HandCoins,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { api, type EmployerDashboard, type TraderDashboard, type WorkerDashboard } from "@/lib/api";
import { usePageData } from "@/lib/use-page-data";
import { useSession } from "@/lib/session-context";
import { Button, Card, Kpi, Pill, formatNaira } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { CountUp, CountUpNaira, FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { StandingCard, HustleStats, NextGoal } from "@/components/worker";
import { TraderStanding } from "@/components/trader";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// A row of quick links to the dedicated pages — the overview is a hub.
function QuickLink({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: typeof Wallet;
  label: string;
  hint: string;
}) {
  return (
    <Link href={href}>
      <Card className="group flex h-full items-center gap-3 p-4 transition hover:border-brand-200 hover:shadow-md">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-ink">{label}</span>
          <span className="block truncate text-xs text-ink-muted">{hint}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
      </Card>
    </Link>
  );
}

// ---------- Worker ----------

export function WorkerOverview() {
  const { fullName } = useSession();
  const { data, error, reload } = usePageData<WorkerDashboard>((id) => api.workerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const firstName = fullName?.split(" ")[0] ?? "there";
  const confirmed = data.assignments.filter(
    (a) => a.attendance?.status === "CONFIRMED" || a.status === "CONFIRMED",
  );
  const invitations = data.assignments.filter((a) => a.status === "INVITED");
  const activeAssignments = data.assignments.filter((a) => a.status === "ACCEPTED");

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="Your standing, your shifts, and what you've earned — at a glance."
        action={
          <Link href="/jobs">
            <Button>
              <Briefcase className="h-4 w-4" /> Find work
            </Button>
          </Link>
        }
      />

      <FadeIn delay={0.05} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <StandingCard score={data.score} />
        <HustleStats score={data.score} assignments={data.assignments} wallet={data.wallet} />
      </FadeIn>

      <NextGoal done={confirmed.length} target={10} />

      {invitations.length > 0 && (
        <Link href="/jobs">
          <Card className="flex items-center justify-between gap-3 border-brand-200 bg-brand-50/50 p-4 transition hover:shadow-md">
            <p className="text-sm font-medium text-ink">
              You have {invitations.length} job invitation{invitations.length === 1 ? "" : "s"} waiting.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Respond <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Card>
        </Link>
      )}

      <div>
        <SectionRow title="Active shifts" href="/jobs" cta="Manage jobs" />
        {activeAssignments.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">
              No active shifts. Head to <Link href="/jobs" className="font-medium text-brand-700">Jobs</Link> to apply.
            </p>
          </Card>
        ) : (
          <Stagger className="space-y-2.5">
            {activeAssignments.slice(0, 3).map((a) => (
              <StaggerItem key={a.id}>
                <Card className="flex items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-ink">{a.job.title}</p>
                    <p className="text-sm text-ink-muted">{formatNaira(a.job.payAmount)} · {a.status.toLowerCase()}</p>
                  </div>
                  <Pill tone="amber">Awaiting confirmation</Pill>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem><QuickLink href="/earnings" icon={Wallet} label="Earnings" hint={`${formatNaira(data.wallet.balance)} available`} /></StaggerItem>
        <StaggerItem><QuickLink href="/standing" icon={TrendingUp} label="My standing" hint={`Score ${data.score.value}`} /></StaggerItem>
        <StaggerItem><QuickLink href="/loans" icon={HandCoins} label="Loans" hint={`${data.loanOffers.filter((o) => o.eligible).length} eligible`} /></StaggerItem>
        <StaggerItem><QuickLink href="/verify" icon={ShieldCheck} label="Verify identity" hint="Unlock higher limits" /></StaggerItem>
      </Stagger>
    </div>
  );
}

// ---------- Trader ----------

export function TraderOverview() {
  const { fullName } = useSession();
  const { data, error, reload } = usePageData<TraderDashboard>((id) => api.traderDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const name = data.user.businessName ?? fullName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${name}`}
        subtitle={
          <>Every logged sale builds the record that unlocks stock loans{data.user.marketName ? ` · ${data.user.marketName}` : ""}.</>
        }
        action={
          <Link href="/sales">
            <Button><Receipt className="h-4 w-4" /> Log a sale</Button>
          </Link>
        }
      />

      <FadeIn delay={0.05} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <TraderStanding score={data.score} />
        <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StaggerItem><Kpi icon={<Receipt className="h-4 w-4" />} label="This week" value={<CountUpNaira amount={data.totals.thisWeek} />} caption="Logged in last 7 days." /></StaggerItem>
          <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label="All-time" value={<CountUpNaira amount={data.totals.allTime} />} caption="Across your record." accent="amber" /></StaggerItem>
          <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label="Transactions" value={<CountUp value={data.totals.count} />} caption="Total sales logged." accent="neutral" /></StaggerItem>
        </Stagger>
      </FadeIn>

      <div>
        <SectionRow title="Recent sales" href="/sales" cta="View all" />
        {data.sales.length === 0 ? (
          <Card className="p-6"><p className="text-sm text-ink-muted">No sales yet. Log your first from the Sales page.</p></Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {data.sales.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">Sale · {s.method}</p>
                  <p className="text-xs text-ink-muted">{new Date(s.occurredAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</p>
                </div>
                <span className="font-display font-semibold text-gold-700">+{formatNaira(s.amount)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-3">
        <StaggerItem><QuickLink href="/loans" icon={HandCoins} label="Stock loans" hint={`${data.loanOffers.filter((o) => o.eligible).length} eligible`} /></StaggerItem>
        <StaggerItem><QuickLink href="/standing" icon={TrendingUp} label="My standing" hint={`Score ${data.score.value}`} /></StaggerItem>
        <StaggerItem><QuickLink href="/verify" icon={ShieldCheck} label="Verify identity" hint="Unlock higher limits" /></StaggerItem>
      </Stagger>
    </div>
  );
}

// ---------- Employer ----------

export function EmployerOverview() {
  const { fullName } = useSession();
  const { data, error, reload } = usePageData<EmployerDashboard>((id) => api.employerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const name = data.user.businessName ?? fullName?.split(" ")[0] ?? "there";
  const totalApplicants = data.jobs.reduce((s, j) => s + j.applicants, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${greeting()}, ${name}`}
        subtitle="Post a shift, fund escrow up front, and release pay on a confirmed attendance code."
        action={
          <Link href="/jobs/new">
            <Button><Briefcase className="h-4 w-4" /> Post a job</Button>
          </Link>
        }
      />

      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem><Kpi icon={<Briefcase className="h-4 w-4" />} label="Active jobs" value={<CountUp value={data.stats.activeJobs} />} caption="Open or in progress." /></StaggerItem>
        <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label="Applicants" value={<CountUp value={totalApplicants} />} caption="Across all your jobs." accent="neutral" /></StaggerItem>
        <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label="In escrow" value={<CountUpNaira amount={data.stats.committed} />} caption="Funded, awaiting release." accent="amber" /></StaggerItem>
        <StaggerItem><Kpi icon={<Wallet className="h-4 w-4" />} label="Paid out" value={<CountUpNaira amount={data.stats.released} />} caption="Released to workers." /></StaggerItem>
      </Stagger>

      <div>
        <SectionRow title="Recent jobs" href="/jobs" cta="Manage jobs" />
        {data.jobs.length === 0 ? (
          <Card className="p-6"><p className="text-sm text-ink-muted">No jobs yet. Post your first shift to get started.</p></Card>
        ) : (
          <Stagger className="space-y-2.5">
            {data.jobs.slice(0, 4).map((j) => (
              <StaggerItem key={j.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-ink">{j.title}</p>
                    <p className="text-sm text-ink-muted">
                      {formatNaira(j.payAmount)} · {j.applicants} applicant{j.applicants === 1 ? "" : "s"}
                    </p>
                  </div>
                  {j.escrow?.released ? (
                    <Pill tone="green">Released</Pill>
                  ) : j.escrow?.funded ? (
                    <Pill tone="green">Escrow funded</Pill>
                  ) : (
                    <Pill tone="amber">Needs funding</Pill>
                  )}
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-2">
        <StaggerItem><QuickLink href="/escrow" icon={Banknote} label="Escrow" hint={`${formatNaira(data.stats.committed)} committed`} /></StaggerItem>
        <StaggerItem><QuickLink href="/verify" icon={ShieldCheck} label="Verify business" hint="Unlock higher limits" /></StaggerItem>
      </Stagger>
    </div>
  );
}

function SectionRow({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:text-brand-800">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
