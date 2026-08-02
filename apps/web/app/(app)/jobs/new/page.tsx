"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { api, type EmployerDashboard } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Card } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { FadeIn } from "@/components/motion";
import { PostJobCard } from "@/components/employer";

export default function NewJobPage() {
  const { activeRole } = useSession();
  const router = useRouter();
  const { data, error, reload } = usePageData<EmployerDashboard>((id) => api.employerDashboard(id));

  if (activeRole !== "EMPLOYER") {
    router.replace("/overview");
    return null;
  }
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>
      <PageHeader title="Post a job" subtitle="Describe the shift and set the pay. We create the escrow account automatically." />
      <FadeIn delay={0.05}>
        <PostJobCard
          employerProfileId={data.employerProfileId}
          onPosted={(jobId) => router.push(`/jobs/${jobId}`)}
        />
      </FadeIn>
      <Card className="bg-brand-50/50 p-5">
        <p className="text-sm text-ink-soft">
          <span className="font-semibold text-ink">How it works:</span> once posted, fund escrow to secure the shift,
          then invite suggested workers or accept applications. Pay is released only when a worker confirms
          attendance with their 4-digit code.
        </p>
      </Card>
    </div>
  );
}
