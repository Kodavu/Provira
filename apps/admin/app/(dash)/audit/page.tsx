import { adminFetch } from "@/lib/admin-api";
import { Badge, PageHeader, Table, EmptyState } from "@/components/ui";
import { humanizeAction, titleize } from "@/lib/labels";

interface Log {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  previousValue: unknown;
  newValue: unknown;
  createdAt: string;
  adminUser: { fullName: string; email: string } | null;
}

function short(v: unknown) {
  if (v == null) return "—";
  const s = JSON.stringify(v);
  return s.length > 40 ? s.slice(0, 40) + "…" : s;
}

export default async function AuditPage() {
  const logs = await adminFetch<Log[]>("/admin/audit-logs");
  if (!logs) return <EmptyState>You don&apos;t have access to audit logs.</EmptyState>;

  return (
    <>
      <PageHeader title="Audit logs" subtitle="Append-only record of every admin action. Immutable." />
      {logs.length === 0 ? (
        <EmptyState>No audit entries yet.</EmptyState>
      ) : (
        <Table head={["Admin", "Action", "Resource", "Before → After", "IP", "When"]}>
          {logs.map((l) => (
            <tr key={l.id}>
              <td className="px-4 py-3 font-medium">{l.adminUser?.fullName ?? "System"}</td>
              <td className="px-4 py-3"><Badge tone="indigo">{humanizeAction(l.action)}</Badge></td>
              <td className="px-4 py-3 text-soft">{titleize(l.resource)}{l.resourceId ? ` · ${l.resourceId.slice(0, 6)}` : ""}</td>
              <td className="px-4 py-3 font-mono text-xs text-soft">{short(l.previousValue)} → {short(l.newValue)}</td>
              <td className="px-4 py-3 text-xs text-muted">{l.ip ?? "—"}</td>
              <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">{new Date(l.createdAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
