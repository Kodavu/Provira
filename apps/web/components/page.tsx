"use client";

import { type ReactNode } from "react";
import { AlertCircle, type LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/motion";
import { TruvoMark } from "@/components/ui";

// Consistent page header used across the app.
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <FadeIn className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-ink-soft">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </FadeIn>
  );
}

// Skeleton shown while a page's data loads. The mark pulses at the top so the
// wait reads as "Truvo is loading", not a blank frame.
export function PageSkeleton() {
  return (
    <div>
      <span aria-hidden className="mb-6 block">
        <TruvoMark className="h-9 w-9 animate-pulse" />
      </span>
      <div className="h-9 w-56 animate-pulse rounded-lg bg-line" />
      <div className="mt-3 h-4 w-80 animate-pulse rounded bg-line/60" />
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-line/50" />
        ))}
      </div>
      <div className="mt-6 h-64 w-full animate-pulse rounded-2xl bg-line/40" />
    </div>
  );
}

// Inline error state with a retry.
export function PageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-red-50 text-error">
        <AlertCircle className="h-6 w-6" />
      </span>
      <p className="mt-4 font-semibold text-ink">Something went wrong</p>
      <p className="mt-1 text-sm text-ink-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl border border-line px-4 py-2 text-sm font-semibold text-ink-soft transition hover:bg-canvas"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// Reusable empty state.
export function EmptyPanel({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-10 text-center">
      {Icon && (
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-canvas text-ink-muted">
          <Icon className="h-6 w-6" strokeWidth={1.7} />
        </span>
      )}
      <p className="mt-4 font-semibold text-ink">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
