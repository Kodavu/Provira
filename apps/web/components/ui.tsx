import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function Button({
  children,
  onClick,
  type = "button",
  disabled,
  variant = "primary",
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  const styles =
    variant === "primary"
      ? "bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50"
      : "bg-transparent text-brand-700 hover:bg-brand-50";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </button>
  );
}

const TIER_STYLES: Record<string, string> = {
  BUILDING: "bg-neutral-100 text-neutral-700",
  EMERGING: "bg-amber-100 text-amber-800",
  TRUSTED: "bg-brand-100 text-brand-700",
  ESTABLISHED: "bg-emerald-600 text-white",
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
