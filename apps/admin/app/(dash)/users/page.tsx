import { adminFetch, Me } from "@/lib/admin-api";
import { PageHeader, EmptyState } from "@/components/ui";
import { UsersTable, UserRow } from "@/components/users-table";

export default async function UsersPage() {
  const [users, me] = await Promise.all([
    adminFetch<UserRow[]>("/admin/users"),
    adminFetch<Me>("/admin/me"),
  ]);
  if (!users || !me) return <EmptyState>Couldn&apos;t load users.</EmptyState>;
  const canSuspend = me.permissions.includes("users:suspend");

  return (
    <>
      <PageHeader title="Users" subtitle={`${users.length} platform members. Suspensions are audited.`} />
      <UsersTable users={users} canSuspend={canSuspend} />
    </>
  );
}
