import Link from "next/link";
import { adminFetch, Me } from "@/lib/admin-api";
import { Badge, Card, EmptyState } from "@/components/ui";
import { DisputeActions } from "@/components/dispute-actions";
import { ReplyForm, EvidenceForm } from "@/components/dispute-comms";
import { humanizeDisputeEvent } from "@/lib/labels";

interface Detail {
  id: string;
  code: string;
  title: string;
  subjectType: string | null;
  subjectId: string | null;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status: string;
  assignedAdminId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter: { fullName: string | null; phone: string } | null;
  defendant: { fullName: string | null; phone: string } | null;
  assignedAdmin: { id: string; fullName: string } | null;
  events: Array<{ id: string; type: string; note: string | null; fromStatus: string | null; toStatus: string | null; createdAt: string; adminUser: { fullName: string } | null }>;
  messages: Array<{ id: string; body: string; authorType: string; isInternal: boolean; createdAt: string; adminUser: { fullName: string } | null }>;
  evidence: Array<{ id: string; label: string; url: string }>;
}

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "amber", HIGH: "red", URGENT: "red" } as const;
const STATUS_TONE: Record<string, "neutral" | "amber" | "green" | "red" | "indigo"> = {
  OPEN: "amber", UNDER_REVIEW: "indigo", WAITING_FOR_USER: "neutral", ESCALATED: "red", RESOLVED: "green", CLOSED: "neutral",
};
const pretty = (s: string) => s.replace(/_/g, " ").toLowerCase();
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export default async function DisputeDetailPage({ params }: { params: { id: string } }) {
  const [d, me, staff] = await Promise.all([
    adminFetch<Detail>(`/admin/disputes/${params.id}`),
    adminFetch<Me>("/admin/me"),
    adminFetch<Array<{ id: string; fullName: string; department: string | null }>>("/admin/disputes/assignees"),
  ]);
  if (!d || !me) return <EmptyState>Couldn&apos;t load this case.</EmptyState>;
  const p = new Set(me.permissions);
  const canRespond = p.has("disputes:respond");
  const conversation = d.messages.filter((m) => !m.isInternal);
  const internalNotes = d.messages.filter((m) => m.isInternal);

  return (
    <>
      <Link href="/disputes" className="text-sm text-soft hover:text-[color:var(--text)]">&larr; All disputes</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold text-muted">{d.code}</span>
            <Badge tone={STATUS_TONE[d.status] ?? "neutral"}>{pretty(d.status)}</Badge>
            <Badge tone={PRIORITY_TONE[d.priority]}>{d.priority.toLowerCase()} priority</Badge>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{d.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          {/* Parties */}
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <Party label="Reporter" name={d.reporter?.fullName} sub={d.reporter?.phone} />
            <Party label="Defendant" name={d.defendant?.fullName} sub={d.defendant?.phone} />
            <Party label="Subject" name={d.subjectType ? `${d.subjectType}${d.subjectId ? ` · ${d.subjectId.slice(0, 8)}` : ""}` : "—"} />
            <Party label="Assigned to" name={d.assignedAdmin?.fullName ?? "Unassigned"} />
          </Card>

          {/* Timeline */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Timeline</h2>
            <Card className="p-5">
              <ol className="space-y-4">
                {d.events.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                    <div className="min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{humanizeDisputeEvent(e.type)}</span>
                        {e.fromStatus && e.toStatus && (
                          <span className="text-soft"> · {pretty(e.fromStatus)} → {pretty(e.toStatus)}</span>
                        )}
                      </p>
                      {e.note && <p className="text-sm text-soft">{e.note}</p>}
                      <p className="mt-0.5 text-xs text-muted">{e.adminUser?.fullName ?? "System"} · {when(e.createdAt)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          {/* Conversation with the user (visible to the reporter/defendant) */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Conversation</h2>
            {conversation.length === 0 ? (
              <EmptyState>No messages with the user yet.</EmptyState>
            ) : (
              <div className="space-y-3">
                {conversation.map((m) => {
                  const fromAdmin = m.authorType === "ADMIN";
                  return (
                    <Card key={m.id} className={`p-4 ${fromAdmin ? "border-l-2 border-l-brand-500" : ""}`}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {fromAdmin ? m.adminUser?.fullName ?? "Support" : "User"}
                          <Badge tone={fromAdmin ? "indigo" : "neutral"} className="ml-2">{fromAdmin ? "Support" : "User"}</Badge>
                        </span>
                        <span className="text-xs text-muted">{when(m.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-sm text-soft">{m.body}</p>
                    </Card>
                  );
                })}
              </div>
            )}
            {canRespond && <ReplyForm id={d.id} />}
          </div>

          {/* Internal notes (staff-only) */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Internal notes</h2>
            {internalNotes.length === 0 ? (
              <EmptyState>No internal notes yet.</EmptyState>
            ) : (
              <div className="space-y-3">
                {internalNotes.map((m) => (
                  <Card key={m.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{m.adminUser?.fullName ?? "Admin"}</span>
                      <span className="text-xs text-muted">{when(m.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-sm text-soft">{m.body}</p>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Evidence */}
          <div>
            <h2 className="mb-3 text-lg font-semibold">Evidence</h2>
            {d.evidence.length === 0 ? (
              <EmptyState>No files attached.</EmptyState>
            ) : (
              <Card className="divide-y divide-[color:var(--border)]">
                {d.evidence.map((ev) => (
                  <a key={ev.id} href={ev.url} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-app">
                    <span>{ev.label}</span>
                    <span className="text-xs text-brand-500">Open</span>
                  </a>
                ))}
              </Card>
            )}
            {canRespond && <EvidenceForm id={d.id} />}
          </div>
        </div>

        {/* Action rail */}
        <div>
          <DisputeActions
            id={d.id}
            status={d.status}
            assignedAdminId={d.assignedAdminId}
            jobDispute={d.subjectType === "job" && !!d.subjectId}
            staff={staff ?? []}
            perms={{
              assign: p.has("disputes:assign"),
              escalate: p.has("disputes:escalate"),
              resolve: p.has("disputes:resolve"),
              close: p.has("disputes:close"),
              note: p.has("disputes:view"),
            }}
          />
          {d.resolvedAt && (
            <p className="mt-3 text-center text-xs text-muted">Resolved {when(d.resolvedAt)}</p>
          )}
        </div>
      </div>
    </>
  );
}

function Party({ label, name, sub }: { label: string; name?: string | null; sub?: string | null }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-medium">{name ?? "—"}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
