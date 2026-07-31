import Link from "next/link";
import { adminFetch, Me } from "@/lib/admin-api";
import { PageHeader, Table, Badge, EmptyState } from "@/components/ui";

interface QueueItem {
  id: string;
  requestedLevel: string;
  status: string;
  hasBvn: boolean;
  documentCount: number;
  createdAt: string;
  user: { id: string; fullName: string | null; phone: string; kycLevel: string } | null;
}

const LEVEL_LABEL: Record<string, string> = { BASIC: "Basic", BVN_VERIFIED: "BVN verified", FULL: "Full" };
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export default async function VerificationPage() {
  const [me, queue] = await Promise.all([
    adminFetch<Me>("/admin/me"),
    adminFetch<QueueItem[]>("/admin/verification?status=pending"),
  ]);
  if (!me || !queue) return <EmptyState>You don&apos;t have access to verification.</EmptyState>;

  return (
    <>
      <PageHeader
        title="Verification"
        subtitle={`${queue.length} identity ${queue.length === 1 ? "check" : "checks"} awaiting review. Approvals raise the user's KYC level; every decision is audited.`}
      />
      {queue.length === 0 ? (
        <EmptyState>No verifications awaiting review.</EmptyState>
      ) : (
        <Table head={["User", "Current", "Requested", "Documents", "Submitted"]}>
          {queue.map((q) => (
            <tr key={q.id} className="hover:bg-app">
              <td className="px-4 py-3">
                <Link href={`/verification/${q.id}`} className="font-medium hover:underline">
                  {q.user?.fullName ?? "—"}
                </Link>
                <div className="font-mono text-xs text-muted">{q.user?.phone}</div>
              </td>
              <td className="px-4 py-3 text-soft">{LEVEL_LABEL[q.user?.kycLevel ?? "NONE"] ?? "None"}</td>
              <td className="px-4 py-3"><Badge tone="indigo">{LEVEL_LABEL[q.requestedLevel] ?? q.requestedLevel}</Badge></td>
              <td className="px-4 py-3 text-soft">
                {q.documentCount} {q.documentCount === 1 ? "file" : "files"}{q.hasBvn ? " · BVN" : ""}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">{when(q.createdAt)}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
