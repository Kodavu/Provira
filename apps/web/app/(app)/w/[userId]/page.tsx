"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  Clock,
  ExternalLink,
  FileText,
  Gauge,
  Globe,
  ImageIcon,
  Languages as LanguagesIcon,
  MapPin,
  Repeat,
  Star,
  TrendingUp,
  Video,
  Wallet,
} from "lucide-react";
import { api, formatNaira, type WorkerPublicProfile } from "@/lib/api";
import { Card, Pill, TierBadge } from "@/components/ui";
import { PageError, EmptyPanel } from "@/components/page";
import { ProfileSkeleton } from "@/components/skeletons";
import { CountUp, FadeIn, Stagger, StaggerItem } from "@/components/motion";
import { TrustBadges } from "@/components/trust-badge";
import { RatingBreakdown, ReviewList, Stars } from "@/components/reviews";

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

function fmtDate(iso: string | null): string | null {
  return iso ? new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" }) : null;
}

function lastActive(iso: string | null): string | null {
  if (!iso) return null;
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Active today";
  if (days === 1) return "Active yesterday";
  if (days < 7) return `Active ${days}d ago`;
  if (days < 30) return `Active ${Math.floor(days / 7)}w ago`;
  return `Active ${Math.floor(days / 30)}mo ago`;
}

