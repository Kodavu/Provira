"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, Coins, Receipt, TrendingUp } from "lucide-react";
import { api, type TraderDashboard, type TraderReports as TReports } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Card, Kpi, formatNaira } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { Stagger, StaggerItem, CountUp, CountUpNaira } from "@/components/motion";
import { AreaChart, BarList, SERIES } from "@/components/charts";
import { Certificate } from "@/components/certificate";

const RANGES = [30, 90, 180] as const;

export function TraderReports() {
  const t = useTranslations("Reports");
  const { userId } = useSession();
  const [days, setDays] = useState<number>(90);
  const [r, setR] = useState<TReports | null>(null);
  const [info, setInfo] = useState<TraderDashboard["user"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    setR(null);
    try {
      const [rep, dash] = await Promise.all([
        api.traderReports(userId, days),
        info ? Promise.resolve(null) : api.traderDashboard(userId),
      ]);
      setR(rep);
      if (dash) setInfo(dash.user);
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId, days, info]);

  useEffect(() => {
    load();
  }, [load]);

  const rangeToggle = (
    <div className="inline-flex rounded-xl border border-line bg-surface p-1">
      {RANGES.map((d) => (
        <button
          key={d}
          onClick={() => setDays(d)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${days === d ? "bg-brand-600 text-white shadow-sm" : "text-ink-soft hover:text-ink"}`}
        >
          {t("rangeDays", { n: d })}
        </button>
      ))}
    </div>
  );

  if (error) return <PageError message={error} onRetry={load} />;

  const holderName = info?.businessName ?? info?.fullName ?? "Trader";
  const verifyUrl = typeof window !== "undefined" ? window.location.origin : "https://provira.com.ng";

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("traderSubtitle")} action={rangeToggle} />

      {!r ? (
        <PageSkeleton />
      ) : r.totals.salesCount === 0 ? (
        <Card className="p-10 text-center"><p className="text-sm text-ink-muted">{t("noSales")}</p></Card>
      ) : (
        <>
          <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StaggerItem><Kpi icon={<Coins className="h-4 w-4" />} label={t("totalSales")} value={<CountUpNaira amount={r.totals.allTime} />} accent="amber" /></StaggerItem>
            <StaggerItem><Kpi icon={<Receipt className="h-4 w-4" />} label={t("salesLogged")} value={<CountUp value={r.totals.salesCount} />} /></StaggerItem>
            <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label={t("avgSale")} value={<CountUpNaira amount={r.totals.avgSale} />} accent="neutral" /></StaggerItem>
            <StaggerItem><Kpi icon={<CalendarDays className="h-4 w-4" />} label={t("activeDays")} value={<CountUp value={r.totals.activeDays} />} /></StaggerItem>
            <StaggerItem><Kpi icon={<CalendarDays className="h-4 w-4" />} label={t("monthsTrading")} value={<CountUp value={r.totals.monthsActive} />} accent="neutral" /></StaggerItem>
            <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label={t("proviraScore")} value={<CountUp value={r.score.value} format={(n) => `${Math.round(n)} · ${r.score.tier}`} />} /></StaggerItem>
          </Stagger>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-ink">{t("salesPerDay")}</h3>
              <AreaChart
                money
                data={r.series.map((s) => ({ label: new Date(s.date).toLocaleDateString("en-NG", { day: "numeric", month: "short" }), value: Number(s.amount) }))}
              />
            </Card>
            <Card className="p-5">
              <h3 className="mb-3 font-semibold text-ink">{t("byMethod")}</h3>
              {r.byMethod.length ? (
                <BarList
                  money
                  color={SERIES[2]}
                  items={r.byMethod.map((m) => ({
                    label: m.method.charAt(0).toUpperCase() + m.method.slice(1),
                    value: Number(m.amount),
                    sub: `· ${t("salesN", { count: m.count })}`,
                  }))}
                />
              ) : (
                <p className="text-sm text-ink-muted">{t("noSales")}</p>
              )}
            </Card>
          </div>

          <div className="pt-2">
            <div className="mb-3 flex items-center gap-2">
              <span className="h-px flex-1 bg-line" />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">{t("proofOfTrade")}</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <Certificate
              title={t("tradeRecordTitle")}
              holderId={userId ?? ""}
              holderName={holderName}
              subtitle={info?.marketName}
              phone={info?.phone}
              memberSince={r.memberSince}
              score={{ value: r.score.value, tier: r.score.tier }}
              statement={t("tradeStatement")}
              verifyUrl={verifyUrl}
              metrics={[
                { label: t("totalSales"), value: formatNaira(r.totals.allTime) },
                { label: t("salesLogged"), value: String(r.totals.salesCount) },
                { label: t("avgSale"), value: formatNaira(r.totals.avgSale) },
                { label: t("activeDays"), value: String(r.totals.activeDays) },
                { label: t("monthsTrading"), value: String(r.totals.monthsActive) },
                { label: t("proviraScore"), value: `${r.score.value} · ${r.score.tier}` },
              ]}
              table={
                r.byMethod.length
                  ? {
                      columns: [t("colMethod"), t("colCount"), t("colAmount")],
                      rows: r.byMethod.map((m) => ({
                        cells: [m.method.charAt(0).toUpperCase() + m.method.slice(1), String(m.count), formatNaira(m.amount)],
                      })),
                    }
                  : null
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
