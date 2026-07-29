"use client";

import { useState } from "react";
import { api, EmployerDashboard } from "@/lib/api";
import { Button, Card, Input, Pill, formatNaira } from "@/components/ui";

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
      setTitle("");
      setPay("");
      onPosted();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <p className="eyebrow">Post a job</p>
      <h2 className="mb-4 mt-1 font-display text-xl font-semibold text-ink">
        Hire for a shift
      </h2>
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

const STATUS_TONE: Record<string, "green" | "amber" | "neutral"> = {
  OPEN: "amber",
  FILLED: "green",
  IN_PROGRESS: "green",
  COMPLETED: "green",
  DRAFT: "neutral",
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
      <Card className="p-6">
        <p className="text-sm text-ink-muted">
          No jobs yet. Post your first shift above.
        </p>
      </Card>
    );

  return (
    <div className="space-y-3">
      {jobs.map((j) => (
        <JobRow key={j.id} job={j} onChange={onChange} />
      ))}
    </div>
  );
}

function JobRow({
  job,
  onChange,
}: {
  job: EmployerDashboard["jobs"][number];
  onChange: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function fund() {
    setBusy("fund");
    try {
      await api.fundJob(job.id);
      onChange();
    } finally {
      setBusy(null);
    }
  }
  async function match() {
    setBusy("match");
    try {
      await api.publishJob(job.id).catch(() => {});
      await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"}/jobs/${job.id}/match`, { method: "POST" });
      onChange();
    } finally {
      setBusy(null);
    }
  }

  const escrow = job.escrow;
  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink">{job.title}</p>
            <Pill tone={STATUS_TONE[job.status] ?? "neutral"}>{job.status.toLowerCase()}</Pill>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {formatNaira(job.payAmount)} · {job.location ?? "Lagos"}
            {job.skills.length > 0 && ` · ${job.skills.join(", ")}`}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {job.applicants} applicant{job.applicants === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {escrow ? (
            escrow.released ? (
              <Pill tone="green">Escrow released</Pill>
            ) : escrow.funded ? (
              <Pill tone="green">Escrow funded · {formatNaira(escrow.amount)}</Pill>
            ) : (
              <Button size="sm" onClick={fund} disabled={busy === "fund"}>
                {busy === "fund" ? "Funding…" : `Fund escrow · ${formatNaira(escrow.amount)}`}
              </Button>
            )
          ) : (
            <Pill>No escrow</Pill>
          )}
          <Button size="sm" variant="outline" onClick={match} disabled={busy === "match"}>
            {busy === "match" ? "Matching…" : "Find workers"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
