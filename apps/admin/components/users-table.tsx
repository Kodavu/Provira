"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge, Button, Table } from "./ui";
import { ImpersonateUser } from "./impersonate-user";

export interface UserRow {
  id: string;
  fullName: string | null;
  phone: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  kycLevel: string;
  createdAt: string;
}

const STATUS_TONE = { ACTIVE: "green", SUSPENDED: "red", PENDING: "amber" } as const;

export function UsersTable({
  users,
  canSuspend,
  canImpersonate,
}: {
  users: UserRow[];
  canSuspend: boolean;
  canImpersonate: boolean;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async (v: { id: string; status: "ACTIVE" | "SUSPENDED" }) => {
      const res = await fetch(`/api/users/${v.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: v.status }),
      });
      if (!res.ok) throw new Error(res.status === 403 ? "Not permitted" : "Action failed");
      return res.json();
    },
    onMutate: (v) => setPendingId(v.id),
    onError: (e) => setError((e as Error).message),
    onSettled: () => {
      setPendingId(null);
      router.refresh();
    },
  });

  const hasActions = canSuspend || canImpersonate;
  if (users.length === 0)
    return <Table head={["User", "Phone", "Status", "KYC", ""]}><tr><td className="px-4 py-8 text-center text-sm text-muted" colSpan={5}>No users found.</td></tr></Table>;

  return (
    <>
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
      <Table head={["User", "Phone", "Status", "KYC", hasActions ? "Actions" : ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3 font-medium">{u.fullName ?? "—"}</td>
            <td className="px-4 py-3 font-mono text-xs text-soft">{u.phone}</td>
            <td className="px-4 py-3"><Badge tone={STATUS_TONE[u.status]}>{u.status.toLowerCase()}</Badge></td>
            <td className="px-4 py-3 text-soft">{u.kycLevel.replace("_", " ").toLowerCase()}</td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-end gap-2">
                {canImpersonate && <ImpersonateUser userId={u.id} userName={u.fullName ?? u.phone} />}
                {canSuspend ? (
                  u.status === "SUSPENDED" ? (
                    <Button size="sm" variant="outline" disabled={pendingId === u.id} onClick={() => mutation.mutate({ id: u.id, status: "ACTIVE" })}>
                      {pendingId === u.id ? "…" : "Reactivate"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="danger" disabled={pendingId === u.id} onClick={() => mutation.mutate({ id: u.id, status: "SUSPENDED" })}>
                      {pendingId === u.id ? "…" : "Suspend"}
                    </Button>
                  )
                ) : null}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
