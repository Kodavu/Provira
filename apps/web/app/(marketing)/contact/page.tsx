import Link from "next/link";
import { Mail, Phone, MessageCircle, MapPin, LifeBuoy, Building2, Newspaper } from "lucide-react";
import { PageHero } from "@/components/marketing/page-shell";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";

export const metadata = {
  title: "Contact Provira",
  description: "Get in touch with the Provira team — support, sales, press, or partnerships. We're based in Lagos and reachable by phone, WhatsApp, and USSD.",
};

const CHANNELS = [
  { icon: LifeBuoy, title: "Support", body: "Trouble with a job, a payout, or your account?", action: "Visit the Help Center", href: "/help" },
  { icon: Building2, title: "Sales & partnerships", body: "Hiring at scale or integrating Provira?", action: "partners@provira.com.ng", href: "mailto:partners@provira.com.ng" },
  { icon: Newspaper, title: "Press", body: "Media enquiries and our press kit.", action: "press@provira.com.ng", href: "/press" },
];

const DIRECT = [
  { icon: Mail, label: "Email", value: "hello@provira.com.ng", href: "mailto:hello@provira.com.ng" },
  { icon: Phone, label: "USSD", value: "*347*82#", href: "tel:*347*82#" },
  { icon: MessageCircle, label: "WhatsApp", value: "+234 800 000 0000", href: "https://wa.me/2348000000000" },
  { icon: MapPin, label: "Office", value: "Lagos, Nigeria", href: undefined },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow={<><MessageCircle className="h-3.5 w-3.5" /> Contact us</>}
        title="We'd love to hear from you"
        lede="Questions, feedback, or a partnership in mind? Reach the right team below — and if you don't have a smartphone, dial *347*82# or message us on WhatsApp."
      />

      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 md:py-24">
        {/* Channels */}
        <RevealGroup className="grid gap-4 md:grid-cols-3">
          {CHANNELS.map((c) => (
            <RevealItem key={c.title}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <c.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">{c.title}</h2>
                <p className="mt-1.5 flex-1 text-sm text-ink-soft">{c.body}</p>
                <Link href={c.href} className="mt-4 text-sm font-semibold text-brand-700 transition hover:text-brand-800">
                  {c.action} →
                </Link>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Contact form + direct details */}
        <div className="mt-14 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-3xl border border-line bg-white p-6 shadow-card sm:p-8">
            <h2 className="text-xl font-bold text-ink">Send us a message</h2>
            <p className="mt-1.5 text-sm text-ink-soft">We typically reply within one business day.</p>
            <form className="mt-6 space-y-4" action="mailto:hello@provira.com.ng" method="post" encType="text/plain">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" name="name" placeholder="Ada Obi" required />
                <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
              </div>
              <div>
                <label htmlFor="topic" className="mb-1.5 block text-sm font-medium text-ink">I&apos;m reaching out about</label>
                <select id="topic" name="topic" className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100">
                  <option>General enquiry</option>
                  <option>Support with my account</option>
                  <option>Hiring / employer</option>
                  <option>Partnership</option>
                  <option>Press</option>
                </select>
              </div>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-ink">Message</label>
                <textarea id="message" name="message" rows={5} required placeholder="How can we help?" className="w-full resize-y rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
              </div>
              <button type="submit" className="w-full rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 sm:w-auto">
                Send message
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-bold text-ink">Reach us directly</h2>
            <ul className="mt-6 space-y-4">
              {DIRECT.map((d) => (
                <li key={d.label} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4 shadow-card">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-canvas text-brand-600">
                    <d.icon className="h-5 w-5" strokeWidth={1.8} />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{d.label}</p>
                    {d.href ? (
                      <a href={d.href} className="text-sm font-semibold text-ink transition hover:text-brand-700">{d.value}</a>
                    ) : (
                      <p className="text-sm font-semibold text-ink">{d.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function Field({ label, name, type = "text", placeholder, required }: { label: string; name: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
