"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Banknote, Receipt, TrendingUp } from "lucide-react";
import { api, type TraderDashboard } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Kpi, SectionHeader } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { CountUp, CountUpNaira, FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { LogSaleCard, SalesList } from "@/components/trader";

export default function SalesPage() {
  const { userId, activeRole } = useSession();
  const router = useRouter();
  const t = useTranslations("Sales");
  const { data, error, reload } = usePageData<TraderDashboard>((id) => api.traderDashboard(id));

  if (activeRole !== "TRADER") {
    router.replace("/overview");
    return null;
  }
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StaggerItem><Kpi icon={<Receipt className="h-4 w-4" />} label={t("thisWeek")} value={<CountUpNaira amount={data.totals.thisWeek} />} caption={t("thisWeekCap")} /></StaggerItem>
        <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label={t("allTime")} value={<CountUpNaira amount={data.totals.allTime} />} caption={t("allTimeCap")} accent="amber" /></StaggerItem>
        <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label={t("transactions")} value={<CountUp value={data.totals.count} />} caption={t("transactionsCap")} accent="neutral" /></StaggerItem>
      </Stagger>

      <FadeIn delay={0.05}>
        <LogSaleCard userId={userId} onLogged={reload} />
      </FadeIn>

      <section>
        <SectionHeader title={t("history")} subtitle={t("historySub")} />
        <SalesList sales={data.sales} />
      </section>
    </div>
  );
}
