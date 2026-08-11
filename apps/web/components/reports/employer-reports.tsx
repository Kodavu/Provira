"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Banknote, Briefcase, CheckCircle2, Clock, Target, Users } from "lucide-react";
import { api, type EmployerReports as EmployerReportsData } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Card, Kpi } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { Stagger, StaggerItem, CountUp, CountUpNaira } from "@/components/motion";
import { AreaChart, BarList, Donut, Funnel, SERIES } from "@/components/charts";

const RANGES = [7, 30, 90] as const;

export function EmployerReports() {
  const t = useTranslations("Reports");
  const { userId } = useSession();
  const [days, setDays] = useState<number>(30);
  const [data, setData] = useState<EmployerReportsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setData(null);
    try {
      setData(await api.employerReports(userId, days));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId, days]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeToggle = (
    <div className="inline-flex rounded-xl border border-line bg-surface p-1">
      {RANGES.map((d) => (
        <button
          key={d}
          onClick={() => setDays(d)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            days === d ? "bg-brand-600 text-white shadow-sm" : "text-ink-soft hover:text-ink"
          }`}
        >
          {t(`range${d}`)}
        </button>
      ))}
    </div>
  );

  if (error) return <PageError message={error} onRetry={load} />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} action={rangeToggle} />

      {!data ? (
        <PageSkeleton />
      ) : data.totals.jobsPosted === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-ink-muted">{t("noData")}</p>
        </Card>
      ) : (
        <>
          {/* KPIs */}
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StaggerItem>
              <Kpi icon={<Banknote className="h-4 w-4" />} label={t("totalPaid")} value={<CountUpNaira amount={data.totals.totalPaid} />} accent="amber" />
            </StaggerItem>
            <StaggerItem>
              <Kpi icon={<Users className="h-4 w-4" />} label={t("workersHired")} value={<CountUp value={data.totals.workersHired} />} />
            </StaggerItem>
            <StaggerItem>
              <Kpi icon={<Target className="h-4 w-4" />} label={t("fillRate")} value={<CountUp value={Math.round(data.totals.fillRate * 100)} format={(n) => `${Math.round(n)}%`} />} />
            </StaggerItem>
            <StaggerItem>
              <Kpi icon={<Briefcase className="h-4 w-4" />} label={t("jobsPosted")} value={<CountUp value={data.totals.jobsPosted} />} accent="neutral" />
            </StaggerItem>
            <StaggerItem>
              <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label={t("jobsCompleted")} value={<CountUp value={data.totals.jobsCompleted} />} />
            </StaggerItem>
            <StaggerItem>
              <Kpi
                icon={<Clock className="h-4 w-4" />}
                label={t("avgTimeToFill")}
                value={
                  data.totals.avgTimeToFillHours == null
                    ? t("none")
                    : <CountUp value={data.totals.avgTimeToFillHours} format={(n) => t("hours", { n: Math.round(n) })} />
                }
                accent="neutral"
              />
            </StaggerItem>
          </Stagger>

          {/* Payout trend + jobs by status */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-ink">{t("payoutPerDay")}</h3>
              <AreaChart
                data={data.payoutSeries.map((p) => ({
                  label: new Date(p.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }),
                  value: Number(p.amount),
                }))}
                money
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-ink">{t("jobsByStatus")}</h3>
              <Donut
                segments={data.jobsByStatus
                  .filter((s) => s.count > 0)
                  .map((s) => ({ label: s.status.replace(/_/g, " ").toLowerCase(), value: s.count }))}
                centerLabel={t("jobsLabel")}
                centerValue={String(data.totals.jobsPosted)}
              />
            </Card>
          </div>

          {/* Funnel + top workers */}
          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-4 font-semibold text-ink">{t("hireFunnel")}</h3>
              <Funnel
                steps={[
                  { label: t("applied"), value: data.funnel.applied },
                  { label: t("accepted"), value: data.funnel.accepted },
                  { label: t("confirmed"), value: data.funnel.confirmed },
                ]}
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-4 font-semibold text-ink">{t("topWorkers")}</h3>
              <BarList
                money
                items={data.topWorkers.map((w) => ({
                  label: w.name,
                  value: Number(w.paid),
                  sub: `· ${t("jobsCount", { count: w.jobs })}`,
                  avatarUrl: w.avatarUrl,
                }))}
              />
            </Card>
          </div>

          {/* Category breakdown */}
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-ink">{t("spendByCategory")}</h3>
            <BarList
              color={SERIES[2]}
              items={data.categoryBreakdown.map((c) => ({
                label: c.category.charAt(0).toUpperCase() + c.category.slice(1),
                value: c.count,
              }))}
            />
          </Card>
        </>
      )}
    </div>
  );
}
