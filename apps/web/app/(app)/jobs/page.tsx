"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  Clock,
  MapPin,
  PlusCircle,
  Search,
  Users,
} from "lucide-react";
import { api, type EmployerDashboard, type JobSearchItem, type WorkerDashboard } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Button, Card, Input, Pill, SectionHeader, formatNaira } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton, EmptyPanel } from "@/components/page";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { JobsBoard } from "@/components/employer";

export default function JobsPage() {
  const { activeRole } = useSession();
  if (activeRole === "EMPLOYER") return <EmployerJobs />;
  if (activeRole === "WORKER") return <WorkerJobs />;
  return <RedirectHome />;
}

function RedirectHome() {
  const router = useRouter();
  router.replace("/overview");
  return null;
}

function shiftLabel(startAt?: string | null, endAt?: string | null): string | null {
  if (!startAt) return null;
  const s = new Date(startAt);
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  if (!endAt) return s.toLocaleString("en-NG", o);
  return `${s.toLocaleString("en-NG", o)} – ${new Date(endAt).toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}`;
}

// ---------------- Worker ----------------

function WorkerJobs() {
  const { userId } = useSession();
  const { data, error, reload } = usePageData<WorkerDashboard>((id) => api.workerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const invitations = data.assignments.filter((a) => a.status === "INVITED");
  const applications = data.assignments.filter((a) => a.status === "APPLIED");
  const shifts = data.assignments.filter((a) => a.status === "ACCEPTED" || a.status === "CONFIRMED");

  return (
    <div className="space-y-8">
      <PageHeader title="Jobs" subtitle="Search and apply for shifts, respond to invitations, and confirm attendance to get paid." />

      {invitations.length > 0 && (
        <section>
          <SectionHeader title="Invitations" subtitle="Employers invited you to these shifts. Accept to join." />
          <Stagger className="space-y-2.5">
            {invitations.map((a) => (
              <StaggerItem key={a.id}>
                <InvitationCard assignment={a} userId={userId} onChange={reload} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      <section>
        <SectionHeader title="Your shifts" subtitle="Jobs you're in. Show your attendance code on site and confirm to get paid." />
        {shifts.length === 0 ? (
          <EmptyPanel icon={Users} title="No shifts yet" body="Apply to a job or accept an invitation to get started." />
        ) : (
          <Stagger className="space-y-2.5">
            {shifts.map((a) => (
              <StaggerItem key={a.id}>
                <ShiftCard assignment={a} onConfirmed={reload} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>

      {applications.length > 0 && (
        <section>
          <SectionHeader title="Pending applications" subtitle="Waiting for the employer to accept." />
          <Card className="divide-y divide-line p-0">
            {applications.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-ink">{a.job.title}</p>
                  <p className="text-sm text-ink-muted">{formatNaira(a.job.payAmount)}{a.job.location ? ` · ${a.job.location}` : ""}</p>
                </div>
                <Pill tone="amber"><Clock className="h-3.5 w-3.5" /> Applied</Pill>
              </div>
            ))}
          </Card>
        </section>
      )}

      <JobSearch
        userId={userId}
        onApplied={reload}
        syncKey={data.assignments.map((a) => `${a.id}:${a.status}`).join(",")}
      />
    </div>
  );
}

function InvitationCard({
  assignment: a,
  userId,
  onChange,
}: {
  assignment: WorkerDashboard["assignments"][number];
  userId: string;
  onChange: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function accept() {
    setBusy("accept");
    try {
      await api.acceptInvite(a.id, userId);
      toast.success("Invitation accepted", { description: `You're in "${a.job.title}". Your attendance code is ready.` });
      onChange();
    } catch (e) {
      toast.error("Couldn't accept", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }
  async function decline() {
    setBusy("decline");
    try {
      await api.declineInvite(a.id, userId);
      toast("Invitation declined");
      onChange();
    } catch (e) {
      toast.error("Couldn't decline", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-brand-200 bg-brand-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-brand-700">Invitation{a.job.employerName ? ` · ${a.job.employerName}` : ""}</p>
          <p className="mt-1 font-semibold text-ink">{a.job.title}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {formatNaira(a.job.payAmount)}
            {a.job.location ? ` · ${a.job.location}` : ""}
            {shiftLabel(a.job.startAt, a.job.endAt) ? ` · ${shiftLabel(a.job.startAt, a.job.endAt)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={accept} disabled={!!busy}>{busy === "accept" ? "Accepting…" : "Accept"}</Button>
          <Button size="sm" variant="outline" onClick={decline} disabled={!!busy}>{busy === "decline" ? "…" : "Decline"}</Button>
        </div>
      </div>
    </Card>
  );
}

function ShiftCard({
  assignment: a,
  onConfirmed,
}: {
  assignment: WorkerDashboard["assignments"][number];
  onConfirmed: () => void;
}) {
  const confirmed = a.attendance?.status === "CONFIRMED" || a.status === "CONFIRMED";
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-ink">{a.job.title}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {formatNaira(a.job.payAmount)}
            {a.job.location ? ` · ${a.job.location}` : ""}
            {shiftLabel(a.job.startAt, a.job.endAt) ? ` · ${shiftLabel(a.job.startAt, a.job.endAt)}` : ""}
          </p>
        </div>
        {confirmed && <Pill tone="green"><Check className="h-3.5 w-3.5" /> Confirmed & paid</Pill>}
      </div>

      {!confirmed && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
          {a.attendance?.code && (
            <div>
              <p className="eyebrow">Your attendance code</p>
              <p className="font-display text-2xl font-bold tracking-[0.3em] text-brand-800">{a.attendance.code}</p>
              <p className="mt-0.5 text-xs text-ink-muted">Show this to the employer on site.</p>
            </div>
          )}
          <ConfirmCode assignmentId={a.id} onConfirmed={onConfirmed} />
        </div>
      )}
    </Card>
  );
}

function ConfirmCode({ assignmentId, onConfirmed }: { assignmentId: string; onConfirmed: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.confirmAttendance(assignmentId, code);
      toast.success("Attendance confirmed", { description: "Your payout is on the way." });
      onConfirmed();
    } catch (e) {
      const wrong = (e as Error).message.includes("Invalid");
      toast.error(wrong ? "That code isn't right" : "Couldn't confirm", {
        description: wrong ? "Check the code and try again." : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-28">
        <Input value={code} onChange={setCode} placeholder="4-digit code" inputMode="numeric" maxLength={4} />
      </div>
      <Button onClick={submit} disabled={busy || code.length !== 4}>{busy ? "…" : "Confirm"}</Button>
    </div>
  );
}

function JobSearch({
  userId,
  onApplied,
  syncKey,
}: {
  userId: string;
  onApplied: () => void;
  syncKey: string;
}) {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<JobSearchItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(async (q: string) => {
    try {
      const res = await api.searchJobs(userId, q || undefined);
      setItems(res.items);
    } catch {
      setItems([]);
    }
  }, [userId]);

  // Debounced search as the worker types; also re-runs when their assignment
  // statuses change (e.g. after accepting an invite), so cards stay accurate.
  useEffect(() => {
    const t = setTimeout(() => run(query), 300);
    return () => clearTimeout(t);
  }, [query, run, syncKey]);

  async function apply(job: JobSearchItem) {
    setBusy(job.id);
    try {
      await api.applyToJob(job.id, userId);
      toast.success("Applied!", { description: `The employer will review your application for "${job.title}".` });
      await run(query);
      onApplied();
    } catch (e) {
      toast.error("Couldn't apply", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <SectionHeader title="Find work" subtitle="Search open jobs near you and apply in one tap." />
      <FadeIn>
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, skill, or place…"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
      </FadeIn>

      {items === null ? (
        <div className="h-24 animate-pulse rounded-2xl bg-line/40" />
      ) : items.length === 0 ? (
        <EmptyPanel icon={Search} title="No jobs found" body="Try a different search, or check back soon." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((j) => (
            <Card key={j.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{j.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" /> {j.location ?? "Nearby"}
                    {j.employerName ? ` · ${j.employerName}` : ""}
                  </p>
                </div>
                <span className="whitespace-nowrap font-display text-lg font-semibold text-ink">{formatNaira(j.perPerson)}</span>
              </div>

              {j.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{j.description}</p>}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {j.accepted}/{j.headcount} filled</span>
                {shiftLabel(j.startAt, j.endAt) && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {shiftLabel(j.startAt, j.endAt)}</span>}
              </div>

              <div className="mt-3">
                {j.myStatus === "APPLIED" ? (
                  <Pill tone="amber">Applied</Pill>
                ) : j.myStatus === "ACCEPTED" || j.myStatus === "CONFIRMED" ? (
                  <Pill tone="green">You're in this job</Pill>
                ) : j.myStatus === "INVITED" ? (
                  <Pill tone="amber">Invited — respond above</Pill>
                ) : j.filled ? (
                  <Pill>Full</Pill>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => apply(j)} disabled={busy === j.id}>
                    {busy === j.id ? "Applying…" : "Apply"}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

// ---------------- Employer ----------------

function EmployerJobs() {
  const { data, error, reload } = usePageData<EmployerDashboard>((id) => api.employerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your jobs"
        subtitle="Fund escrow, invite suggested workers, and accept applications. Tap a job to manage it."
        action={
          <Link href="/jobs/new">
            <Button><PlusCircle className="h-4 w-4" /> Post a job</Button>
          </Link>
        }
      />
      <FadeIn delay={0.05}>
        <JobsBoard jobs={data.jobs} />
      </FadeIn>
    </div>
  );
}