function responseLabel(min: number | null): string {
  if (min == null) return "—";
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 1440)}d`;
}

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

const PORTFOLIO_ICON = { IMAGE: ImageIcon, PDF: FileText, VIDEO: Video, LINK: ExternalLink } as const;

export default function WorkerProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [data, setData] = useState<WorkerPublicProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setData(await api.workerPublicProfile(userId));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <PageError message={error} onRetry={load} />;
  if (!data) return <ProfileSkeleton />;

  const s = data.stats;
  const earnings = data.stats.totalEarnings && BigInt(data.stats.totalEarnings) > 0n ? data.stats.totalEarnings : null;
  const meta = [
    data.location && { icon: MapPin, text: data.location },
    data.languages.length > 0 && { icon: LanguagesIcon, text: data.languages.join(", ") },
    fmtDate(data.memberSince) && { icon: CalendarDays, text: `Joined ${fmtDate(data.memberSince)}` },
    lastActive(data.lastActive) && { icon: Clock, text: lastActive(data.lastActive) as string },
  ].filter(Boolean) as { icon: typeof MapPin; text: string }[];

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* Header */}
      <FadeIn>
        <Card className="overflow-hidden p-0">
          <div className="h-24 bg-gradient-to-r from-brand-500 to-brand-700 sm:h-28" />
          <div className="px-5 pb-5 sm:px-7">
            <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex min-w-0 items-end gap-4">
                <span className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-brand-100 text-2xl font-bold text-brand-700 ring-4 ring-surface sm:h-24 sm:w-24">
                  {data.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(data.fullName)
                  )}
                </span>
                <div className="min-w-0 pb-1">
                  <h1 className="flex items-center gap-1.5 font-display text-2xl font-bold tracking-tight text-ink">
                    {data.fullName}
                    {data.kycVerified && <BadgeCheck className="h-5 w-5 text-brand-600" />}
                  </h1>
                  {data.headline && <p className="text-sm text-ink-soft">{data.headline}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 pb-1">
                <TierBadge tier={s.tier} />
                {data.rating.count > 0 && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink">
                    <Star className="h-4 w-4 fill-gold-400 text-gold-400" /> {data.rating.average.toFixed(1)}
                    <span className="font-normal text-ink-muted">({data.rating.count})</span>
                  </span>
                )}
              </div>
            </div>

            {meta.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted">
                {meta.map((m, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5"><m.icon className="h-4 w-4" /> {m.text}</span>
                ))}
              </div>
            )}

            {data.badges.length > 0 && <TrustBadges badges={data.badges} className="mt-4" />}

            {data.skills.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {data.skills.map((sk) => <Pill key={sk}>{sk}</Pill>)}
              </div>
            )}

            {data.bio && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{data.bio}</p>}
          </div>
        </Card>
      </FadeIn>

      {/* Stats */}
      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile icon={Briefcase} label="Jobs completed" value={<CountUp value={s.jobsCompleted} />} />
        <StatTile icon={Gauge} label="Completion rate" value={<><CountUp value={Math.round(s.completionRate * 100)} />%</>} sub="Accepted → confirmed" />
        <StatTile icon={TrendingUp} label="Success score" value={<CountUp value={s.successScore} />} sub={s.tier[0] + s.tier.slice(1).toLowerCase()} />
        <StatTile icon={Star} label="Average rating" value={data.rating.average.toFixed(1)} sub={`${data.rating.count} review${data.rating.count === 1 ? "" : "s"}`} />
        <StatTile icon={Clock} label="On-time rate" value={<><CountUp value={Math.round(s.onTimeRate * 100)} />%</>} />
        <StatTile icon={Gauge} label="Response time" value={responseLabel(s.responseMinutes)} sub="Invite → accept" />
        <StatTile icon={Repeat} label="Repeat hire rate" value={<><CountUp value={Math.round(s.repeatHireRate * 100)} />%</>} sub="Employers who rehired" />
        {earnings && <StatTile icon={Wallet} label="Total earned" value={formatNaira(earnings)} />}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Work history */}
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">Work history</h2>
            {data.workHistory.length === 0 ? (
              <EmptyPanel icon={Briefcase} title="No completed jobs yet" />
            ) : (
              <Card className="p-0">
                <ol className="relative divide-y divide-line">
                  {data.workHistory.map((w, i) => (
                    <li key={i} className="flex gap-4 px-5 py-4">
                      <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                        <BadgeCheck className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-medium text-ink">{w.jobTitle}</p>
                          {w.rating != null && <Stars rating={w.rating} size={14} />}
                        </div>
                        <p className="text-xs text-ink-muted">
                          {[w.employerName, w.category, fmtDate(w.completedAt)].filter(Boolean).join(" · ")}
                        </p>
                        {w.feedback && <p className="mt-1.5 text-sm text-ink-soft">“{w.feedback}”</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            )}
          </section>

          {/* Portfolio */}
          {data.portfolio.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">Portfolio</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.portfolio.map((p) => {
                  const Icon = PORTFOLIO_ICON[p.kind] ?? ExternalLink;
                  return (
                    <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="group">
                      <Card className="flex h-full items-start gap-3 p-4 transition hover:border-brand-200 hover:shadow-md">
                        <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-canvas text-ink-soft">
                          {p.thumbnailUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink group-hover:text-brand-700">{p.title}</p>
                          {p.description && <p className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{p.description}</p>}
                        </div>
                      </Card>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              Reviews {data.rating.count > 0 && <span className="text-ink-muted">({data.rating.count})</span>}
            </h2>
            <ReviewList reviews={data.reviews} />
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {data.rating.count > 0 && (
            <Card className="p-5">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Rating</h3>
              <RatingBreakdown rating={data.rating} />
            </Card>
          )}

          {data.certifications.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Certifications</h3>
              <div className="space-y-3">
                {data.certifications.map((c) => (
                  <div key={c.id} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold-50 text-gold-700">
                      <Award className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-sm font-medium text-ink">
                        {c.title}
                        {c.verified && <BadgeCheck className="h-3.5 w-3.5 text-brand-600" />}
                      </p>
                      {c.issuer && <p className="text-xs text-ink-muted">{c.issuer}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {data.languages.length > 0 && (
            <Card className="p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Languages</h3>
              <div className="flex flex-wrap gap-1.5">
                {data.languages.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-xs font-medium text-ink-soft">
                    <Globe className="h-3 w-3" /> {l}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
