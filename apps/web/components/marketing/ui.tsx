import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { type ReactNode } from "react";

// ---------- Decorative backgrounds (pure CSS/SVG, no assets) ----------

/** Subtle dotted/line grid, faded at the edges. Purely decorative. */
export function GridPattern({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <svg className="h-full w-full [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)]" width="100%" height="100%">
        <defs>
          <pattern id="provira-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#provira-grid)" />
      </svg>
    </div>
  );
}

/** Soft gradient glow blob. Position with utility classes. */
export function Glow({
  className = "",
  from = "#7b79f5",
  to = "#f5b301",
}: {
  className?: string;
  from?: string;
  to?: string;
}) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute rounded-full blur-3xl ${className}`}
      style={{ background: `radial-gradient(circle at 30% 30%, ${from}, transparent 70%), radial-gradient(circle at 70% 70%, ${to}, transparent 70%)` }}
    />
  );
}

// ---------- Text helpers ----------

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50/70 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-700 ${className}`}>
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={`${align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="mt-4 text-balance text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-soft">{subtitle}</p>}
    </div>
  );
}

// ---------- Buttons / CTAs ----------

export function PrimaryCta({
  href,
  children,
  className = "",
  size = "md",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const pad = size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return (
    <Link
      href={href}
      className={`group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-brand-600 font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-brand-600/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 ${pad} ${className}`}
    >
      {/* sheen on hover */}
      <span aria-hidden className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="relative">{children}</span>
    </Link>
  );
}

export function SecondaryCta({
  href,
  children,
  className = "",
  size = "md",
}: {
  href: string;
  children: ReactNode;
  className?: string;
  size?: "md" | "lg";
}) {
  const pad = size === "lg" ? "px-7 py-3.5 text-base" : "px-5 py-2.5 text-sm";
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white font-semibold text-ink shadow-sm transition hover:border-brand-300 hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${pad} ${className}`}
    >
      {children}
    </Link>
  );
}

// ---------- Layout ----------

export function Section({
  id,
  children,
  className = "",
  container = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  container?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-24 ${className}`}>
      {container ? <div className="mx-auto max-w-6xl px-4 sm:px-6">{children}</div> : children}
    </section>
  );
}

/** A thin gradient hairline used to separate sections. */
export function Divider() {
  return <div aria-hidden className="mx-auto h-px max-w-6xl bg-gradient-to-r from-transparent via-line to-transparent" />;
}

export function LinkArrow({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition hover:text-brand-800">
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
