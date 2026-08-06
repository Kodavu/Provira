"use client";

import { useMutation } from "@tanstack/react-query";
import {
  AlertCircle,
  Ban,
  CheckCircle2,
  Clock3,
  Loader2,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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

const STATUS = {
  ACTIVE: {
    tone: "green",
    icon: CheckCircle2,
    label: "Active",
  },
  PENDING: {
    tone: "amber",
    icon: Clock3,
    label: "Pending",
  },
  SUSPENDED: {
    tone: "red",
    icon: Ban,
    label: "Suspended",
  },
} as const;

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

  const hasActions = canSuspend || canImpersonate;

  const mutation = useMutation({
    mutationFn: async (v: {
      id: string;
      status: "ACTIVE" | "SUSPENDED";
    }) => {
      const res = await fetch(`/api/users/${v.id}/status`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          status: v.status,
        }),
      });

      if (!res.ok)
        throw new Error(
          res.status === 403 ? "You are not permitted to perform this action." : "Something went wrong."
        );

      return res.json();
    },

    onMutate: ({ id }) => {
      setError(null);
      setPendingId(id);
    },

    onError: (e) => {
      setError((e as Error).message);
    },

    onSettled: () => {
      setPendingId(null);
      router.refresh();
    },
  });

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(date));

  const getInitials = (name: string | null) => {
    if (!name) return "?";

    return name
      .split(" ")
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase();
  };

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed bg-muted/30 py-20">
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <UserCircle2 className="mb-5 h-14 w-14 text-muted-foreground" />

          <h3 className="text-lg font-semibold">
            No users found
          </h3>

          <p className="mt-2 text-sm text-muted-foreground">
            There are currently no users matching this filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border bg-background shadow-sm">

        <Table
          head={[
            "User",
            "Phone",
            "Status",
            "KYC",
            "Joined",
            hasActions ? "Actions" : "",
          ]}
        >
          {users.map((user) => {
            const status = STATUS[user.status];
            const StatusIcon = status.icon;

            return (
              <tr
                key={user.id}
                className="group border-b transition-colors hover:bg-muted/40"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {getInitials(user.fullName)}
                    </div>

                    <div>
                      <p className="font-medium">
                        {user.fullName ?? "Unnamed User"}
                      </p>

                      <p className="text-xs text-muted-foreground">
                        ID: {user.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4 font-mono text-xs text-muted-foreground">
                  {user.phone}
                </td>

                <td className="px-4 py-4">
                  <Badge tone={status.tone}>
                    <span className="flex items-center gap-1">
                      <StatusIcon className="h-3.5 w-3.5" />
                      {status.label}
                    </span>
                  </Badge>
                </td>

                <td className="px-4 py-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    {user.kycLevel.replaceAll("_", " ")}
                  </div>
                </td>

                <td
                  className="px-4 py-4 text-sm text-muted-foreground"
                  title={new Date(user.createdAt).toLocaleString()}
                >
                  {formatDate(user.createdAt)}
                </td>

                <td className="px-4 py-4">
                  <div className="flex justify-end gap-2">

                    {canImpersonate && (
                      <ImpersonateUser
                        userId={user.id}
                        userName={user.fullName ?? user.phone}
                      />
                    )}

                    {canSuspend &&
                      (user.status === "SUSPENDED" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={pendingId === user.id}
                          onClick={() =>
                            mutation.mutate({
                              id: user.id,
                              status: "ACTIVE",
                            })
                          }
                        >
                          {pendingId === user.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Restoring...
                            </>
                          ) : (
                            "Reactivate"
                          )}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={pendingId === user.id}
                          onClick={() =>
                            mutation.mutate({
                              id: user.id,
                              status: "SUSPENDED",
                            })
                          }
                        >
                          {pendingId === user.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Suspending...
                            </>
                          ) : (
                            <>
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend
                            </>
                          )}
                        </Button>
                      ))}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      </div>
    </div>
  );
}