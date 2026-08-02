"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { api, type EmployerDashboard, type WorkerDashboard } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Button, SectionHeader } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { FadeIn } from "@/components/motion";
import { AssignmentsList, JobsNearby, ApplyCodeBanner } from "@/components/worker";
import { JobsBoard } from "@/components/employer";

export default function JobsPage() {
  const { activeRole } = useSession();
  if (activeRole === "EMPLOYER") return <EmployerJobs />;
  if (activeRole === "WORKER") return <WorkerJobs />;
  return <RedirectHome />;
}

function RedirectHome() {
  const router = useRouter();
  router.replace("/overview");
  return null;
}

function WorkerJobs() {
  const { userId } = useSession();
  const { data, error, reload } = usePageData<WorkerDashboard>((id) => api.workerDashboard(id));
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{ jobTitle: string; code: string | null } | null>(null);

  async function handleApply(jobId: string) {
    if (!data) return;
    setApplyingId(jobId);
    try {
      const res = await api.applyToJob(jobId, userId);
      const job = data.openJobs.find((j) => j.id === jobId);
      setApplyResult({ jobTitle: job?.title ?? "this shift", code: res.code });
      toast.success("Applied!", {
        description: res.code ? `Your confirmation code is ${res.code}.` : "You've already applied to this shift.",
      });
      await reload();
    } catch (e) {
      toast.error("Couldn't apply", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setApplyingId(null);
    }
  }

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const assignedJobIds = new Set(data.assignments.map((a) => a.job.id));
  const availableJobs = data.openJobs.filter((j) => !assignedJobIds.has(j.id));

  return (
    <div className="space-y-8">
      <PageHeader
        title="Jobs"
        subtitle="Apply to shifts near you, then confirm attendance with the employer's code to get paid."
      />

      {applyResult && (
        <ApplyCodeBanner
          jobTitle={applyResult.jobTitle}
          code={applyResult.code}
          onDismiss={() => setApplyResult(null)}
        />
      )}

      <section>
        <SectionHeader
          title="Your shifts"
          subtitle="Shifts you're on. Enter the employer's 4-digit code to confirm attendance and get paid."
        />
        <AssignmentsList assignments={data.assignments} onConfirmed={reload} />
      </section>

      <section>
        <SectionHeader title="Jobs nearby" subtitle="Open jobs near you — tap apply to get your confirmation code." />
        <JobsNearby jobs={availableJobs} onApply={handleApply} applyingId={applyingId} />
      </section>
    </div>
  );
}

function EmployerJobs() {
  const { data, error, reload } = usePageData<EmployerDashboard>((id) => api.employerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your jobs"
        subtitle="Fund escrow to secure a shift, then find workers. Release pay when the worker confirms with their code."
        action={
          <Link href="/jobs/new">
            <Button><PlusCircle className="h-4 w-4" /> Post a job</Button>
          </Link>
        }
      />
      <FadeIn delay={0.05}>
        <JobsBoard jobs={data.jobs} onChange={reload} />
      </FadeIn>
    </div>
  );
}
