"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Star, X } from "lucide-react";
import { toast } from "sonner";
import { api, type ReviewEligibility } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { Button } from "@/components/ui";
import { Stars } from "@/components/reviews";

/** Interactive 1–5 star picker with hover preview and keyboard support. */
function StarInput({ value, onChange, size = 28 }: { value: number; onChange: (v: number) => void; size?: number }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i}
          aria-label={`${i} star${i === 1 ? "" : "s"}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className="rounded outline-none transition focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          <Star
            style={{ width: size, height: size }}
            className={i <= shown ? "fill-gold-400 text-gold-400" : "fill-line text-line hover:text-gold-200"}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

function DimensionRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink-soft">{label}</span>
      <StarInput value={value} onChange={onChange} size={20} />
    </div>
  );
}

/** Dimensions shown per review direction. */
const DIMENSIONS = {
  EMPLOYER_ON_WORKER: [
    ["communication", "Communication"],
    ["professionalism", "Professionalism"],
    ["quality", "Quality of work"],
  ],
  WORKER_ON_EMPLOYER: [
    ["communication", "Communication"],
    ["professionalism", "Professionalism"],
    ["paymentSpeed", "Payment speed"],
  ],
} as const;

function ReviewDialog({
  assignmentId,
  subjectName,
  onClose,
  onSubmitted,
}: {
  assignmentId: string;
  subjectName?: string;
  onClose: () => void;
  onSubmitted?: () => void;
}) {
  const { userId } = useSession();
  const [elig, setElig] = useState<ReviewEligibility | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [dims, setDims] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setElig(await api.reviewEligibility(assignmentId, userId));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [assignmentId, userId]);

  useEffect(() => { load(); }, [load]);

  const direction = elig?.direction ?? null;
  const dimensionDefs = direction ? DIMENSIONS[direction] : [];

  async function submit() {
    if (rating < 1) {
      toast.error("Please choose a star rating.");
      return;
    }
    setBusy(true);
    try {
      await api.createReview({
        assignmentId,
        authorUserId: userId,
        rating,
        communication: dims.communication ?? null,
        professionalism: dims.professionalism ?? null,
        paymentSpeed: dims.paymentSpeed ?? null,
        quality: dims.quality ?? null,
        comment: comment.trim() || null,
      });
      toast.success("Review submitted", { description: "Thanks for helping keep Tally trustworthy." });
      onSubmitted?.();
      onClose();
    } catch (e) {
      toast.error("Couldn't submit review", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:px-4">
        <motion.div
          className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative w-full max-w-md overflow-hidden rounded-t-3xl border border-line bg-surface shadow-2xl sm:rounded-3xl"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h3 className="font-display text-lg font-semibold text-ink">
              {subjectName ? `Review ${subjectName}` : "Leave a review"}
            </h3>
            <button onClick={onClose} aria-label="Close" className="grid h-8 w-8 place-items-center rounded-full text-ink-muted transition hover:bg-canvas">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-5 py-5">
            {error ? (
              <p className="text-sm text-red-600">{error}</p>
            ) : !elig ? (
              <div className="space-y-3">
                <div className="h-8 w-40 animate-pulse rounded bg-canvas" />
                <div className="h-24 animate-pulse rounded bg-canvas" />
              </div>
            ) : elig.existing ? (
              <div className="space-y-2 text-center">
                <Stars rating={elig.existing.rating} className="justify-center" size={22} />
                <p className="text-sm font-medium text-ink">You already reviewed this job.</p>
                {elig.existing.comment && <p className="text-sm text-ink-soft">“{elig.existing.comment}”</p>}
              </div>
            ) : !elig.canReview ? (
              <p className="text-sm text-ink-soft">
                {elig.reason === "not_completed"
                  ? "You can leave a review once this job is completed."
                  : "You can't review this job."}
              </p>
            ) : (
              <div className="space-y-5">
                <div className="text-center">
                  <p className="mb-2 text-sm font-medium text-ink-soft">Overall rating</p>
                  <div className="flex justify-center">
                    <StarInput value={rating} onChange={setRating} />
                  </div>
                </div>

                <div className="space-y-2.5 border-t border-line pt-4">
                  {dimensionDefs.map(([key, label]) => (
                    <DimensionRow key={key} label={label} value={dims[key] ?? 0} onChange={(v) => setDims((d) => ({ ...d, [key]: v }))} />
                  ))}
                </div>

                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-ink-soft">Comment (optional)</span>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    maxLength={600}
                    placeholder="Share how the job went…"
                    className="w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                  />
                </label>

                <Button onClick={submit} disabled={busy || rating < 1} className="w-full">
                  {busy ? "Submitting…" : "Submit review"}
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/** Button that opens the review dialog for a completed assignment. */
export function ReviewButton({
  assignmentId,
  subjectName,
  onSubmitted,
  size = "sm",
  variant = "outline",
  label = "Leave a review",
}: {
  assignmentId: string;
  subjectName?: string;
  onSubmitted?: () => void;
  size?: "sm" | "md";
  variant?: "primary" | "outline" | "ghost";
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size={size} variant={variant} onClick={() => setOpen(true)}>
        <Star className="h-3.5 w-3.5" /> {label}
      </Button>
      {open && (
        <ReviewDialog
          assignmentId={assignmentId}
          subjectName={subjectName}
          onClose={() => setOpen(false)}
          onSubmitted={onSubmitted}
        />
      )}
    </>
  );
}
