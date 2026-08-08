import { Accessibility as AccessibilityIcon, Keyboard, Eye, Smartphone, Ear, Languages } from "lucide-react";
import { Section } from "@/components/marketing/ui";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";
import { PageHero, Prose } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Accessibility — Provira",
  description: "Provira is built to be usable by everyone — keyboard navigable, screen-reader friendly, high-contrast, phone-first, and respectful of reduced-motion preferences.",
};

const COMMITMENTS = [
  { icon: Keyboard, title: "Keyboard navigable", body: "Every interactive element is reachable and operable with a keyboard, with visible focus states throughout." },
  { icon: Eye, title: "Readable & high-contrast", body: "Text meets WCAG AA contrast, scales cleanly, and never relies on colour alone to convey meaning." },
  { icon: Smartphone, title: "Phone-first & low-data", body: "Core tasks work over USSD (*347*82#) and WhatsApp, so a smartphone or data plan is never required." },
  { icon: Ear, title: "Screen-reader friendly", body: "Semantic HTML, descriptive labels, and ARIA where needed make the app understandable assistively." },
  { icon: AccessibilityIcon, title: "Respects reduced motion", body: "Animations honour your system's reduced-motion setting and fall back to calm, static views." },
  { icon: Languages, title: "Language options", body: "We're expanding beyond English toward Nigeria's most widely spoken languages." },
];

export default function AccessibilityPage() {
  return (
    <>
      <PageHero
        eyebrow={<><AccessibilityIcon className="h-3.5 w-3.5" /> Accessibility</>}
        title="Built for everyone who works"
        lede="The informal economy includes people on every kind of device and ability. Accessibility isn't a feature we add later — it's how Provira is designed from the start."
      />

      <Section className="py-16 md:py-24">
        <RevealGroup className="grid gap-4 md:grid-cols-3">
          {COMMITMENTS.map((c) => (
            <RevealItem key={c.title}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <c.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">{c.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{c.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      <section className="border-t border-line bg-canvas/50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <Prose>
            <h2>Our standard</h2>
            <p>
              We aim to conform to the <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>. Accessibility
              is an ongoing effort: we test with keyboards and screen readers, review contrast, and fix issues as we find them.
            </p>
            <h2>Tell us what we missed</h2>
            <p>
              If any part of Provira is hard to use with your assistive technology, we want to know. Email{" "}
              <a href="mailto:accessibility@provira.com.ng">accessibility@provira.com.ng</a> with the page and what went wrong, and we&apos;ll
              work to fix it — and reply with an accessible alternative in the meantime.
            </p>
          </Prose>
        </div>
      </section>
    </>
  );
}
