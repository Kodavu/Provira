"use client";

import { useSession } from "@/lib/session-context";
import { WorkerOverview, TraderOverview, EmployerOverview } from "@/components/overviews";

// One home for everyone; content follows the active role.
export default function OverviewPage() {
  const { activeRole } = useSession();
  if (activeRole === "EMPLOYER") return <EmployerOverview />;
  if (activeRole === "TRADER") return <TraderOverview />;
  return <WorkerOverview />;
}
