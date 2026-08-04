"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("Jobs");
  const { data, error, reload } = usePageData<WorkerDashboard>((id) => api.workerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const invitations = data.assignments.filter((a) => a.status === "INVITED");
  const applications = data.assignments.filter((a) => a.status === "APPLIED");
  const shifts = data.assignments.filter((a) => a.status === "ACCEPTED" || a.status === "CONFIRMED");

  return (
    <div className="space-y-8">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      {invitations.length > 0 && (
        <section>
          <SectionHeader title={t("invitations")} subtitle={t("invitationsHint")} />
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
        <SectionHeader title={t("yourShifts")} subtitle={t("yourShiftsHint")} />
        {shifts.length === 0 ? (
          <EmptyPanel icon={Users} title={t("noShifts")} body={t("noShiftsBody")} />
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
          <SectionHeader title={t("pending")} subtitle={t("pendingHint")} />
          <Card className="divide-y divide-line p-0">
            {applications.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="font-medium text-ink">{a.job.title}</p>
                  <p className="text-sm text-ink-muted">{formatNaira(a.job.payAmount)}{a.job.location ? ` · ${a.job.location}` : ""}</p>
                </div>
                <Pill tone="amber"><Clock className="h-3.5 w-3.5" /> {t("applied")}</Pill>
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
  const t = useTranslations("Jobs");
  const [busy, setBusy] = useState<string | null>(null);

  async function accept() {
    setBusy("accept");
    try {
      await api.acceptInvite(a.id, userId);
      toast.success(t("accepted"), { description: t("acceptedDesc", { title: a.job.title }) });
      onChange();
    } catch (e) {
      toast.error(t("acceptFailed"), { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }
  async function decline() {
    setBusy("decline");
    try {
      await api.declineInvite(a.id, userId);
      toast(t("declined"));
      onChange();
    } catch (e) {
      toast.error(t("declineFailed"), { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="border-brand-200 bg-brand-50/40 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-brand-700">{t("invitationEyebrow")}{a.job.employerName ? ` · ${a.job.employerName}` : ""}</p>
          <p className="mt-1 font-semibold text-ink">{a.job.title}</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {formatNaira(a.job.payAmount)}
            {a.job.location ? ` · ${a.job.location}` : ""}
            {shiftLabel(a.job.startAt, a.job.endAt) ? ` · ${shiftLabel(a.job.startAt, a.job.endAt)}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={accept} disabled={!!busy}>{busy === "accept" ? t("accepting") : t("accept")}</Button>
          <Button size="sm" variant="outline" onClick={decline} disabled={!!busy}>{busy === "decline" ? "…" : t("decline")}</Button>
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
  const t = useTranslations("Jobs");
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
        {confirmed && <Pill tone="green"><Check className="h-3.5 w-3.5" /> {t("confirmedPaid")}</Pill>}
      </div>

      {!confirmed && (
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-4">
          <div>
            <p className="eyebrow">{t("confirmAttendance")}</p>
            <p className="mt-0.5 max-w-xs text-xs text-ink-muted">
              {t("confirmHint")}
            </p>
          </div>
          <ConfirmCode assignmentId={a.id} onConfirmed={onConfirmed} />
        </div>
      )}
    </Card>
  );
}

function ConfirmCode({ assignmentId, onConfirmed }: { assignmentId: string; onConfirmed: () => void }) {
  const t = useTranslations("Jobs");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    try {
      await api.confirmAttendance(assignmentId, code);
      toast.success(t("attendanceConfirmed"), { description: t("attendanceConfirmedDesc") });
      onConfirmed();
    } catch (e) {
      const wrong = (e as Error).message.includes("Invalid");
      toast.error(wrong ? t("wrongCode") : t("confirmFailed"), {
        description: wrong ? t("wrongCodeDesc") : t("confirmFailedDesc"),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-28">
        <Input value={code} onChange={setCode} placeholder={t("codePlaceholder")} inputMode="numeric" maxLength={4} />
      </div>
      <Button onClick={submit} disabled={busy || code.length !== 4}>{busy ? "…" : t("confirm")}</Button>
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
  const t = useTranslations("Jobs");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<JobSearchItem[] | null>(null);
  const [feed, setFeed] = useState<string | null>(null); // null until the saved pref loads
  const [busy, setBusy] = useState<string | null>(null);

  const run = useCallback(async (q: string, f?: string) => {
    try {
      const res = await api.searchJobs(userId, q || undefined, undefined, f);
      setItems(res.items);
      setFeed(res.feed); // reflect the feed actually applied (saved pref on first load)
    } catch {
      setItems([]);
    }
  }, [userId]);

  // Debounced search as the worker types; also re-runs when their assignment
  // statuses change (e.g. after accepting an invite), so cards stay accurate.
  useEffect(() => {
    const timer = setTimeout(() => run(query, feed ?? undefined), 300);
    return () => clearTimeout(timer);
  }, [query, run, syncKey, feed]);

  async function apply(job: JobSearchItem) {
    setBusy(job.id);
    try {
      await api.applyToJob(job.id, userId);
      toast.success(t("appliedToast"), { description: t("appliedToastDesc", { title: job.title }) });
      await run(query, feed ?? undefined);
      onApplied();
    } catch (e) {
      toast.error(t("applyFailed"), { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  const feeds = [
    { key: "ALL", label: t("feedAll") },
    { key: "SKILLS", label: t("feedSkills") },
    { key: "NEARBY", label: t("feedNearby") },
  ];

  return (
    <section>
      <SectionHeader title={t("findWork")} subtitle={t("findWorkHint")} />
      <FadeIn>
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
        <div className="mb-4 inline-flex rounded-xl border border-line bg-surface p-1">
          {feeds.map((f) => (
            <button
              key={f.key}
              onClick={() => setFeed(f.key)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                feed === f.key ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-canvas"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </FadeIn>

      {items === null ? (
        <div className="h-24 animate-pulse rounded-2xl bg-line/40" />
      ) : items.length === 0 ? (
        <EmptyPanel icon={Search} title={t("noJobsFound")} body={t("noJobsBody")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {items.map((j) => (
            <Card key={j.id} className="flex flex-col p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{j.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {[j.area, j.state].filter(Boolean).join(", ") || j.location || t("locationTbc")}
                    {j.employerName ? ` · ${j.employerName}` : ""}
                  </p>
                </div>
                <span className="whitespace-nowrap font-display text-lg font-semibold text-ink">{formatNaira(j.perPerson)}</span>
              </div>

              {(j.proximity || j.matchesSkills) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {j.proximity === "area" && <Pill tone="green">{t("nearYou")}</Pill>}
                  {j.proximity === "state" && <Pill tone="green">{t("inState", { state: j.state })}</Pill>}
                  {j.matchesSkills && <Pill tone="amber">{t("matchesSkills")}</Pill>}
                </div>
              )}

              {j.description && <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{j.description}</p>}

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {t("filled", { accepted: j.accepted, headcount: j.headcount })}</span>
                {shiftLabel(j.startAt, j.endAt) && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> {shiftLabel(j.startAt, j.endAt)}</span>}
              </div>

              <div className="mt-3">
                {j.myStatus === "APPLIED" ? (
                  <Pill tone="amber">{t("applied")}</Pill>
                ) : j.myStatus === "ACCEPTED" || j.myStatus === "CONFIRMED" ? (
                  <Pill tone="green">{t("youreInJob")}</Pill>
                ) : j.myStatus === "INVITED" ? (
                  <Pill tone="amber">{t("invitedRespond")}</Pill>
                ) : j.filled ? (
                  <Pill>{t("full")}</Pill>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => apply(j)} disabled={busy === j.id}>
                    {busy === j.id ? t("applying") : t("apply")}
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
  const t = useTranslations("Jobs");
  const { data, error, reload } = usePageData<EmployerDashboard>((id) => api.employerDashboard(id));

  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("employerTitle")}
        subtitle={t("employerSubtitle")}
        action={
          <Link href="/jobs/new">
            <Button><PlusCircle className="h-4 w-4" /> {t("postJob")}</Button>
          </Link>
        }
      />
      <FadeIn delay={0.05}>
        <JobsBoard jobs={data.jobs} />
      </FadeIn>
    </div>
  );
}
