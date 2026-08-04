"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { api, type TraderDashboard, type WorkerDashboard } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Card } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { FadeIn } from "@/components/motion";
import { LoanOffers } from "@/components/worker";

export default function LoansPage() {
  const { activeRole } = useSession();
  const router = useRouter();
  if (activeRole === "EMPLOYER") {
    router.replace("/overview");
    return null;
  }
  return activeRole === "TRADER" ? <TraderLoans /> : <WorkerLoans />;
}

function WorkerLoans() {
  const { userId } = useSession();
  const t = useTranslations("Loans");
  const { data, error, reload } = usePageData<WorkerDashboard>((id) => api.workerDashboard(id));
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("workerTitle")} subtitle={t("workerSubtitle")} />
      <FadeIn delay={0.05}>
        <LoanOffers offers={data.loanOffers} userId={userId} />
      </FadeIn>
      <HowItWorks />
    </div>
  );
}

function TraderLoans() {
  const { userId } = useSession();
  const t = useTranslations("Loans");
  const { data, error, reload } = usePageData<TraderDashboard>((id) => api.traderDashboard(id));
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader title={t("traderTitle")} subtitle={t("traderSubtitle")} />
      <FadeIn delay={0.05}>
        <LoanOffers offers={data.loanOffers} userId={userId} />
      </FadeIn>
      <HowItWorks />
    </div>
  );
}

function HowItWorks() {
  const t = useTranslations("Loans");
  return (
    <Card className="bg-brand-50/50 p-5">
      <p className="text-sm text-ink-soft">
        <span className="font-semibold text-ink">{t("howTitle")}</span> {t("howBody")}
      </p>
    </Card>
  );
}
