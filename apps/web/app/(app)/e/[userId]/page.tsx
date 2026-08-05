"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  BadgeCheck,
  Banknote,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock,
  Gauge,
  Globe,
  MapPin,
  Repeat,
  Star,
  Users,
} from "lucide-react";
import { api, formatNaira, type EmployerPublicProfile } from "@/lib/api";
import { Card, Pill } from "@/components/ui";
import { PageError, EmptyPanel } from "@/components/page";
import { ProfileSkeleton } from "@/components/skeletons";
import { CountUp, FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { TrustBadges } from "@/components/trust-badge";
import { RatingBreakdown, ReviewList } from "@/components/reviews";

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

function fmtDate(iso: string | null): string | null {
  return iso ? new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : null;
}

function responseLabel(min: number | null): string {
  if (min == null) return "—";
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 1440)}d`;
}

const STATUS_TONE: Record<string, "green" | "amber" | "neutral"> = {
  COMPLETED: "green",
  IN_PROGRESS: "amber",
  FILLED: "amber",
  OPEN: "neutral",
  CANCELLED: "neutral",
  DRAFT: "neutral",
};

function StatTile({ icon: Icon, label, value, sub }: { icon: typeof Gauge; label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <StaggerItem>
      <Card className="h-full p-4">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="h-4 w-4" strokeWidth={1.9} />
        </span>
        <p className="mt-3 truncate font-display text-2xl font-bold tracking-tight text-ink">{value}</p>
        <p className="text-xs font-medium text-ink-soft">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-ink-muted">{sub}</p>}
      </Card>
    </StaggerItem>
  );
}

export default function EmployerProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [data, setData] = useState<EmployerPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.employerPublicProfile(userId));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <PageError message={error} onRetry={load} />;
  if (!data) return <ProfileSkeleton />;

  const s = data.stats;
  const totalPaid = s.totalPaid && BigInt(s.totalPaid) > 0n ? s.totalPaid : null;
  const meta = [
    data.industry && { icon: Briefcase, text: data.industry },
    data.companySize && { icon: Users, text: `${data.companySize} people` },
    data.location && { icon: MapPin, text: data.location },
    fmtDate(data.memberSince) && { icon: CalendarDays, text: `Joined ${fmtDate(data.memberSince)}` },
    data.websiteUrl && { icon: Globe, text: data.websiteUrl.replace(/^https?:\/\//, ""), href: data.websiteUrl },
  ].filter(Boolean) as { icon: typeof MapPin; text: string; href?: string }[];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}
      <FadeIn>
        <Card className="overflow-hidden p-0">
          <div className="h-24 bg-gradient-to-r from-ink to-brand-800 sm:h-28" />
          <div className="px-5 pb-5 sm:px-7">
            <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-2xl font-bold text-ink ring-4 ring-surface sm:h-24 sm:w-24">
                  {data.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(data.companyName)
                  )}
                </span>
                <div className="min-w-0 pb-1">
                  <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold tracking-tight text-ink">
                    {data.companyName}
                    {data.verified && <BadgeCheck className="h-5 w-5 text-brand-600" />}
                  </h1>
                  {data.industry && <p className="text-sm text-ink-soft">{data.industry}</p>}
                </div>
              </div>
              {data.rating.count > 0 && (
                <span className="inline-flex items-center gap-1 pb-1 text-sm font-semibold text-ink">
                  <Star className="h-4 w-4 fill-gold-400 text-gold-400" /> {data.rating.average.toFixed(1)}
                  <span className="font-normal text-ink-muted">({data.rating.count})</span>
                </span>
              )}
            </div>

            {meta.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted">
                {meta.map((m, i) =>
                  m.href ? (
                    <a key={i} href={m.href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-brand-700">
                      <m.icon className="h-4 w-4" /> {m.text}
                    </a>
                  ) : (
                    <span key={i} className="inline-flex items-center gap-1.5"><m.icon className="h-4 w-4" /> {m.text}</span>
                  ),
                )}
              </div>
            )}

            {data.badges.length > 0 && <TrustBadges badges={data.badges} className="mt-4" />}
            {data.about && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{data.about}</p>}
          </div>
        </Card>
      </FadeIn>

      {/* Stats */}
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile icon={Briefcase} label="Jobs posted" value={<CountUp value={s.jobsPosted} />} />
        <StatTile icon={CheckCircle2} label="Jobs completed" value={<CountUp value={s.jobsCompleted} />} />
        <StatTile icon={Gauge} label="Hire rate" value={<><CountUp value={Math.round(s.hireRate * 100)} />%</>} sub="Applicants accepted" />
        <StatTile icon={Clock} label="Avg response" value={responseLabel(s.avgResponseMinutes)} sub="To applicants" />
        <StatTile icon={Repeat} label="Repeat workers" value={<CountUp value={s.repeatWorkers} />} />
        {totalPaid && <StatTile icon={Banknote} label="Total paid" value={formatNaira(totalPaid)} sub="Released to workers" />}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Job history</h2>
            {data.jobHistory.length === 0 ? (
              <EmptyPanel icon={Briefcase} title="No jobs posted yet" />
            ) : (
              <Card className="p-0">
                <ol className="divide-y divide-line">
                  {data.jobHistory.map((j, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 px-5 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{j.title}</p>
                        <p className="text-xs text-ink-muted">
                          {[j.category, fmtDate(j.postedAt)].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="text-xs text-ink-muted">{j.filled}/{j.headcount} filled</span>
                        <Pill tone={STATUS_TONE[j.status] ?? "neutral"}>{j.status[0] + j.status.slice(1).toLowerCase().replace("_", " ")}</Pill>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </section>

          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              Reviews from workers {data.rating.count > 0 && <span className="text-ink-muted">({data.rating.count})</span>}
            </h2>
            <ReviewList reviews={data.reviews} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {data.rating.count > 0 && (
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Worker rating</h3>
              <RatingBreakdown rating={data.rating} />
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
