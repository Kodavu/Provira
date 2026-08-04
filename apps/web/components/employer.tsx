"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { api, EmployerDashboard } from "@/lib/api";
import { LocationPicker, type LocationValue } from "@/components/location-picker";
import { Button, Card, Pill, ProgressBar, formatNaira } from "@/components/ui";

const CATEGORY_SLUGS = ["loading", "cleaning", "driving", "tailoring", "bricklaying"];

const fieldCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-ink-soft">{children}</span>;
}

export function PostJobCard({
  employerProfileId,
  onPosted,
}: {
  employerProfileId: string;
  onPosted: (jobId: string) => void;
}) {
  const t = useTranslations("PostJob");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [headcount, setHeadcount] = useState("1");
  const [perPerson, setPerPerson] = useState("");
  const [loc, setLoc] = useState<LocationValue>({ state: "", area: "", ward: "" });
  const [address, setAddress] = useState("");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [slug, setSlug] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = Math.max(1, Number(headcount) || 1);
  const per = Number(perPerson) || 0;
  const total = per * count;

  async function submit() {
    if (!title.trim()) return setError(t("errNoTitle"));
    if (!per) return setError(t("errNoAmount"));
    if (startAt && endAt && new Date(endAt) <= new Date(startAt))
      return setError(t("errEndBeforeStart"));
    setLoading(true);
    setError(null);
    try {
      const job = await api.createJob({
        employerId: employerProfileId,
        title: title.trim(),
        description: description.trim() || undefined,
        payAmount: String(Math.round(total * 100)), // kobo total
        headcount: count,
        skillSlugs: [slug],
        locationLabel: address.trim() || undefined,
        locationState: loc.state || undefined,
        locationArea: loc.area || undefined,
        locationWard: loc.ward || undefined,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined,
      });
      await api.publishJob(job.id); // opens the job + creates its escrow account
      toast.success(t("posted"), {
        description: t("postedDesc", { title: title.trim() }),
      });
      onPosted(job.id);
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error(t("postFailed"), { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <label className="block">
          <Label>{t("jobTitle")}</Label>
          <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("jobTitlePlaceholder")} />
        </label>

        <label className="block">
          <Label>{t("description")}</Label>
          <textarea
            className={`${fieldCls} min-h-[88px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("descriptionPlaceholder")}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>{t("peopleNeeded")}</Label>
            <input
              className={fieldCls}
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="1"
            />
          </label>
          <label className="block">
            <Label>{t("amountPerPerson")}</Label>
            <div className="flex items-center rounded-xl border border-line bg-surface px-3.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
              <span className="font-display text-ink-muted">₦</span>
              <input
                value={perPerson}
                onChange={(e) => setPerPerson(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder="0"
                inputMode="numeric"
                className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
              />
            </div>
          </label>
        </div>

        <div>
          <Label>{t("location")} <span className="font-normal text-ink-muted">{t("locationHint")}</span></Label>
          <LocationPicker value={loc} onChange={setLoc} />
          <div className="relative mt-3">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input className={`${fieldCls} pl-9`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t("addressPlaceholder")} />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>{t("shiftStarts")}</Label>
            <input type="datetime-local" className={fieldCls} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </label>
          <label className="block">
            <Label>{t("shiftEnds")}</Label>
            <input type="datetime-local" className={fieldCls} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </label>
        </div>

        <div>
          <Label>{t("category")}</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_SLUGS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlug(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  slug === s ? "bg-brand-700 text-white" : "border border-line bg-surface text-ink-soft hover:bg-canvas"
                }`}
              >
                {t(`categories.${s}`)}
              </button>
            ))}
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-brand-50/60 px-4 py-3 text-sm">
            <span className="text-ink-soft">
              {t("perPersonSummary", { count, amount: formatNaira(String(Math.round(per * 100))) })}
            </span>
            <span className="font-semibold text-ink">
              {t("escrowTotal", { amount: formatNaira(String(Math.round(total * 100))) })}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={submit} disabled={loading}>
            {loading ? t("posting") : t("post")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

const STATUS_TONE: Record<string, "green" | "amber" | "neutral"> = {
  OPEN: "amber",
  FILLED: "green",
  IN_PROGRESS: "green",
  COMPLETED: "green",
  DRAFT: "neutral",
  CANCELLED: "neutral",
};

export function JobsBoard({ jobs }: { jobs: EmployerDashboard["jobs"] }) {
  const t = useTranslations("JobsBoard");
  if (jobs.length === 0)
    return (
      <Card className="p-10 text-center">
        <p className="font-medium text-ink">{t("noJobs")}</p>
        <p className="mt-1 text-sm text-ink-muted">{t("noJobsBody")}</p>
      </Card>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {jobs.map((j) => (
        <JobCard key={j.id} job={j} />
      ))}
    </div>
  );
}

function JobCard({ job }: { job: EmployerDashboard["jobs"][number] }) {
  const t = useTranslations("JobsBoard");
  const knownTone = STATUS_TONE[job.status];
  const status = {
    tone: knownTone ?? ("neutral" as const),
    label: knownTone ? t(`status.${job.status}`) : job.status.toLowerCase(),
  };
  const filled = Math.min(job.accepted, job.headcount);
  const pct = job.headcount > 0 ? (filled / job.headcount) * 100 : 0;
  const escrow = job.escrow;

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <Card className="flex h-full flex-col p-5 transition hover:border-brand-200 hover:shadow-md">
        <div className="flex items-start justify-between">
          <Pill tone={status.tone}>{job.accepted >= job.headcount ? t("full") : status.label}</Pill>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft transition group-hover:border-brand-300">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>

        <h3 className="mt-3 font-semibold leading-snug text-ink">{job.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5" /> {job.location ?? "Lagos"}
        </p>
        {job.startAt && (
          <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
            <Calendar className="h-3.5 w-3.5" /> {new Date(job.startAt).toLocaleString("en-NG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        )}

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-ink-soft">
            <span>{t("filled", { filled, headcount: job.headcount })}</span>
            <span className="flex items-center gap-2 text-ink-muted">
              {job.applied > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{t("toReview", { count: job.applied })}</span>}
            </span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">{formatNaira(job.perPerson)} <span className="text-ink-muted">{t("perPerson")}</span></span>
          <span className="font-display text-lg font-semibold tabular-nums text-ink">{formatNaira(job.payAmount)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs">
          {escrow ? (
            escrow.released ? <Pill tone="green">{t("paidOut")}</Pill> : escrow.funded ? <Pill tone="green">{t("escrowFunded")}</Pill> : <Pill tone="amber">{t("needsFunding")}</Pill>
          ) : (
            <Pill>{t("noEscrow")}</Pill>
          )}
          {job.invited > 0 && <Pill>{t("invited", { count: job.invited })}</Pill>}
          <span className="ml-auto font-medium text-brand-700">{t("view")}</span>
        </div>
      </Card>
    </Link>
  );
}
