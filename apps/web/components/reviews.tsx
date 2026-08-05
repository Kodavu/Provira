"use client";

import { useState } from "react";
import { Flag, Star, ThumbsUp } from "lucide-react";
import { toast } from "sonner";
import { api, type Review } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Card } from "@/components/ui";
import { EmptyPanel } from "@/components/page";

/** Row of 5 stars for a 0–5 rating. */
export function Stars({ rating, size = 16, className = "" }: { rating: number; size?: number; className?: string }) {
  const rounded = Math.round(rating);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${rating.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          style={{ width: size, height: size }}
          className={i <= rounded ? "fill-gold-400 text-gold-400" : "fill-line text-line"}
          strokeWidth={1.5}
        />
      ))}
    </span>
  );
}

interface RatingSummary {
  average: number;
  count: number;
  breakdown: Record<string, number> | Record<number, number>;
}

/** Big average + per-star distribution bars. */
export function RatingBreakdown({ rating }: { rating: RatingSummary }) {
  const bd = rating.breakdown as Record<string, number>;
  const max = Math.max(1, ...Object.values(bd));
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="text-center sm:w-36 sm:shrink-0">
        <p className="font-display text-5xl font-bold tracking-tight text-ink">{rating.average.toFixed(1)}</p>
        <Stars rating={rating.average} className="mt-1 justify-center" />
        <p className="mt-1 text-xs text-ink-muted">{rating.count} review{rating.count === 1 ? "" : "s"}</p>
      </div>
      <div className="flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = bd[String(star)] ?? 0;
          return (
            <div key={star} className="flex items-center gap-2 text-xs">
              <span className="w-3 text-ink-muted">{star}</span>
              <Star className="h-3 w-3 fill-gold-400 text-gold-400" />
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-canvas">
                <div className="h-full rounded-full bg-gold-400 transition-[width] duration-500" style={{ width: `${(n / max) * 100}%` }} />
              </div>
              <span className="w-6 text-right text-ink-muted">{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function initials(name: string): string {
  return name.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";
}

function ReviewCard({ review }: { review: Review }) {
  const { userId } = useSession();
  const [helpful, setHelpful] = useState(review.helpfulCount);
  const [voted, setVoted] = useState(false);
  const [reported, setReported] = useState(false);
  const [busy, setBusy] = useState(false);

  async function vote() {
    if (voted || busy) return;
    setBusy(true);
    setHelpful((h) => h + 1);
    setVoted(true);
    try {
      const { helpfulCount } = await api.markReviewHelpful(review.id, userId);
      setHelpful(helpfulCount);
    } catch {
      setHelpful((h) => h - 1);
      setVoted(false);
    } finally {
      setBusy(false);
    }
  }

  async function report() {
    if (reported || busy) return;
    setBusy(true);
    setReported(true);
    try {
      await api.reportReview(review.id, userId);
      toast.success("Thanks — we'll review this report.");
    } catch {
      setReported(false);
      toast.error("Couldn't report right now.");
    } finally {
      setBusy(false);
    }
  }

  const dims: [string, number | null][] = [
    ["Communication", review.dimensions.communication],
    ["Professionalism", review.dimensions.professionalism],
    ["Payment speed", review.dimensions.paymentSpeed],
    ["Quality", review.dimensions.quality],
  ];

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 text-sm font-bold text-brand-700">
            {review.authorAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={review.authorAvatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              initials(review.authorName)
            )}
          </span>
          <div>
            <p className="font-medium text-ink">{review.authorName}</p>
            <p className="text-xs text-ink-muted">
              {review.jobTitle ? `${review.jobTitle} · ` : ""}{timeAgo(review.createdAt)}
            </p>
          </div>
        </div>
        <Stars rating={review.rating} size={15} />
      </div>

      {review.comment && <p className="mt-3 text-sm leading-relaxed text-ink-soft">{review.comment}</p>}

      {dims.some(([, v]) => v != null) && (
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {dims.filter(([, v]) => v != null).map(([label, v]) => (
            <span key={label} className="inline-flex items-center gap-1 text-xs text-ink-muted">
              {label} <Stars rating={v as number} size={11} />
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-4 border-t border-line pt-3">
        <button
          onClick={vote}
          disabled={voted || busy}
          className={`inline-flex items-center gap-1.5 text-xs font-medium transition ${voted ? "text-brand-600" : "text-ink-muted hover:text-ink"}`}
        >
          <ThumbsUp className={`h-3.5 w-3.5 ${voted ? "fill-brand-100" : ""}`} /> Helpful{helpful > 0 ? ` (${helpful})` : ""}
        </button>
        <button
          onClick={report}
          disabled={reported || busy}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted transition hover:text-red-600 disabled:opacity-50"
        >
          <Flag className="h-3.5 w-3.5" /> {reported ? "Reported" : "Report"}
        </button>
      </div>
    </Card>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) {
    return <EmptyPanel icon={Star} title="No reviews yet" body="Reviews appear here after completed jobs." />;
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <ReviewCard key={r.id} review={r} />
      ))}
    </div>
  );
}
