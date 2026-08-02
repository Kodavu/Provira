"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  Check,
  Clock,
  MapPin,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { api, type JobDetail, type JobSuggestion } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Button, Card, Kpi, Pill, TierBadge, formatNaira } from "@/components/ui";
import { PageError, PageSkeleton, EmptyPanel } from "@/components/page";
import { CountUp, FadeIn, Stagger, StaggerItem } from "@/components/motion";

function shiftRange(startAt: string | null, endAt: string | null): string | null {
  if (!startAt) return null;
  const s = new Date(startAt);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  if (!endAt) return s.toLocaleString("en-NG", opts);
  const e = new Date(endAt);
  const sameDay = s.toDateString() === e.toDateString();
  return `${s.toLocaleString("en-NG", opts)} – ${e.toLocaleString("en-NG", sameDay ? { hour: "2-digit", minute: "2-digit" } : opts)}`;
}

export default function JobDetailPage() {
  const { activeRole } = useSession();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const jobId = params.id;

  const [job, setJob] = useState<JobDetail | null>(null);
  const [suggestions, setSuggestions] = useState<JobSuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [detail, sugg] = await Promise.all([
        api.jobDetail(jobId),
        api.jobSuggestions(jobId).catch(() => [] as JobSuggestion[]),
      ]);
      setJob(detail);
      setSuggestions(sugg);
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [jobId]);

  useEffect(() => {
    if (activeRole !== "EMPLOYER") {
      router.replace("/overview");
      return;
    }
    load();
  }, [activeRole, router, load]);

  if (activeRole !== "EMPLOYER") return null;
  if (error) return <PageError message={error} onRetry={load} />;
  if (!job) return <PageSkeleton />;

  const full = job.accepted >= job.headcount;

  async function fund() {
    setBusy("fund");
    try {
      await api.fundJob(jobId);
      toast.success("Escrow funded", { description: `${formatNaira(job!.payAmount)} secured for this job.` });
      await load();
    } catch (e) {
      toast.error("Funding failed", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  async function invite(s: JobSuggestion) {
    setBusy(`invite:${s.workerId}`);
    try {
      await api.inviteWorker(jobId, s.workerId);
      toast.success("Invite sent", { description: `${s.workerName ?? "Worker"} was notified.` });
      await load();
    } catch (e) {
      toast.error("Couldn't invite", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  async function accept(assignmentId: string, name: string | null) {
    setBusy(`accept:${assignmentId}`);
    try {
      await api.acceptApplication(jobId, assignmentId);
      toast.success("Application accepted", { description: `${name ?? "Worker"} is now in the job.` });
      await load();
    } catch (e) {
      toast.error("Couldn't accept", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <FadeIn>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{job.title}</h1>
              {full && <Pill tone="green">Full</Pill>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {job.location ?? "Lagos"}</span>
              {shiftRange(job.startAt, job.endAt) && (
                <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {shiftRange(job.startAt, job.endAt)}</span>
              )}
              {job.skills.length > 0 && <span>{job.skills.join(", ")}</span>}
            </div>
          </div>
          {job.escrow && !job.escrow.funded && (
            <Button onClick={fund} disabled={busy === "fund"}>
              <Banknote className="h-4 w-4" /> {busy === "fund" ? "Funding…" : `Fund escrow · ${formatNaira(job.payAmount)}`}
            </Button>
          )}
        </div>
      </FadeIn>

      {job.description && (
        <Card className="p-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{job.description}</p>
        </Card>
      )}

      <Stagger className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StaggerItem><Kpi icon={<Users className="h-4 w-4" />} label="Filled" value={<><CountUp value={job.accepted} />/{job.headcount}</>} caption="Workers in the job." /></StaggerItem>
        <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label="Per person" value={formatNaira(job.perPerson)} caption="Released on confirm." accent="amber" /></StaggerItem>
        <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label="Escrow total" value={formatNaira(job.payAmount)} caption={job.escrow?.funded ? "Funded." : "Not funded yet."} accent="neutral" /></StaggerItem>
        <StaggerItem><Kpi icon={<UserPlus className="h-4 w-4" />} label="Applications" value={<CountUp value={job.applications.length} />} caption="Awaiting your review." /></StaggerItem>
      </Stagger>

      {full && (
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
          This job is full — no more applications or invites can be accepted.
        </div>
      )}

      {/* In the job */}
      <Section title="In the job" count={job.inJob.length} hint="Workers hired for this shift. Share the attendance code on site.">
        {job.inJob.length === 0 ? (
          <EmptyPanel icon={Users} title="No one in the job yet" body="Invite suggested workers or accept applications below." />
        ) : (
          <Card className="divide-y divide-line p-0">
            {job.inJob.map((a) => (
              <div key={a.assignmentId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={a.workerName} />
                  <div>
                    <p className="font-medium text-ink">{a.workerName ?? "Worker"}</p>
                    <p className="text-xs text-ink-muted">
                      {a.attendance?.status === "CONFIRMED" ? "Attendance confirmed" : "Confirmed for the shift"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {a.attendance?.status === "CONFIRMED" ? (
                    <Pill tone="green"><Check className="h-3.5 w-3.5" /> Confirmed & paid</Pill>
                  ) : a.attendance?.code ? (
                    <div className="text-right">
                      <p className="eyebrow">Attendance code</p>
                      <p className="font-display text-xl font-bold tracking-[0.3em] text-brand-800">{a.attendance.code}</p>
                    </div>
                  ) : (
                    <Pill tone="amber">Code pending</Pill>
                  )}
                </div>
              </div>
            ))}
          </Card>
        )}
      </Section>

      {/* Applications */}
      <Section title="Applications" count={job.applications.length} hint="Workers who applied — accept to add them to the job.">
        {job.applications.length === 0 ? (
          <EmptyPanel icon={UserPlus} title="No applications yet" />
        ) : (
          <Card className="divide-y divide-line p-0">
            {job.applications.map((a) => (
              <div key={a.assignmentId} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={a.workerName} />
                  <p className="font-medium text-ink">{a.workerName ?? "Worker"}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => accept(a.assignmentId, a.workerName)}
                  disabled={full || busy === `accept:${a.assignmentId}`}
                >
                  {busy === `accept:${a.assignmentId}` ? "Accepting…" : full ? "Job full" : "Accept"}
                </Button>
              </div>
            ))}
          </Card>
        )}
      </Section>

      {/* Pending invites */}
      {job.invites.length > 0 && (
        <Section title="Invited — awaiting response" count={job.invites.length}>
          <Card className="divide-y divide-line p-0">
            {job.invites.map((a) => (
              <div key={a.assignmentId} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={a.workerName} />
                  <p className="font-medium text-ink">{a.workerName ?? "Worker"}</p>
                </div>
                <Pill tone="amber"><Clock className="h-3.5 w-3.5" /> Invited</Pill>
              </div>
            ))}
          </Card>
        </Section>
      )}

      {/* Suggested workers */}
      <Section title="Suggested workers" count={suggestions.length} hint="Ranked by skills, location, and reliability. Invite the ones you want.">
        {suggestions.length === 0 ? (
          <EmptyPanel icon={Sparkles} title="No suggestions right now" body="Everyone qualified has already been invited or added." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {suggestions.map((s) => (
              <Card key={s.workerId} className="flex items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar name={s.workerName} />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{s.workerName ?? "Worker"}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <TierBadge tier={s.tier} />
                      <span className="text-xs text-ink-muted">{Math.round(s.matchScore * 100)}% match</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => invite(s)} disabled={full || busy === `invite:${s.workerId}`}>
                  {busy === `invite:${s.workerId}` ? "Inviting…" : full ? "Full" : "Invite"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  hint,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3">
        <h2 className="font-display text-lg font-semibold text-ink">
          {title} {count > 0 && <span className="text-ink-muted">({count})</span>}
        </h2>
        {hint && <p className="text-sm text-ink-soft">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Avatar({ name }: { name: string | null }) {
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
      {initials}
    </span>
  );
}
