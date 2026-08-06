"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Button, Card } from "./ui";
import { humanizeAction, titleize } from "@/lib/labels";

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string | null;
  ip: string | null;
  previousValue: unknown;
  newValue: unknown;
  createdAt: string;
  adminUser: { fullName: string; email: string } | null;
}

function formatValue(value: unknown) {
  if (value == null) return "—";
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AuditDetailsButton({ entry }: { entry: AuditEntry }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        Details
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
          <button
            type="button"
            aria-label="Close audit details"
            className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <Card className="relative z-10 w-full max-w-3xl overflow-hidden p-0">
            <div className="flex items-start justify-between gap-4 border-b border-app px-5 py-4">
              <div>
                <p className="eyebrow mb-1">Audit entry</p>
                <h3 className="text-lg font-semibold">{humanizeAction(entry.action)}</h3>
                <p className="mt-1 text-sm text-muted">
                  {titleize(entry.resource)}{entry.resourceId ? ` · ${entry.resourceId}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-app p-2 text-soft transition hover:bg-app"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-app bg-app/60 p-3">
                    <p className="eyebrow">Actor</p>
                    <p className="mt-1 font-medium">{entry.adminUser?.fullName ?? "System"}</p>
                    <p className="text-sm text-muted">{entry.adminUser?.email ?? "Automated system"}</p>
                  </div>
                  <div className="rounded-2xl border border-app bg-app/60 p-3">
                    <p className="eyebrow">Timestamp</p>
                    <p className="mt-1 font-medium">{formatTime(entry.createdAt)}</p>
                    <p className="text-sm text-muted">{entry.ip ?? "No IP recorded"}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-app p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="eyebrow">Before</p>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted dark:bg-white/10">
                      Previous
                    </span>
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950/95 p-3 text-[12px] text-slate-100">
                    {formatValue(entry.previousValue)}
                  </pre>
                </div>

                <div className="rounded-2xl border border-app p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="eyebrow">After</p>
                    <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand-600 dark:text-brand-300">
                      New
                    </span>
                  </div>
                  <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-slate-950/95 p-3 text-[12px] text-slate-100">
                    {formatValue(entry.newValue)}
                  </pre>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-app bg-slate-50/80 p-4 dark:bg-white/[0.03]">
                <p className="eyebrow">Context</p>
                <div className="space-y-2 text-sm text-soft">
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-app bg-white/70 px-3 py-2 dark:bg-white/[0.03]">
                    <span>Action</span>
                    <span className="font-medium text-[color:var(--text)]">{humanizeAction(entry.action)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-app bg-white/70 px-3 py-2 dark:bg-white/[0.03]">
                    <span>Resource</span>
                    <span className="font-medium text-[color:var(--text)]">{titleize(entry.resource)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-app bg-white/70 px-3 py-2 dark:bg-white/[0.03]">
                    <span>Resource ID</span>
                    <span className="font-medium text-[color:var(--text)]">{entry.resourceId ?? "—"}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-app bg-white/70 px-3 py-2 dark:bg-white/[0.03]">
                    <span>IP</span>
                    <span className="font-medium text-[color:var(--text)]">{entry.ip ?? "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </>
  );
}
