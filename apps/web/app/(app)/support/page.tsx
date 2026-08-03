"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LifeBuoy, Mail, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { type Role } from "@/lib/auth";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/page";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

interface Faq {
  q: string;
  a: string;
  roles?: Role[]; // undefined = all roles
}

const FAQS: Faq[] = [
  {
    q: "How do I get paid for a shift?",
    a: "After you're matched to a job, apply to get a 4-digit confirmation code. On site, the employer confirms your attendance — that releases the escrowed pay straight into your Tally wallet, which you can withdraw to your bank.",
    roles: ["WORKER"],
  },
  {
    q: "What is my Tally Score?",
    a: "It's a reliability score built from your real activity — shifts completed, on-time rate, sales logged, and loans repaid. A higher score unlocks better jobs and larger loans. Every point is explained on the My standing page.",
    roles: ["WORKER", "TRADER"],
  },
  {
    q: "Why should I log every sale?",
    a: "Each logged sale becomes part of a verifiable track record. That record is what qualifies you for stock loans — the more consistent your sales, the larger the working capital you can access.",
    roles: ["TRADER"],
  },
  {
    q: "How does escrow protect my money?",
    a: "When you fund a job, the pay is held in a dedicated escrow account — not sent to the worker yet. It's only released when the worker confirms attendance with their code, so you never pay for a no-show.",
    roles: ["EMPLOYER"],
  },
  {
    q: "How do I hire reliable workers?",
    a: "Post a job, fund its escrow, then tap Find workers. We match workers by skill and reliability score, so you see people with a proven track record first.",
    roles: ["EMPLOYER"],
  },
  {
    q: "How do loans work?",
    a: "Loan eligibility is based on your Tally Score. Approved loans disburse to your payout account, and repaying on time raises your score — unlocking larger limits next time.",
    roles: ["WORKER", "TRADER"],
  },
  {
    q: "How do I verify my identity?",
    a: "Go to Verify identity, enter your 11-digit NIN, and add a payout bank account. We confirm the account name before saving and store sensitive numbers encrypted — we never keep the raw values.",
  },
  {
    q: "Is my data safe?",
    a: "Yes. Sensitive identifiers like your NIN are hashed, payout details are confirmed before use, and security and payment alerts are always delivered so you're never in the dark about your money.",
  },
];

export default function HelpPage() {
  const { activeRole } = useSession();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const faqs = useMemo(() => {
    const forRole = FAQS.filter((f) => !f.roles || f.roles.includes(activeRole));
    const q = query.trim().toLowerCase();
    if (!q) return forRole;
    return forRole.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [activeRole, query]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Help center" subtitle="Answers to common questions — and how to reach a human if you need one." />

      <FadeIn delay={0.05}>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(null); }}
            placeholder="Search help…"
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
      </FadeIn>

      <div className="space-y-2.5">
        {faqs.length === 0 ? (
          <Card className="p-6"><p className="text-sm text-ink-muted">No results. Try different words, or contact us below.</p></Card>
        ) : (
          faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Card key={f.q} className="overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-medium text-ink">{f.q}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <p className="px-5 pb-4 text-sm leading-relaxed text-ink-soft">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Still need help?</h2>
        <Stagger className="grid gap-3 sm:grid-cols-3">
          <StaggerItem>
            <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer">
              <ContactCard icon={MessageCircle} label="WhatsApp" hint="Chat with support" />
            </a>
          </StaggerItem>
          <StaggerItem>
            <a href="mailto:support@tally.ng">
              <ContactCard icon={Mail} label="Email us" hint="support@tally.ng" />
            </a>
          </StaggerItem>
          <StaggerItem>
            <Link href="/verify">
              <ContactCard icon={ShieldCheck} label="Verify identity" hint="Unlock higher limits" />
            </Link>
          </StaggerItem>
        </Stagger>
      </div>

      <Card className="flex items-center gap-3 bg-brand-50/50 p-5">
        <LifeBuoy className="h-5 w-5 shrink-0 text-brand-700" />
        <p className="text-sm text-ink-soft">
          Security and payment alerts are always delivered. Manage every other notification in{" "}
          <Link href="/settings" className="font-medium text-brand-700">Settings</Link>.
        </p>
      </Card>
    </div>
  );
}

function ContactCard({ icon: Icon, label, hint }: { icon: typeof Mail; label: string; hint: string }) {
  return (
    <Card className="group flex h-full items-center gap-3 p-4 transition hover:border-brand-200 hover:shadow-md">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
        <Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-ink-muted">{hint}</span>
      </span>
    </Card>
  );
}
