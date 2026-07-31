import { adminFetch, Me } from "@/lib/admin-api";
import { PageHeader, StatCard, Table, Badge, EmptyState, Card } from "@/components/ui";
import { WithdrawalActions } from "@/components/withdrawal-actions";

interface Summary {
  pendingCount: number;
  pendingAmount: string;
  settledCount: number;
  settledAmount: string;
}
interface Withdrawal {
  id: string;
  amount: string;
  status: string;
  providerRef: string | null;
  createdAt: string;
  user: { id: string; fullName: string | null; phone: string } | null;
}
interface Txn {
  id: string;
  type: string;
  status: string;
  reference: string | null;
  createdAt: string;
  amount: string;
  legs: Array<{ direction: string; amount: string; account: string }>;
}

const naira = (kobo: string) => `₦${(Number(kobo) / 100).toLocaleString("en-NG")}`;
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const STATUS_TONE: Record<string, "neutral" | "amber" | "green" | "red"> = {
  CREATED: "amber", PROCESSING: "amber", SUCCEEDED: "green", FAILED: "red", REVERSED: "neutral", POSTED: "green", PENDING: "amber",
};

export default async function FinancePage() {
  const [me, summary, withdrawals, txns] = await Promise.all([
    adminFetch<Me>("/admin/me"),
    adminFetch<Summary>("/admin/finance/summary"),
    adminFetch<Withdrawal[]>("/admin/finance/withdrawals?status=pending"),
    adminFetch<Txn[]>("/admin/finance/transactions"),
  ]);
  if (!me || !summary) return <EmptyState>You don&apos;t have access to finance.</EmptyState>;
  const canApprove = me.permissions.includes("finance:approve_withdrawals");

  return (
    <>
      <PageHeader title="Finance" subtitle="Withdrawal approvals and the platform ledger. Every decision is audited." />

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending withdrawals" value={String(summary.pendingCount)} hint={naira(summary.pendingAmount)} />
        <StatCard label="Settled payouts" value={String(summary.settledCount)} hint={naira(summary.settledAmount)} />
        <StatCard label="Awaiting approval" value={naira(summary.pendingAmount)} hint={canApprove ? "You can approve" : "View only"} accent />
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Withdrawal queue</h2>
        {!withdrawals || withdrawals.length === 0 ? (
          <EmptyState>No withdrawals awaiting approval.</EmptyState>
        ) : (
          <Table head={["User", "Amount", "Requested", canApprove ? "Actions" : "Status"]}>
            {withdrawals.map((w) => (
              <tr key={w.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{w.user?.fullName ?? "—"}</div>
                  <div className="font-mono text-xs text-muted">{w.user?.phone}</div>
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums">{naira(w.amount)}</td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">{when(w.createdAt)}</td>
                <td className="px-4 py-3">
                  {canApprove ? (
                    <WithdrawalActions id={w.id} />
                  ) : (
                    <Badge tone={STATUS_TONE[w.status] ?? "neutral"}>{w.status.toLowerCase()}</Badge>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Recent ledger activity</h2>
        {!txns || txns.length === 0 ? (
          <EmptyState>No transactions yet.</EmptyState>
        ) : (
          <Card className="divide-y divide-[color:var(--border)]">
            {txns.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{t.type.replace(/_/g, " ").toLowerCase()}</span>
                    <Badge tone={STATUS_TONE[t.status] ?? "neutral"}>{t.status.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {t.legs.map((l) => `${l.direction === "DEBIT" ? "−" : "+"}${l.account.replace(/_/g, " ").toLowerCase()}`).join("  ·  ")}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-semibold tabular-nums">{naira(t.amount)}</div>
                  <div className="text-xs text-muted">{when(t.createdAt)}</div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>
    </>
  );
}
