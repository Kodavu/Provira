"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Banknote, Building2, Calendar, Check, Clock, MapPin, Users } from "lucide-react";
import { api, formatNaira, type PublicJobDetail } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Button, Card, Pill } from "@/components/ui";
import { PageError, PageSkeleton } from "@/components/page";
import { CountUp, FadeIn } from "@/components/motion";

function shiftRange(startAt: string | null, endAt: string | null): string | null {
  if (!startAt) return null;
  const s = new Date(startAt);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" };
  if (!endAt) return s.toLocaleString("en-NG", opts);
  const e = new Date(endAt);
  const sameDay = s.toDateString() === e.toDateString();
  return `${s.toLocaleString("en-NG", opts)} – ${e.toLocaleString("en-NG", sameDay ? { hour: "2-digit", minute: "2-digit" } : opts)}`;
}

const STATUS_LABEL: Record<string, string> = {
  APPLIED: "Applied — awaiting the employer",
  INVITED: "You've been invited",
  ACCEPTED: "You're hired for this job",
  CONFIRMED: "Attendance confirmed",
};

export default function WorkerJobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const { userId } = useSession();
  const [job, setJob] = useState<PublicJobDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setJob(await api.publicJobDetail(jobId, userId));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [jobId, userId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <PageError message={error} onRetry={load} />;
  if (!job) return <PageSkeleton />;

  async function apply() {
    setApplying(true);
    try {
      const res = await api.applyToJob(jobId, userId);
      setCode(res.code ?? null);
      toast.success("Application sent", { description: res.code ? `Your confirmation code is ${res.code}.` : "The employer will review it." });
      await load();
    } catch (e) {
      toast.error("Couldn't apply", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setApplying(false);
    }
  }

  const canApply = !job.myStatus && !job.filled && ["OPEN", "FILLED", "IN_PROGRESS"].includes(job.status);
  const meta = [
    (job.area || job.state || job.location) && { icon: MapPin, text: [job.area, job.state].filter(Boolean).join(", ") || job.location },
    shiftRange(job.startAt, job.endAt) && { icon: Calendar, text: shiftRange(job.startAt, job.endAt) as string },
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      <Link href="/jobs" className="inline-flex items-center gap-1 text-sm font-medium text-ink-soft transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>

      <FadeIn>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{job.title}</h1>
              {job.filled && <Pill tone="green">Full</Pill>}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
              {meta.map((m, i) => (
                <span key={i} className="inline-flex items-center gap-1"><m.icon className="h-4 w-4" /> {m.text}</span>
              ))}
              {job.employerName && (
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {job.employerUserId ? (
                    <Link href={`/e/${job.employerUserId}`} className="font-medium text-ink-soft hover:text-brand-700 hover:underline">
                      {job.employerName}
                    </Link>
                  ) : (
                    job.employerName
                  )}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-bold text-ink">{formatNaira(job.perPerson)}</p>
            <p className="text-xs text-ink-muted">per person</p>
          </div>
        </div>
      </FadeIn>

      {job.myStatus && (
        <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700 ring-1 ring-brand-100">
          <Check className="h-4 w-4" /> {STATUS_LABEL[job.myStatus] ?? job.myStatus}
        </div>
      )}

      {code && (
        <Card className="border-brand-200 bg-brand-50/70 p-5">
          <p className="eyebrow text-brand-700">Your confirmation code</p>
          <p className="mt-1 font-display text-3xl font-bold tracking-[0.3em] text-brand-800">{code}</p>
          <p className="mt-1 text-sm text-ink-soft">The employer confirms this on site to release your pay. You&apos;ll also find it under <Link href="/jobs" className="font-medium text-brand-700">Your jobs</Link>.</p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center">
          <Users className="mx-auto h-4 w-4 text-brand-600" />
          <p className="mt-2 font-display text-xl font-bold text-ink"><CountUp value={job.accepted} />/{job.headcount}</p>
          <p className="text-[11px] text-ink-muted">Filled</p>
        </Card>
        <Card className="p-4 text-center">
          <Banknote className="mx-auto h-4 w-4 text-brand-600" />
          <p className="mt-2 font-display text-xl font-bold text-ink">{formatNaira(job.perPerson)}</p>
          <p className="text-[11px] text-ink-muted">Your pay</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="mx-auto h-4 w-4 text-brand-600" />
          <p className="mt-2 font-display text-xl font-bold text-ink">{job.status[0] + job.status.slice(1).toLowerCase().replace("_", " ")}</p>
          <p className="text-[11px] text-ink-muted">Status</p>
        </Card>
      </div>

      {job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.map((sk) => <Pill key={sk}>{sk}</Pill>)}
        </div>
      )}

      {job.description && (
        <Card className="p-5">
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{job.description}</p>
        </Card>
      )}

      {canApply && (
        <div className="sticky bottom-4 z-10">
          <Card className="flex items-center justify-between gap-4 p-4 shadow-lg">
            <div>
              <p className="font-semibold text-ink">Interested?</p>
              <p className="text-sm text-ink-muted">Apply to get your confirmation code.</p>
            </div>
            <Button onClick={apply} loading={applying}>Apply now</Button>
          </Card>
        </div>
      )}
    </div>
  );
}
