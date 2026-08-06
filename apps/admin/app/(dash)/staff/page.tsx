import Link from "next/link";
import { adminFetch, Me } from "@/lib/admin-api";
import { Badge, PageHeader, StatCard, Table, EmptyState } from "@/components/ui";
import { InviteStaff } from "@/components/staff-invite";

interface Staff {
  id: string;
  fullName: string;
  email: string;
  department: string | null;
  status: "INVITED" | "ACTIVE" | "DISABLED";
  lastLoginAt: string | null;
  roles: string[];
}

const STATUS_TONE = { ACTIVE: "green", DISABLED: "red", INVITED: "amber" } as const;

export default async function StaffPage() {
  const [staff, me, roles] = await Promise.all([
    adminFetch<Staff[]>("/admin/staff"),
    adminFetch<Me>("/admin/me"),
    adminFetch<Array<{ id: string; name: string }>>("/admin/staff/assignable-roles"),
  ]);
  if (!staff || !me) return <EmptyState>You don&apos;t have access to staff management.</EmptyState>;
  const canInvite = me.permissions.includes("admin_users:create");
  const activeCount = staff.filter((member) => member.status === "ACTIVE").length;
  const invitedCount = staff.filter((member) => member.status === "INVITED").length;
  const disabledCount = staff.filter((member) => member.status === "DISABLED").length;

  return (
    <>
      <PageHeader
        title="Staff"
        subtitle={`${staff.length} internal ${staff.length === 1 ? "member" : "members"}. Every change is audited.`}
        action={canInvite && roles ? <InviteStaff roles={roles} /> : undefined}
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total staff" value={staff.length} hint="Visible in this workspace" accent />
        <StatCard label="Active" value={activeCount} hint="Currently enabled accounts" />
        <StatCard label="Invited" value={invitedCount} hint="Waiting for first login" />
        <StatCard label="Disabled" value={disabledCount} hint="Temporarily suspended users" />
      </div>
      <Table head={["Name", "Department", "Roles", "Status", "Last login", "Action"]}>
        {staff.map((s) => (
          <tr key={s.id} className="hover:bg-app">
            <td className="px-4 py-3">
              <span className="font-medium hover:underline">{s.fullName}</span>
              <div className="text-xs text-muted">{s.email}</div>
            </td>
            <td className="px-4 py-3 text-soft">{s.department ?? "—"}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {s.roles.length ? s.roles.map((r) => <Badge key={r} tone="indigo">{r}</Badge>) : <span className="text-muted">None</span>}
              </div>
            </td>
            <td className="px-4 py-3"><Badge tone={STATUS_TONE[s.status]}>{s.status.toLowerCase()}</Badge></td>
            <td className="px-4 py-3 whitespace-nowrap text-xs text-muted">
              {s.lastLoginAt ? new Date(s.lastLoginAt).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" }) : "Never"}
            </td>
            <td className="px-4 py-3">
              <Link
                href={`/staff/${s.id}`}
                className="inline-flex items-center justify-center rounded-xl border border-app bg-white/70 px-3 py-2 text-xs font-semibold text-soft transition hover:border-brand-500/40 hover:text-[color:var(--text)] hover:shadow-sm dark:bg-white/[0.03]"
              >
                View
              </Link>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
