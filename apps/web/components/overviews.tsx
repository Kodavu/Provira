"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
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
import { useEffect, useState } from "react";
import { api, type EmployerDashboard, type EmployerReports, type TraderDashboard, type WorkerDashboard } from "@/lib/api";
import { usePageData } from "@/lib/use-page-data";
import { useSession } from "@/lib/session-context";
import { Button, Card, Kpi, Pill, formatNaira } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { CountUp, CountUpNaira, FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { AreaChart, Donut } from "@/components/charts";
import { StandingCard, HustleStats, NextGoal } from "@/components/worker";
import { TraderStanding } from "@/components/trader";

function greetingKey(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
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
  const t = useTranslations("Overview");
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
        title={`${t(`greeting.${greetingKey()}`)}, ${firstName}`}
        subtitle={t("worker.subtitle")}
        action={
          <Link href="/jobs">
            <Button>
              <Briefcase className="h-4 w-4" /> {t("worker.findWork")}
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
              {t("worker.invitations", { count: invitations.length })}
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              {t("worker.respond")} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Card>
        </Link>
      )}

      <div>
        <SectionRow title={t("worker.activeShifts")} href="/jobs" cta={t("worker.manageJobs")} />
        {activeAssignments.length === 0 ? (
          <Card className="p-6">
            <p className="text-sm text-ink-muted">
              {t("worker.noActivePre")} <Link href="/jobs" className="font-medium text-brand-700">{t("worker.noActiveLink")}</Link> {t("worker.noActivePost")}
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
                  <Pill tone="amber">{t("worker.awaitingConfirmation")}</Pill>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem><QuickLink href="/earnings" icon={Wallet} label={t("worker.earnings")} hint={t("common.available", { amount: formatNaira(data.wallet.balance) })} /></StaggerItem>
        <StaggerItem><QuickLink href="/standing" icon={TrendingUp} label={t("common.myStanding")} hint={t("common.scoreHint", { value: data.score.value })} /></StaggerItem>
        <StaggerItem><QuickLink href="/loans" icon={HandCoins} label={t("worker.loans")} hint={t("common.eligible", { count: data.loanOffers.filter((o) => o.eligible).length })} /></StaggerItem>
        <StaggerItem><QuickLink href="/verify" icon={ShieldCheck} label={t("common.verifyIdentity")} hint={t("common.unlockHigher")} /></StaggerItem>
      </Stagger>
    </div>
  );
}

// ---------- Trader ----------

export function TraderOverview() {
  const { fullName } = useSession();
  const t = useTranslations("Overview");
  const { data, error, reload } = usePageData<TraderDashboard>((id) => api.traderDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const name = data.user.businessName ?? fullName?.split(" ")[0] ?? "there";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t(`greeting.${greetingKey()}`)}, ${name}`}
        subtitle={
          <>{t("trader.subtitle")}{data.user.marketName ? ` · ${data.user.marketName}` : ""}.</>
        }
        action={
          <Link href="/sales">
            <Button><Receipt className="h-4 w-4" /> {t("trader.logSale")}</Button>
          </Link>
        }
      />

      <FadeIn delay={0.05} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <TraderStanding score={data.score} />
        <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StaggerItem><Kpi icon={<Receipt className="h-4 w-4" />} label={t("trader.thisWeek")} value={<CountUpNaira amount={data.totals.thisWeek} />} caption={t("trader.thisWeekCap")} /></StaggerItem>
          <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label={t("trader.allTime")} value={<CountUpNaira amount={data.totals.allTime} />} caption={t("trader.allTimeCap")} accent="amber" /></StaggerItem>
          <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label={t("trader.transactions")} value={<CountUp value={data.totals.count} />} caption={t("trader.transactionsCap")} accent="neutral" /></StaggerItem>
        </Stagger>
      </FadeIn>

      <div>
        <SectionRow title={t("trader.recentSales")} href="/sales" cta={t("trader.viewAll")} />
        {data.sales.length === 0 ? (
          <Card className="p-6"><p className="text-sm text-ink-muted">{t("trader.noSales")}</p></Card>
        ) : (
          <Card className="divide-y divide-line p-0">
            {data.sales.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-ink">{t("trader.saleMethod", { method: s.method })}</p>
                  <p className="text-xs text-ink-muted">{new Date(s.occurredAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}</p>
                </div>
                <span className="font-display font-semibold text-gold-700">+{formatNaira(s.amount)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-3">
        <StaggerItem><QuickLink href="/loans" icon={HandCoins} label={t("trader.stockLoans")} hint={t("common.eligible", { count: data.loanOffers.filter((o) => o.eligible).length })} /></StaggerItem>
        <StaggerItem><QuickLink href="/standing" icon={TrendingUp} label={t("common.myStanding")} hint={t("common.scoreHint", { value: data.score.value })} /></StaggerItem>
        <StaggerItem><QuickLink href="/verify" icon={ShieldCheck} label={t("common.verifyIdentity")} hint={t("common.unlockHigher")} /></StaggerItem>
      </Stagger>
    </div>
  );
}

// ---------- Employer ----------

export function EmployerOverview() {
  const { fullName } = useSession();
  const t = useTranslations("Overview");
  const { data, error, reload } = usePageData<EmployerDashboard>((id) => api.employerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const name = data.user.businessName ?? fullName?.split(" ")[0] ?? "there";
  const totalApplicants = data.jobs.reduce((s, j) => s + j.applicants, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${t(`greeting.${greetingKey()}`)}, ${name}`}
        subtitle={t("employer.subtitle")}
        action={
          <Link href="/jobs/new">
            <Button><Briefcase className="h-4 w-4" /> {t("employer.postJob")}</Button>
          </Link>
        }
      />

      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StaggerItem><Kpi icon={<Briefcase className="h-4 w-4" />} label={t("employer.activeJobs")} value={<CountUp value={data.stats.activeJobs} />} caption={t("employer.activeJobsCap")} /></StaggerItem>
        <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label={t("employer.applicants")} value={<CountUp value={totalApplicants} />} caption={t("employer.applicantsCap")} accent="neutral" /></StaggerItem>
        <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label={t("employer.inEscrow")} value={<CountUpNaira amount={data.stats.committed} />} caption={t("employer.inEscrowCap")} accent="amber" /></StaggerItem>
        <StaggerItem><Kpi icon={<Wallet className="h-4 w-4" />} label={t("employer.paidOut")} value={<CountUpNaira amount={data.stats.released} />} caption={t("employer.paidOutCap")} /></StaggerItem>
      </Stagger>

      <EmployerCharts />

      <div>
        <SectionRow title={t("employer.recentJobs")} href="/jobs" cta={t("employer.manageJobs")} />
        {data.jobs.length === 0 ? (
          <Card className="p-6"><p className="text-sm text-ink-muted">{t("employer.noJobs")}</p></Card>
        ) : (
          <Stagger className="space-y-2.5">
            {data.jobs.slice(0, 4).map((j) => (
              <StaggerItem key={j.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-semibold text-ink">{j.title}</p>
                    <p className="text-sm text-ink-muted">
                      {formatNaira(j.payAmount)} · {t("employer.applicantCount", { count: j.applicants })}
                    </p>
                  </div>
                  {j.escrow?.released ? (
                    <Pill tone="green">{t("employer.released")}</Pill>
                  ) : j.escrow?.funded ? (
                    <Pill tone="green">{t("employer.escrowFunded")}</Pill>
                  ) : (
                    <Pill tone="amber">{t("employer.needsFunding")}</Pill>
                  )}
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </div>

      <Stagger className="grid gap-3 sm:grid-cols-2">
        <StaggerItem><QuickLink href="/escrow" icon={Banknote} label={t("employer.escrow")} hint={t("employer.committed", { amount: formatNaira(data.stats.committed) })} /></StaggerItem>
        <StaggerItem><QuickLink href="/verify" icon={ShieldCheck} label={t("employer.verifyBusiness")} hint={t("common.unlockHigher")} /></StaggerItem>
      </Stagger>
    </div>
  );
}

function EmployerCharts() {
  const t = useTranslations("Overview");
  const { userId } = useSession();
  const [data, setData] = useState<EmployerReports | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    api
      .employerReports(userId, 14)
      .then((r) => alive && setData(r))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [userId]);

  if (failed) return null;

  const payout = data
    ? data.payoutSeries.map((p) => ({
        label: new Date(p.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
        value: Number(p.amount),
      }))
    : [];
  const statuses = data
    ? data.jobsByStatus
        .filter((s) => s.count > 0)
        .map((s) => ({ label: s.status.replace(/_/g, " ").toLowerCase(), value: s.count }))
    : [];

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-ink">{t("employer.payoutTrend")}</h3>
          <Link href="/reports" className="text-sm font-medium text-brand-700 hover:text-brand-800">
            {t("employer.viewReports")}
          </Link>
        </div>
        {!data ? (
          <div className="h-40 w-full animate-pulse rounded-xl bg-line/40" />
        ) : (
          <AreaChart data={payout} money />
        )}
      </Card>
      <Card className="p-5">
        <h3 className="mb-3 font-semibold text-ink">{t("employer.jobsByStatus")}</h3>
        {!data ? (
          <div className="h-40 w-full animate-pulse rounded-xl bg-line/40" />
        ) : statuses.length ? (
          <Donut segments={statuses} centerLabel={t("employer.jobsLabel")} centerValue={String(data.totals.jobsPosted)} />
        ) : (
          <p className="text-sm text-ink-muted">{t("employer.noJobs")}</p>
        )}
      </Card>
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
