"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, MapPin, Users } from "lucide-react";
import { api, EmployerDashboard } from "@/lib/api";
import { Button, Card, Input, Pill, ProgressBar, formatNaira } from "@/components/ui";

const CATEGORIES = [
  { slug: "loading", label: "Loading" },
  { slug: "cleaning", label: "Cleaning" },
  { slug: "driving", label: "Driving" },
  { slug: "tailoring", label: "Tailoring" },
  { slug: "bricklaying", label: "Construction" },
];

export function PostJobCard({
  employerProfileId,
  onPosted,
}: {
  employerProfileId: string;
  onPosted: () => void;
}) {
  const [title, setTitle] = useState("");
  const [pay, setPay] = useState("");
  const [slug, setSlug] = useState("loading");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const naira = Number(pay);
    if (!title.trim() || !naira) {
      setError("Add a title and pay amount");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const job = await api.createJob({
        employerId: employerProfileId,
        title: title.trim(),
        payAmount: String(Math.round(naira * 100)),
        skillSlugs: [slug],
      });
      await api.publishJob(job.id); // opens the job + creates its escrow account
      toast.success("Job posted", { description: `"${title.trim()}" is live and matching workers.` });
      setTitle("");
      setPay("");
      onPosted();
    } catch (e) {
      setError((e as Error).message);
      toast.error("Couldn't post job", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <p className="eyebrow">Post a job</p>
      <h2 className="mb-4 mt-1 font-display text-xl font-semibold text-ink">Hire for a shift</h2>
      <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
        <Input value={title} onChange={setTitle} placeholder="e.g. Warehouse loading (1 day)" />
        <div className="flex items-center rounded-xl border border-line bg-surface px-3.5">
          <span className="font-display text-ink-muted">₦</span>
          <input
            value={pay}
            onChange={(e) => setPay(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder="Pay"
            inputMode="numeric"
            className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
          />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            onClick={() => setSlug(c.slug)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              slug === c.slug
                ? "bg-brand-700 text-white"
                : "border border-line bg-surface text-ink-soft hover:bg-canvas"
            }`}
          >
            {c.label}
          </button>
        ))}
        <div className="ml-auto">
          <Button onClick={submit} disabled={loading}>
            {loading ? "Posting…" : "Post job"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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

export function JobsBoard({
  jobs,
  onChange,
}: {
  jobs: EmployerDashboard["jobs"];
  onChange: () => void;
}) {
  if (jobs.length === 0)
    return (
      <Card className="p-10 text-center">
        <p className="font-medium text-ink">No jobs yet</p>
        <p className="mt-1 text-sm text-ink-muted">Post your first shift to start matching workers.</p>
      </Card>
    );

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {jobs.map((j) => (
        <JobCard key={j.id} job={j} onChange={onChange} />
      ))}
    </div>
  );
}

function JobCard({
  job,
  onChange,
}: {
  job: EmployerDashboard["jobs"][number];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const status = STATUS[job.status] ?? { label: job.status.toLowerCase(), tone: "neutral" as const };
  const matched = Math.min(job.applicants, job.headcount);
  const pct = job.headcount > 0 ? (matched / job.headcount) * 100 : 0;
  const escrow = job.escrow;

  async function fund() {
    setBusy("fund");
    try {
      await api.fundJob(job.id);
      toast.success("Escrow funded", { description: `${job.title} · ${formatNaira(escrow?.amount ?? job.payAmount)} secured.` });
      onChange();
    } catch (e) {
      toast.error("Funding failed", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }
  async function match() {
    setBusy("match");
    try {
      await api.publishJob(job.id).catch(() => {});
      await api.matchJob(job.id);
      toast.success("Finding workers", { description: `Matching started for ${job.title}.` });
      onChange();
    } catch (e) {
      toast.error("Couldn't start matching", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card className="flex flex-col p-5">
      <div className="flex items-start justify-between">
        <Pill tone={status.tone}>{status.label}</Pill>
        <span className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink-soft transition hover:border-brand-300 hover:text-brand-600">
          <ArrowRight className="h-4 w-4" />
        </span>
      </div>

      <h3 className="mt-3 font-semibold leading-snug text-ink">{job.title}</h3>
      <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
        <MapPin className="h-3.5 w-3.5" /> {job.location ?? "Lagos"}
      </p>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs text-ink-soft">
          <span>{matched}/{job.headcount} matched</span>
          <span className="flex items-center gap-1 text-ink-muted">
            <Users className="h-3.5 w-3.5" /> {job.applicants} applied
          </span>
        </div>
        <ProgressBar pct={pct} />
      </div>

      {/* Avatar stack (decorative) + pay */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {Array.from({ length: Math.max(1, Math.min(job.headcount, 4)) }).map((_, i) => (
            <span
              key={i}
              className={`h-7 w-7 rounded-full border-2 border-surface ${
                i < matched ? "bg-brand-200" : "bg-canvas"
              }`}
            />
          ))}
        </div>
        <span className="font-display text-lg font-semibold tabular-nums text-ink">
          {formatNaira(job.payAmount)}
        </span>
      </div>

      {/* Escrow + action */}
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-4">
        {escrow ? (
          escrow.released ? (
            <Pill tone="green">Paid out</Pill>
          ) : escrow.funded ? (
            <Pill tone="green">Escrow funded</Pill>
          ) : (
            <Button size="sm" onClick={fund} disabled={busy === "fund"} className="flex-1">
              {busy === "fund" ? "Funding…" : `Fund · ${formatNaira(escrow.amount)}`}
            </Button>
          )
        ) : (
          <Pill>No escrow</Pill>
        )}
        <Button size="sm" variant="outline" onClick={match} disabled={busy === "match"} className="ml-auto">
          {busy === "match" ? "Matching…" : "Find workers"}
        </Button>
      </div>
    </Card>
  );
}
