import Link from "next/link";
import { adminFetch, Me } from "@/lib/admin-api";
import { Badge, Card, EmptyState, StatCard, Table } from "@/components/ui";
import { StaffActions } from "@/components/staff-actions";
import { humanizeAction, titleize } from "@/lib/labels";

interface Detail {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  status: "INVITED" | "ACTIVE" | "DISABLED";
  lastLoginAt: string | null;
  createdAt: string;
  roles: Array<{ id: string; name: string }>;
  loginHistory: Array<{ id: string; ip: string | null; device: string | null; success: boolean; at: string }>;
  activity: Array<{ id: string; action: string; resource: string; createdAt: string }>;
}

const STATUS_TONE = { ACTIVE: "green", DISABLED: "red", INVITED: "amber" } as const;
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
const device = (ua: string | null) => (ua ? (/(iPhone|Android|Mobile)/.test(ua) ? "Mobile" : /Chrome|Firefox|Safari|Edg/.test(ua) ? "Desktop browser" : ua.slice(0, 24)) : "—");

export default async function StaffDetailPage({ params }: { params: { id: string } }) {
  const [d, me, roles] = await Promise.all([
    adminFetch<Detail>(`/admin/staff/${params.id}`),
    adminFetch<Me>("/admin/me"),
    adminFetch<Array<{ id: string; name: string }>>("/admin/staff/assignable-roles"),
  ]);
  if (!d || !me) return <EmptyState>Couldn&apos;t load this staff member.</EmptyState>;
  const p = new Set(me.permissions);

  return (
    <>
      <Link href="/staff" className="text-sm text-soft hover:text-[color:var(--text)]">&larr; All staff</Link>
      <div className="mb-6 mt-2 flex items-center gap-3">
        <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-600 text-lg font-bold text-white">
          {d.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </span>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{d.fullName}</h1>
            <Badge tone={STATUS_TONE[d.status]}>{d.status.toLowerCase()}</Badge>
          </div>
          <p className="text-sm text-soft">{d.email}{d.department ? ` · ${d.department}` : ""}</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Roles" value={d.roles.length} hint="Granted access groups" accent />
        <StatCard label="Login attempts" value={d.loginHistory.length} hint="Successful and failed logins" />
        <StatCard label="Audit events" value={d.activity.length} hint="Tracked admin actions" />
        <StatCard label="Account age" value={new Date(d.createdAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })} hint="Date added to staff" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Department" value={d.department ?? "—"} />
            <Field label="Joined" value={when(d.createdAt)} />
            <Field label="Last login" value={d.lastLoginAt ? when(d.lastLoginAt) : "Never"} />
            <Field label="Roles" value={d.roles.map((r) => r.name).join(", ") || "None"} />
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Login history</h2>
            {d.loginHistory.length === 0 ? (
              <EmptyState>No logins recorded.</EmptyState>
            ) : (
              <Table head={["When", "Result", "IP", "Device"]}>
                {d.loginHistory.map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5 whitespace-nowrap text-sm">{when(l.at)}</td>
                    <td className="px-4 py-2.5"><Badge tone={l.success ? "green" : "red"}>{l.success ? "success" : "failed"}</Badge></td>
                    <td className="px-4 py-2.5 font-mono text-xs text-soft">{l.ip ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-soft">{device(l.device)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Recent activity</h2>
            {d.activity.length === 0 ? (
              <EmptyState>No actions recorded yet.</EmptyState>
            ) : (
              <Card className="divide-y divide-[color:var(--border)]">
                {d.activity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <span className="font-medium">{humanizeAction(a.action)}</span>
                    <span className="text-xs text-muted">{titleize(a.resource)} · {when(a.createdAt)}</span>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>

        <div>
          <StaffActions
            id={d.id}
            status={d.status}
            currentRoleIds={d.roles.map((r) => r.id)}
            roles={roles ?? []}
            perms={{
              assignRoles: p.has("admin_users:assign_roles"),
              disable: p.has("admin_users:disable"),
              reset: p.has("admin_users:edit"),
            }}
          />
        </div>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
