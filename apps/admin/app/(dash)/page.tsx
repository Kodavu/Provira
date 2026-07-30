import { adminFetch } from "@/lib/admin-api";
import { Card, PageHeader, StatCard, EmptyState } from "@/components/ui";

interface Dashboard {
  stats: {
    totalUsers: number;
    activeUsers: number;
    pendingDisputes: number;
    pendingKyc: number;
    pendingWithdrawals: number;
    processedVolume: string;
    fraudAlerts: number;
    supportTickets: number;
  };
  recentActivity: Array<{ id: string; action: string; resource: string; admin: string; at: string }>;
}

function naira(kobo: string) {
  return "₦" + new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(Number(kobo) / 100);
}
function ago(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

export default async function DashboardPage() {
  const data = await adminFetch<Dashboard>("/admin/dashboard");
  if (!data) return <EmptyState>Couldn&apos;t load the dashboard.</EmptyState>;
  const s = data.stats;

  return (
    <>
      <PageHeader title="Overview" subtitle="Everything that needs attention across the platform." />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={s.totalUsers} hint={`${s.activeUsers} active`} />
        <StatCard label="Pending disputes" value={s.pendingDisputes} hint="Awaiting review" accent={s.pendingDisputes > 0} />
        <StatCard label="Pending KYC" value={s.pendingKyc} hint="Verification queue" />
        <StatCard label="Pending withdrawals" value={s.pendingWithdrawals} hint="Finance approval" />
        <StatCard label="Processed volume" value={naira(s.processedVolume)} hint="Released from escrow" />
        <StatCard label="Fraud alerts" value={s.fraudAlerts} hint="Risk engine — soon" />
        <StatCard label="Support tickets" value={s.supportTickets} hint="Ticketing — soon" />
        <StatCard label="Active users" value={s.activeUsers} hint="Not suspended" />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Admin activity</h2>
        {data.recentActivity.length === 0 ? (
          <EmptyState>No admin actions yet. They&apos;ll appear here as staff work.</EmptyState>
        ) : (
          <Card className="divide-y divide-[color:var(--border)]">
            {data.recentActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{a.admin}</span>{" "}
                  <span className="text-soft">performed</span>{" "}
                  <span className="font-mono text-xs">{a.action}</span>{" "}
                  <span className="text-soft">on {a.resource}</span>
                </div>
                <span className="text-xs text-muted">{ago(a.at)}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
