"use client";

import { useRouter } from "next/navigation";
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
  const { data, error, reload } = usePageData<WorkerDashboard>((id) => api.workerDashboard(id));
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        subtitle="Built off the work you've done. The more you show up, the more we trust you."
      />
      <FadeIn delay={0.05}>
        <LoanOffers offers={data.loanOffers} userId={userId} />
      </FadeIn>
      <HowItWorks />
    </div>
  );
}

function TraderLoans() {
  const { userId } = useSession();
  const { data, error, reload } = usePageData<TraderDashboard>((id) => api.traderDashboard(id));
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Stock loans"
        subtitle="Qualify for working capital once you've built a track record of logged sales."
      />
      <FadeIn delay={0.05}>
        <LoanOffers offers={data.loanOffers} userId={userId} />
      </FadeIn>
      <HowItWorks />
    </div>
  );
}

function HowItWorks() {
  return (
    <Card className="bg-brand-50/50 p-5">
      <p className="text-sm text-ink-soft">
        <span className="font-semibold text-ink">How eligibility works:</span> your Tally score decides which
        products you qualify for. Approved loans disburse straight to your payout account, and repaying on time
        raises your score — unlocking larger limits next time.
      </p>
    </Card>
  );
}
