import { adminFetch } from "@/lib/admin-api";
import { Badge, Card, PageHeader, EmptyState } from "@/components/ui";

interface RolesData {
  roles: Array<{ id: string; name: string; description: string | null; isSystem: boolean; adminCount: number; permissions: string[] }>;
  permissions: Array<{ key: string; group: string; label: string }>;
}

export default async function RolesPage() {
  const data = await adminFetch<RolesData>("/admin/roles");
  if (!data) return <EmptyState>You don&apos;t have access to roles.</EmptyState>;

  const groups = data.permissions.reduce<Record<string, typeof data.permissions>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Roles & access" subtitle="Roles are bundles of permissions. Nothing is hardcoded." />

      <div className="grid gap-4 lg:grid-cols-2">
        {data.roles.map((r) => (
          <Card key={r.id} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{r.name}</h3>
                  {r.isSystem && <Badge tone="indigo">System</Badge>}
                </div>
                <p className="mt-0.5 text-sm text-soft">{r.description}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{r.permissions.length}</p>
                <p className="text-xs text-muted">permissions</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-muted">{r.adminCount} admin{r.adminCount === 1 ? "" : "s"} assigned</p>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Permission catalog</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groups).map(([group, perms]) => (
          <Card key={group} className="p-4">
            <p className="eyebrow mb-2">{group}</p>
            <div className="flex flex-wrap gap-1.5">
              {perms.map((p) => (
                <Badge key={p.key}>{p.label}</Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
