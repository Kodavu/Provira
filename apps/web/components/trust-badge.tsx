"use client";

import {
  BadgeCheck,
  Banknote,
  Building2,
  Mail,
  Phone,
  Repeat,
  ShieldCheck,
  Sparkles,
  Star,
  Store,
  Zap,
  type LucideIcon,
} from "lucide-react";

export type TrustBadgeKey =
  | "IDENTITY_VERIFIED"
  | "EMAIL_VERIFIED"
  | "PHONE_VERIFIED"
  | "PAYMENT_VERIFIED"
  | "GOV_ID_VERIFIED"
  | "COMPANY_VERIFIED"
  | "TOP_RATED"
  | "RISING_TALENT"
  | "FAST_RESPONDER"
  | "TRUSTED_EMPLOYER"
  | "TRUSTED_TRADER"
  | "LONG_TERM_CLIENT";

type Tone = "brand" | "green" | "gold" | "neutral";

const TONE: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700 ring-brand-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  gold: "bg-gold-50 text-gold-700 ring-gold-100",
  neutral: "bg-canvas text-ink-soft ring-line",
};

const META: Record<TrustBadgeKey, { label: string; tip: string; icon: LucideIcon; tone: Tone }> = {
  GOV_ID_VERIFIED: { label: "Government ID Verified", tip: "NIN/BVN verified with a government source.", icon: BadgeCheck, tone: "brand" },
  IDENTITY_VERIFIED: { label: "Identity Verified", tip: "Identity confirmed by Tally.", icon: ShieldCheck, tone: "brand" },
  COMPANY_VERIFIED: { label: "Company Verified", tip: "Business details verified by Tally.", icon: Building2, tone: "brand" },
  EMAIL_VERIFIED: { label: "Email Verified", tip: "Email address confirmed.", icon: Mail, tone: "neutral" },
  PHONE_VERIFIED: { label: "Phone Verified", tip: "Phone number confirmed.", icon: Phone, tone: "neutral" },
  PAYMENT_VERIFIED: { label: "Payment Verified", tip: "A verified payout account is on file.", icon: Banknote, tone: "green" },
  TOP_RATED: { label: "Top Rated", tip: "4.8★ or higher across 5+ reviews.", icon: Star, tone: "gold" },
  RISING_TALENT: { label: "Rising Talent", tip: "New to Tally and already highly rated.", icon: Sparkles, tone: "gold" },
  FAST_RESPONDER: { label: "Fast Responder", tip: "Typically responds within an hour.", icon: Zap, tone: "gold" },
  TRUSTED_EMPLOYER: { label: "Trusted Employer", tip: "5+ completed hires with strong ratings.", icon: ShieldCheck, tone: "brand" },
  TRUSTED_TRADER: { label: "Trusted Trader", tip: "A consistent, verified sales record.", icon: Store, tone: "brand" },
  LONG_TERM_CLIENT: { label: "Long-Term Client", tip: "Repeatedly hires and rehires workers.", icon: Repeat, tone: "brand" },
};

/** A single trust badge with an accessible hover/focus tooltip. */
export function TrustBadge({ badge, size = "md" }: { badge: TrustBadgeKey; size?: "sm" | "md" }) {
  const meta = META[badge];
  if (!meta) return null;
  const Icon = meta.icon;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const ic = size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5";
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        aria-label={`${meta.label}: ${meta.tip}`}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold ring-1 ${TONE[meta.tone]} ${pad} outline-none transition focus-visible:ring-2 focus-visible:ring-brand-400`}
      >
        <Icon className={ic} strokeWidth={2} /> {meta.label}
      </span>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1.5 w-52 -translate-x-1/2 rounded-lg bg-ink px-3 py-2 text-xs font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {meta.tip}
      </span>
    </span>
  );
}

/** A wrapping row of trust badges. */
export function TrustBadges({ badges, size = "md", className = "" }: { badges: string[]; size?: "sm" | "md"; className?: string }) {
  const known = badges.filter((b): b is TrustBadgeKey => b in META);
  if (!known.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {known.map((b) => (
        <TrustBadge key={b} badge={b} size={size} />
      ))}
    </div>
  );
}
