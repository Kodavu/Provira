"use client";

import { useRouter } from "next/navigation";
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
  const { data, error, reload } = usePageData<TraderDashboard>((id) => api.traderDashboard(id));

  if (activeRole !== "TRADER") {
    router.replace("/overview");
    return null;
  }
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        subtitle="Log every sale — it builds the track record that unlocks stock loans."
      />

      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StaggerItem><Kpi icon={<Receipt className="h-4 w-4" />} label="This week" value={<CountUpNaira amount={data.totals.thisWeek} />} caption="Logged in last 7 days." /></StaggerItem>
        <StaggerItem><Kpi icon={<TrendingUp className="h-4 w-4" />} label="All-time" value={<CountUpNaira amount={data.totals.allTime} />} caption="Across your record." accent="amber" /></StaggerItem>
        <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label="Transactions" value={<CountUp value={data.totals.count} />} caption="Total sales logged." accent="neutral" /></StaggerItem>
      </Stagger>

      <FadeIn delay={0.05}>
        <LogSaleCard userId={userId} onLogged={reload} />
      </FadeIn>

      <section>
        <SectionHeader title="Sales history" subtitle="Every sale you've logged, most recent first." />
        <SalesList sales={data.sales} />
      </section>
    </div>
  );
}
