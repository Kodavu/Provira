import Link from "next/link";
import { type ReactNode } from "react";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Eyebrow, GridPattern, Glow } from "./ui";
import { Reveal } from "./motion";

// Shared chrome for informational/legal/content pages so the whole marketing
// site feels like one product. Pure layout — safe to render on the server.

/** Standard page hero: soft gradient band with eyebrow, title and lede. */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  lede?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden border-b border-line bg-canvas/50">
      <GridPattern className="text-slate-200" />
      <Glow className="-left-32 -top-40 h-[30rem] w-[30rem] opacity-30" from="#a3a3f8" to="#fbdd8f" />
      <div className="relative mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 md:py-24">
        <Reveal>
          {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
          <h1 className="mt-5 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl">
            {title}
          </h1>
          {lede && <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-ink-soft">{lede}</p>}
          {children && <div className="mt-8">{children}</div>}
        </Reveal>
      </div>
    </section>
  );
}

/** Breadcrumb shown above legal pages. */
export function Breadcrumb({ label }: { label: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-ink-muted">
      <Link href="/" className="transition hover:text-ink">Home</Link>
      <ChevronRight className="h-4 w-4" />
      <span className="font-medium text-ink-soft">{label}</span>
    </nav>
  );
}

/** Constrained, readable prose column with consistent typography. */
export function Prose({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`max-w-none text-[15px] leading-relaxed text-ink-soft [&_a]:font-medium [&_a]:text-brand-700 [&_a:hover]:text-brand-800 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_li]:mt-1.5 [&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-4 [&_strong]:font-semibold [&_strong]:text-ink [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 ${className}`}
    >
      {children}
    </div>
  );
}

/** Wrapper for a legal/content article: breadcrumb + title + last-updated + prose. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated?: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 md:py-20">
      <Breadcrumb label={title} />
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{title}</h1>
      {updated && <p className="mt-2 text-sm text-ink-muted">Last updated {updated}</p>}
      {intro && <p className="mt-6 text-lg leading-relaxed text-ink-soft">{intro}</p>}
      <div className="mt-8">
        <Prose>{children}</Prose>
      </div>
    </div>
  );
}

/** A simple, reusable "ready to start" band for content pages. */
export function CtaBand({
  title = "Ready to count your work?",
  body = "Join the workers, employers, and traders building a verifiable economic identity.",
  primary = { label: "Get started free", href: "/signup" },
  secondary = { label: "Talk to us", href: "/contact" },
}: {
  title?: string;
  body?: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="border-t border-line bg-canvas/50">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <Reveal>
          <h2 className="text-balance text-2xl font-bold tracking-tight text-ink sm:text-3xl">{title}</h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-soft">{body}</p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primary.href}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700"
            >
              {primary.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={secondary.href}
              className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-semibold text-ink transition hover:border-brand-300"
            >
              {secondary.label}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
