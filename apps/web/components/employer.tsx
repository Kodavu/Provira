"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowRight, Calendar, MapPin, Users } from "lucide-react";
import { api, EmployerDashboard } from "@/lib/api";
import { LocationPicker, type LocationValue } from "@/components/location-picker";
import { Button, Card, Pill, ProgressBar, formatNaira } from "@/components/ui";

const CATEGORIES = [
  { slug: "loading", label: "Loading" },
  { slug: "cleaning", label: "Cleaning" },
  { slug: "driving", label: "Driving" },
  { slug: "tailoring", label: "Tailoring" },
  { slug: "bricklaying", label: "Construction" },
];

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
    if (!title.trim()) return setError("Add a job title");
    if (!per) return setError("Add the amount per person");
    if (startAt && endAt && new Date(endAt) <= new Date(startAt))
      return setError("The shift end must be after the start");
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
      toast.success("Job posted", {
        description: `"${title.trim()}" is live. Invite workers or review applications.`,
      });
      onPosted(job.id);
    } catch (e) {
      const msg = (e as Error).message.replace(/^API \d+:\s*/, "");
      setError(msg);
      toast.error("Couldn't post job", { description: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <label className="block">
          <Label>Job title</Label>
          <input className={fieldCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Warehouse loading (1 day)" />
        </label>

        <label className="block">
          <Label>Description</Label>
          <textarea
            className={`${fieldCls} min-h-[88px] resize-y`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's the work, what to bring, who it's for…"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>People needed</Label>
            <input
              className={fieldCls}
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="1"
            />
          </label>
          <label className="block">
            <Label>Amount per person</Label>
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
          <Label>Location <span className="font-normal text-ink-muted">— helps nearby workers find this job</span></Label>
          <LocationPicker value={loc} onChange={setLoc} />
          <div className="relative mt-3">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input className={`${fieldCls} pl-9`} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address or landmark (e.g. 12 Allen Ave)" />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <Label>Shift starts</Label>
            <input type="datetime-local" className={fieldCls} value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </label>
          <label className="block">
            <Label>Shift ends</Label>
            <input type="datetime-local" className={fieldCls} value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </label>
        </div>

        <div>
          <Label>Category</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => setSlug(c.slug)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  slug === c.slug ? "bg-brand-700 text-white" : "border border-line bg-surface text-ink-soft hover:bg-canvas"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-brand-50/60 px-4 py-3 text-sm">
            <span className="text-ink-soft">
              {count} × {formatNaira(String(Math.round(per * 100))) } per person
            </span>
            <span className="font-semibold text-ink">
              Escrow total: {formatNaira(String(Math.round(total * 100)))}
            </span>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end">
          <Button onClick={submit} disabled={loading}>
            {loading ? "Posting…" : "Post job"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

const STATUS: Record<string, { label: string; tone: "green" | "amber" | "neutral" }> = {
  OPEN: { label: "Matching", tone: "amber" },
  FILLED: { label: "Filled", tone: "green" },
  IN_PROGRESS: { label: "In progress", tone: "green" },
  COMPLETED: { label: "Completed", tone: "green" },
  DRAFT: { label: "Draft", tone: "neutral" },
  CANCELLED: { label: "Cancelled", tone: "neutral" },
};

export function JobsBoard({ jobs }: { jobs: EmployerDashboard["jobs"] }) {
  if (jobs.length === 0)
    return (
      <Card className="p-10 text-center">
        <p className="font-medium text-ink">No jobs yet</p>
        <p className="mt-1 text-sm text-ink-muted">Post your first shift to start hiring workers.</p>
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
  const status = STATUS[job.status] ?? { label: job.status.toLowerCase(), tone: "neutral" as const };
  const filled = Math.min(job.accepted, job.headcount);
  const pct = job.headcount > 0 ? (filled / job.headcount) * 100 : 0;
  const escrow = job.escrow;

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <Card className="flex h-full flex-col p-5 transition hover:border-brand-200 hover:shadow-md">
        <div className="flex items-start justify-between">
          <Pill tone={status.tone}>{job.accepted >= job.headcount ? "Full" : status.label}</Pill>
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
            <span>{filled}/{job.headcount} filled</span>
            <span className="flex items-center gap-2 text-ink-muted">
              {job.applied > 0 && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{job.applied} to review</span>}
            </span>
          </div>
          <ProgressBar pct={pct} />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-ink-soft">{formatNaira(job.perPerson)} <span className="text-ink-muted">/ person</span></span>
          <span className="font-display text-lg font-semibold tabular-nums text-ink">{formatNaira(job.payAmount)}</span>
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-line pt-4 text-xs">
          {escrow ? (
            escrow.released ? <Pill tone="green">Paid out</Pill> : escrow.funded ? <Pill tone="green">Escrow funded</Pill> : <Pill tone="amber">Needs funding</Pill>
          ) : (
            <Pill>No escrow</Pill>
          )}
          {job.invited > 0 && <Pill>{job.invited} invited</Pill>}
          <span className="ml-auto font-medium text-brand-700">View →</span>
        </div>
      </Card>
    </Link>
  );
}
