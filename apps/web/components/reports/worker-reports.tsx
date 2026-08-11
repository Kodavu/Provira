"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Award, Briefcase, Clock, Repeat, Star, Wallet } from "lucide-react";
import { api, type WorkerPublicProfile } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Card, Kpi, formatNaira } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { Stagger, StaggerItem, CountUp, CountUpNaira } from "@/components/motion";
import { AreaChart, BarList } from "@/components/charts";
import { Certificate } from "@/components/certificate";

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function WorkerReports() {
  const t = useTranslations("Reports");
  const { userId } = useSession();
  const [p, setP] = useState<WorkerPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setError(null);
    try {
      setP(await api.workerPublicProfile(userId));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <PageError message={error} onRetry={load} />;
  if (!p) return <PageSkeleton />;

  // Jobs completed per month (last 6) from work history.
  const now = new Date();
  const months: { key: string; label: string; value: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString("en-NG", { month: "short" }), value: 0 });
  }
  for (const w of p.workHistory) {
    if (!w.completedAt) continue;
    const d = new Date(w.completedAt);
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (m) m.value += 1;
  }

  const stars = [5, 4, 3, 2, 1].map((s) => ({
    label: `${s}★`,
    value: (p.rating.breakdown as Record<string, number>)[String(s)] ?? 0,
  }));

  const verifyUrl = `${typeof window !== "undefined" ? window.location.origin : "https://provira.com.ng"}/w/${p.userId}`;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("workerSubtitle")} />

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StaggerItem><Kpi icon={<Briefcase className="h-4 w-4" />} label={t("jobsDone")} value={<CountUp value={p.stats.jobsCompleted} />} /></StaggerItem>
        <StaggerItem><Kpi icon={<Wallet className="h-4 w-4" />} label={t("totalEarned")} value={<CountUpNaira amount={p.stats.totalEarnings ?? "0"} />} accent="amber" /></StaggerItem>
        <StaggerItem><Kpi icon={<Star className="h-4 w-4" />} label={t("avgRating")} value={<CountUp value={p.rating.average} format={(n) => `${n.toFixed(1)} (${p.rating.count})`} />} /></StaggerItem>
        <StaggerItem><Kpi icon={<Clock className="h-4 w-4" />} label={t("onTime")} value={<CountUp value={Math.round(p.stats.onTimeRate * 100)} format={(n) => pct(n / 100)} />} accent="neutral" /></StaggerItem>
        <StaggerItem><Kpi icon={<Award className="h-4 w-4" />} label={t("completion")} value={<CountUp value={Math.round(p.stats.completionRate * 100)} format={(n) => pct(n / 100)} />} /></StaggerItem>
        <StaggerItem><Kpi icon={<Repeat className="h-4 w-4" />} label={t("repeatHire")} value={<CountUp value={Math.round(p.stats.repeatHireRate * 100)} format={(n) => pct(n / 100)} />} accent="neutral" /></StaggerItem>
      </Stagger>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">{t("jobsPerMonth")}</h3>
          <AreaChart data={months.map((m) => ({ label: m.label, value: m.value }))} />
        </Card>
        <Card className="p-5">
          <h3 className="mb-3 font-semibold text-ink">{t("ratingBreakdown")}</h3>
          {p.rating.count > 0 ? <BarList items={stars} /> : <p className="text-sm text-ink-muted">{t("noReviews")}</p>}
        </Card>
      </div>

      {/* Proof of work */}
      <div className="pt-2">
        <div className="mb-3 flex items-center gap-2">
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">{t("proofOfWork")}</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <Certificate
          title={t("workRecordTitle")}
          holderId={p.userId}
          holderName={p.fullName}
          subtitle={p.headline}
          location={p.location}
          memberSince={p.memberSince}
          score={{ value: p.stats.successScore, tier: p.stats.tier }}
          statement={t("workStatement")}
          verifyUrl={verifyUrl}
          metrics={[
            { label: t("jobsDone"), value: String(p.stats.jobsCompleted) },
            { label: t("totalEarned"), value: formatNaira(p.stats.totalEarnings ?? "0") },
            { label: t("avgRating"), value: `${p.rating.average.toFixed(1)} / 5 (${p.rating.count})` },
            { label: t("onTime"), value: pct(p.stats.onTimeRate) },
            { label: t("completion"), value: pct(p.stats.completionRate) },
            { label: t("repeatHire"), value: pct(p.stats.repeatHireRate) },
          ]}
          table={{
            columns: [t("colJob"), t("colEmployer"), t("colCategory"), t("colDate"), t("colRating")],
            rows: p.workHistory.slice(0, 10).map((w) => ({
              cells: [
                w.jobTitle,
                w.employerName ?? "—",
                w.category ?? "—",
                w.completedAt ? new Date(w.completedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : "—",
                w.rating ? `${w.rating}★` : "—",
              ],
            })),
          }}
        />
      </div>
    </div>
  );
}
