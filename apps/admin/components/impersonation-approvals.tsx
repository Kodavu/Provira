"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  UserCircle2,
} from "lucide-react";

import { Badge, Button, Card, EmptyState } from "./ui";

interface Pending {
  id: string;
  mode: "READ" | "WRITE";
  reason: string;
  createdAt: string;
  requestedBy: {
    fullName: string;
  } | null;
  targetUser: {
    fullName: string | null;
    phone: string;
  } | null;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function relativeTime(date: string) {
  const diff = Date.now() - new Date(date).getTime();

  const mins = Math.floor(diff / 60000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;

  const hrs = Math.floor(mins / 60);

  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;

  const days = Math.floor(hrs / 24);

  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function initials(name?: string | null) {
  if (!name) return "?";

  return name
    .split(" ")
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

export function ImpersonationApprovals({
  pending,
}: {
  pending: Pending[];
}) {
  const router = useRouter();

  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(id: string) {
    setBusy(id);
    setError(null);

    try {
      const res = await fetch(`/api/impersonation/${id}/approve`, {
        method: "POST",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok)
        throw new Error(data.message || "Unable to approve request.");

      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  if (pending.length === 0) {
    return (
      <EmptyState>
        <div className="flex flex-col items-center py-6 text-center">
          <ShieldCheck className="mb-4 h-12 w-12 text-emerald-500" />

          <h3 className="text-lg font-semibold">
            No pending approvals
          </h3>

          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            There are currently no impersonation requests awaiting review.
          </p>
        </div>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-4">

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {pending.map((request) => (
        <Card
          key={request.id}
          className="group rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
        >
          <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex-1 space-y-5">

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="red">
                  <ShieldAlert className="mr-1 h-3.5 w-3.5" />
                  Impersonation Request
                </Badge>

                <Badge tone={request.mode === "WRITE" ? "amber" : "green"}>
                  {request.mode}
                </Badge>
              </div>

              <div className="flex flex-wrap items-center gap-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
                    {initials(request.requestedBy?.fullName)}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Requested By
                    </p>

                    <p className="font-medium">
                      {request.requestedBy?.fullName ?? "Unknown Admin"}
                    </p>
                  </div>
                </div>

                <ArrowRight className="hidden h-5 w-5 text-muted-foreground lg:block" />

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 font-semibold text-orange-700">
                    {initials(request.targetUser?.fullName)}
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Target User
                    </p>

                    <p className="font-medium">
                      {request.targetUser?.fullName ?? "Unnamed User"}
                    </p>

                    <p className="font-mono text-xs text-muted-foreground">
                      {request.targetUser?.phone}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-muted/50 p-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Reason
                </p>

                <p className="text-sm leading-relaxed">
                  {request.reason}
                </p>
              </div>

              <div
                className="text-xs text-muted-foreground"
                title={formatDate(request.createdAt)}
              >
                Requested {relativeTime(request.createdAt)} •{" "}
                {formatDate(request.createdAt)}
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <Button
                size="sm"
                disabled={busy === request.id}
                onClick={() => approve(request.id)}
                className="min-w-[150px]"
              >
                {busy === request.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Approve Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}