import { ReactNode } from "react";

// Tally-stroke logomark: four vertical strokes + a diagonal fifth ("counted
// work"). Reads at favicon size and scales cleanly.
export function TallyMark({
  className = "h-7 w-7",
  boxed = true,
}: {
  className?: string;
  boxed?: boolean;
}) {
  const strokes = (
    <svg viewBox="0 0 24 24" fill="none" className={boxed ? "h-[62%] w-[62%]" : className}>
      <g stroke={boxed ? "#ffffff" : "currentColor"} strokeWidth={2.1} strokeLinecap="round">
        <path d="M5 5v14M9.5 5v14M14 5v14M18.5 5v14" />
        <path d="M3.5 8 20 16" stroke="#f5b301" />
      </g>
    </svg>
  );
  if (!boxed) return strokes;
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-lg bg-brand-600 ${className}`}
    >
      {strokes}
    </span>
  );
}

// Wordmark: lowercase "tally", indigo, tight.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <TallyMark />
      <span className="text-xl font-bold tracking-tight text-ink">Tally</span>
    </span>
  );
}

export function Card({
  children,
  className = "",
  interactive = false,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface shadow-card ${
        interactive ? "transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

/** A small inline spinner sized to the current font. */
export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-[1.1em] w-[1.1em] animate-spin ${className}`} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Button with built-in loading/success micro-states. When `loading`, the label
 * stays laid out (width preserved — no shift) but goes invisible behind a
 * centered spinner, and the button is disabled. When `success`, a check
 * briefly overlays. Purely additive: existing callers are unaffected.
 */
export function Button({
  children,
  onClick,
  type = "button",
  disabled,
  loading = false,
  success = false,
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
  variant?: "primary" | "ghost" | "outline";
  size?: "sm" | "md";
  className?: string;
}) {
  const styles = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40",
    outline:
      "border border-line bg-surface text-ink hover:bg-canvas disabled:opacity-40",
    ghost: "text-brand-700 hover:bg-brand-50 disabled:opacity-40",
  }[variant];
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm";
  const overlay = loading || success;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`relative inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition active:scale-[0.98] disabled:active:scale-100 ${pad} ${styles} ${className}`}
    >
      <span className={`inline-flex items-center gap-1.5 transition-opacity ${overlay ? "opacity-0" : "opacity-100"}`}>
        {children}
      </span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      )}
      {success && !loading && (
        <span className="absolute inset-0 grid place-items-center">
          <svg viewBox="0 0 24 24" className="h-[1.2em] w-[1.2em]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" className="[stroke-dasharray:24] [stroke-dashoffset:24] motion-safe:animate-[dash_0.4s_ease-out_forwards]" />
          </svg>
        </span>
      )}
    </button>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: "numeric" | "text";
  maxLength?: number;
  className?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      inputMode={inputMode}
      maxLength={maxLength}
      className={`w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100 ${className}`}
    />
  );
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  caption,
  accent = "brand",
}: {
  label: string;
  value: ReactNode;
  caption?: string;
  accent?: "brand" | "amber";
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <p className="eyebrow">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="font-display text-3xl font-semibold text-ink">{value}</p>
        <Sparkline accent={accent} />
      </div>
      {caption && <p className="mt-2 text-sm text-ink-muted">{caption}</p>}
    </div>
  );
}

// Decorative flat sparkline — a subtle nod to the reference's stat cards.
function Sparkline({ accent }: { accent: "brand" | "amber" }) {
  const stroke = accent === "amber" ? "#f5b301" : "#3d3bf3";
  return (
    <svg width="72" height="20" viewBox="0 0 72 20" className="shrink-0">
      <line x1="2" y1="16" x2="70" y2="16" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}

// Metric card with a real icon (no decorative sparkline). `value` accepts a
// node so callers can drop in an animated count-up.
export function Kpi({
  icon,
  label,
  value,
  caption,
  accent = "brand",
}: {
  icon?: ReactNode;
  label: string;
  value: ReactNode;
  caption?: string;
  accent?: "brand" | "amber" | "neutral";
}) {
  const tone =
    accent === "amber"
      ? "bg-gold-50 text-gold-700"
      : accent === "neutral"
        ? "bg-canvas text-ink-soft"
        : "bg-brand-50 text-brand-700";
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-card">
      <div className="flex items-center justify-between">
        <p className="eyebrow">{label}</p>
        {icon && <span className={`grid h-8 w-8 place-items-center rounded-lg ${tone}`}>{icon}</span>}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink">{value}</p>
      {caption && <p className="mt-1.5 text-sm text-ink-muted">{caption}</p>}
    </div>
  );
}

const TIER_STYLES: Record<string, string> = {
  BUILDING: "bg-canvas text-ink-soft border border-line",
  EMERGING: "bg-gold-50 text-gold-700 border border-gold-100",
  TRUSTED: "bg-brand-50 text-brand-700 border border-brand-200",
  ESTABLISHED: "bg-brand-600 text-white",
};

export function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
        TIER_STYLES[tier] ?? TIER_STYLES.BUILDING
      }`}
    >
      {tier[0] + tier.slice(1).toLowerCase()}
    </span>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  const tones = {
    neutral: "bg-canvas text-ink-soft border border-line",
    green: "bg-brand-50 text-brand-700 border border-brand-100",
    amber: "bg-amber-50 text-amber-700 border border-amber-100",
    red: "bg-red-50 text-red-700 border border-red-100",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${tones}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-canvas">
      <div
        className="h-full rounded-full bg-brand-600 transition-all"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

// Circular progress ring (used on the savings-style pot / score dial).
export function ProgressRing({
  pct,
  size = 132,
  children,
}: {
  pct: number;
  size?: number;
  children?: ReactNode;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#3d3bf3"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <Card className="p-6">
      <p className="text-sm text-ink-muted">{children}</p>
    </Card>
  );
}

/**
 * Shimmer placeholder block. Compose these to build skeletons that match a
 * component's real layout (preferred over a generic spinner for pages/lists).
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span className={`block animate-pulse rounded-md bg-line/70 ${className}`} />;
}

/** A skeleton that mimics a Card row (avatar + two text lines). */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

/** A vertical stack of skeleton cards for list/grid loading. */
export function SkeletonList({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="divide-y divide-line p-0">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </Card>
  );
}

// Single source of money formatting, shared with mobile + admin.
export { formatNaira } from "@tally/api-client";
