"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "./ui";

interface Role { id: string; name: string }
export interface StaffPerms { assignRoles: boolean; disable: boolean; reset: boolean }

export function StaffActions({
  id,
  status,
  currentRoleIds,
  roles,
  perms,
}: {
  id: string;
  status: string;
  currentRoleIds: string[];
  roles: Role[];
  perms: StaffPerms;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(currentRoleIds));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [temp, setTemp] = useState<string | null>(null);

  async function run(action: string, extra: Record<string, unknown> = {}) {
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(res.status === 403 ? "Not permitted" : data.message || "Failed");
      if (action === "reset") setTemp(data.tempPassword);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const nothing = !perms.assignRoles && !perms.disable && !perms.reset;
  if (nothing) return null;

  return (
    <Card className="space-y-5 p-5">
      <h3 className="font-semibold">Manage</h3>

      {perms.assignRoles && (
        <div>
          <p className="eyebrow mb-1.5">Roles</p>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => {
              const on = selected.has(r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected((s) => { const n = new Set(s); on ? n.delete(r.id) : n.add(r.id); return n; })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${on ? "bg-brand-600 text-white" : "border border-app text-soft hover:bg-app"}`}
                >
                  {r.name}
                </button>
              );
            })}
          </div>
          <div className="mt-2">
            <Button size="sm" variant="outline" disabled={busy === "roles"} onClick={() => run("roles", { roleIds: [...selected] })}>
              {busy === "roles" ? "Saving…" : "Save roles"}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-t border-app pt-4">
        {perms.disable && (
          status === "DISABLED" ? (
            <Button size="sm" variant="outline" disabled={busy === "status"} onClick={() => run("status", { status: "ACTIVE" })}>Reactivate</Button>
          ) : (
            <Button size="sm" variant="danger" disabled={busy === "status"} onClick={() => run("status", { status: "DISABLED" })}>Deactivate</Button>
          )
        )}
        {perms.reset && (
          <Button size="sm" variant="outline" disabled={busy === "reset"} onClick={() => run("reset")}>
            {busy === "reset" ? "…" : "Reset password"}
          </Button>
        )}
      </div>

      {temp && (
        <div className="rounded-lg bg-app p-3 text-sm">
          <p className="text-soft">New temporary password:</p>
          <p className="mt-1 font-mono">{temp}</p>
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </Card>
  );
}
