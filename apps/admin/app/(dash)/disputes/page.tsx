import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { Badge, PageHeader, Table, EmptyState } from "@/components/ui";

interface Dispute {
  id: string;
  code: string;
  title: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: string;
  createdAt: string;
  reporter: { fullName: string | null; phone: string } | null;
  defendant: { fullName: string | null; phone: string } | null;
  assignedAdmin: { fullName: string } | null;
}

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "amber", HIGH: "red", URGENT: "red" } as const;
const STATUS_TONE: Record<string, "neutral" | "amber" | "green" | "red" | "indigo"> = {
  OPEN: "amber",
  UNDER_REVIEW: "indigo",
  WAITING_FOR_USER: "neutral",
  ESCALATED: "red",
  RESOLVED: "green",
  CLOSED: "neutral",
};

export default async function DisputesPage() {
  const disputes = await adminFetch<Dispute[]>("/admin/disputes");
  if (!disputes) return <EmptyState>You don&apos;t have access to disputes.</EmptyState>;

  return (
    <>
      <PageHeader title="Disputes" subtitle="Cases across the platform, highest priority first." />
      {disputes.length === 0 ? (
        <EmptyState>No disputes in the queue.</EmptyState>
      ) : (
        <Table head={["Case", "Title", "Reporter", "Priority", "Status", "Assigned", "Opened"]}>
          {disputes.map((d) => (
            <tr key={d.id} className="hover:bg-app">
              <td className="px-4 py-3 font-mono text-xs font-semibold">
                <Link href={`/disputes/${d.id}`} className="text-brand-500 hover:underline">{d.code}</Link>
              </td>
              <td className="px-4 py-3 font-medium">
                <Link href={`/disputes/${d.id}`} className="hover:underline">{d.title}</Link>
              </td>
              <td className="px-4 py-3 text-soft">{d.reporter?.fullName ?? d.reporter?.phone ?? "—"}</td>
              <td className="px-4 py-3"><Badge tone={PRIORITY_TONE[d.priority]}>{d.priority.toLowerCase()}</Badge></td>
              <td className="px-4 py-3"><Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{d.status.replace("_", " ").toLowerCase()}</Badge></td>
              <td className="px-4 py-3 text-soft">{d.assignedAdmin?.fullName ?? <span className="text-muted">Unassigned</span>}</td>
              <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">{new Date(d.createdAt).toLocaleDateString("en-NG", { dateStyle: "medium" })}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
