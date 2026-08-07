import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Mail, MapPin, Phone } from "lucide-react";
import { Wordmark } from "@/components/ui";
import { Newsletter } from "@/components/landing/newsletter";
import { LanguageMenu } from "@/components/i18n/language-menu";

const COLUMNS: { heading: string; links: { id: string; href: string }[] }[] = [
  {
    heading: "product",
    links: [
      { id: "howItWorks", href: "/#how" },
      { id: "workers", href: "/#workers" },
      { id: "employers", href: "/#employers" },
      { id: "traders", href: "/#traders" },
      { id: "roadmap", href: "/#roadmap" },
    ],
  },
  {
    heading: "company",
    links: [
      { id: "about", href: "/about" },
      { id: "careers", href: "/careers" },
      { id: "press", href: "/press" },
      { id: "blog", href: "/blog" },
      { id: "contact", href: "/contact" },
    ],
  },
  {
    heading: "resources",
    links: [
      { id: "help", href: "/help" },
      { id: "faq", href: "/faq" },
      { id: "security", href: "/security" },
      { id: "accessibility", href: "/accessibility" },
    ],
  },
  {
    heading: "legal",
    links: [
      { id: "privacy", href: "/privacy" },
      { id: "terms", href: "/terms" },
      { id: "cookies", href: "/cookies" },
    ],
  },
];

function Social({ label, href, path }: { label: string; href: string; path: string }) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noreferrer"
      className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-muted transition hover:border-brand-300 hover:text-brand-600"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
        <path d={path} />
      </svg>
    </a>
  );
}

export async function MarketingFooter() {
  const t = await getTranslations("Footer");
  return (
    <footer className="relative overflow-hidden border-t border-line bg-white">
      <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[42rem] -translate-x-1/2 rounded-full bg-brand-100/40 blur-3xl" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)]">
          {/* Brand + newsletter */}
          <div>
            <Wordmark />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-soft">
              {t("tagline")}
            </p>

            <div className="mt-6 max-w-sm">
              <p className="mb-2 text-sm font-semibold text-ink">{t("launchUpdates")}</p>
              <Newsletter />
              <p className="mt-2 text-xs text-ink-muted">{t("noSpam")}</p>
            </div>

            <div className="mt-6 flex items-center gap-2">
              {/* X / Twitter */}
              <Social label={t("socialX")} href="https://x.com" path="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              {/* LinkedIn */}
              <Social label={t("socialLinkedIn")} href="https://linkedin.com" path="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
              {/* Instagram */}
              <Social label={t("socialInstagram")} href="https://instagram.com" path="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              {/* WhatsApp */}
              <Social label={t("socialWhatsApp")} href="https://wa.me/2348000000000" path="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.516 5.26l-.999 3.648 3.982-1.024zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {COLUMNS.map((col) => (
              <div key={col.heading}>
                <p className="text-sm font-semibold text-ink">{t(`headings.${col.heading}`)}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.id}>
                      <Link href={l.href} className="text-sm text-ink-soft transition hover:text-brand-700">
                        {t(`links.${l.id}`)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contact row */}
        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-8 text-sm text-ink-soft">
          <span className="inline-flex items-center gap-2"><Mail className="h-4 w-4 text-ink-muted" /> hello@truvo.com.ng</span>
          <span className="inline-flex items-center gap-2"><Phone className="h-4 w-4 text-ink-muted" /> *347*82#</span>
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-ink-muted" /> {t("location")}</span>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-line pt-6 sm:flex-row">
          <p className="text-sm text-ink-muted">{t("copyright", { year: String(new Date().getFullYear()) })}</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <span className="h-2 w-2 rounded-full bg-success" /> {t("systemsOperational")}
            </span>
            <LanguageMenu />
          </div>
        </div>
      </div>
    </footer>
  );
}
