import { Briefcase, Heart, Rocket, Globe2, GraduationCap, Coins, Mail } from "lucide-react";
import { Section, SectionHeading } from "@/components/marketing/ui";
import { RevealGroup, RevealItem } from "@/components/marketing/motion";
import { PageHero } from "@/components/marketing/page-shell";

export const metadata = {
  title: "Careers — Truvo",
  description: "Join Truvo and help build economic identity for Nigeria's informal economy. See open roles and how we work.",
};

const PERKS = [
  { icon: Rocket, title: "Real impact", body: "Your work reaches people the financial system has ignored for decades." },
  { icon: Globe2, title: "Remote-friendly", body: "Work from anywhere in Nigeria, with regular time together in Lagos." },
  { icon: Coins, title: "Meaningful ownership", body: "Competitive pay and equity — you share in what we build." },
  { icon: GraduationCap, title: "Grow fast", body: "Small team, big surface area. Ownership and learning from day one." },
  { icon: Heart, title: "Health & wellbeing", body: "Health cover and genuine flexibility for life outside work." },
  { icon: Briefcase, title: "Craft over process", body: "We optimise for shipping quality, not busywork or vanity metrics." },
];

const ROLES = [
  { title: "Senior Product Engineer", team: "Engineering", location: "Lagos / Remote" },
  { title: "Mobile Engineer (React Native)", team: "Engineering", location: "Remote" },
  { title: "Product Designer", team: "Design", location: "Lagos / Remote" },
  { title: "Field Operations Lead", team: "Operations", location: "Lagos" },
  { title: "Customer Support Specialist", team: "Support", location: "Remote" },
];

export default function CareersPage() {
  return (
    <>
      <PageHero
        eyebrow={<><Briefcase className="h-3.5 w-3.5" /> Careers</>}
        title="Build the future of work in Nigeria"
        lede="We're a small, senior team building the economic identity layer for the informal economy. If that mission moves you, we should talk."
      >
        <a href="#roles" className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700">
          See open roles
        </a>
      </PageHero>

      {/* Perks */}
      <Section className="py-16 md:py-24">
        <SectionHeading eyebrow="Why Truvo" title="What it's like to work here" />
        <RevealGroup className="mt-12 grid gap-4 md:grid-cols-3">
          {PERKS.map((p) => (
            <RevealItem key={p.title}>
              <div className="flex h-full flex-col rounded-2xl border border-line bg-white p-6 shadow-card">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-600">
                  <p.icon className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <h2 className="mt-4 text-lg font-semibold text-ink">{p.title}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{p.body}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-24 border-y border-line bg-canvas/50">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="Open roles" title="Come build with us" />
          <div className="mt-10 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
            {ROLES.map((r) => (
              <a
                key={r.title}
                href={`mailto:careers@truvo.com.ng?subject=Application: ${encodeURIComponent(r.title)}`}
                className="group flex flex-col gap-2 p-5 transition hover:bg-canvas sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-ink group-hover:text-brand-700">{r.title}</p>
                  <p className="text-sm text-ink-muted">{r.team}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-ink-soft">{r.location}</span>
                  <span className="text-sm font-semibold text-brand-700">Apply →</span>
                </div>
              </a>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-line bg-white p-6 text-center shadow-card">
            <p className="text-sm text-ink-soft">
              Don&apos;t see your role? We&apos;re always glad to meet exceptional people.
            </p>
            <a href="mailto:careers@truvo.com.ng" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800">
              <Mail className="h-4 w-4" /> careers@truvo.com.ng
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
