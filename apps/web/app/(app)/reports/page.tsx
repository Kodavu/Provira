"use client";

import { useSession } from "@/lib/session-context";
import { PageSkeleton } from "@/components/page";
import { EmployerReports } from "@/components/reports/employer-reports";
import { WorkerReports } from "@/components/reports/worker-reports";
import { TraderReports } from "@/components/reports/trader-reports";

// Role-aware reports: employers get hiring analytics; workers and traders get
// their performance plus a downloadable, verifiable proof-of-work / trade record.
export default function ReportsPage() {
  const { activeRole } = useSession();
  if (!activeRole) return <PageSkeleton />;
  if (activeRole === "EMPLOYER") return <EmployerReports />;
  if (activeRole === "TRADER") return <TraderReports />;
  return <WorkerReports />;
}
