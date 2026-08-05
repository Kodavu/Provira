"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LifeBuoy, Mail, MessageCircle, Search, ShieldCheck } from "lucide-react";
import { useSession } from "@/lib/session-context";
import { type Role } from "@/lib/auth";
import { Card } from "@/components/ui";
import { PageHeader } from "@/components/page";
import { FadeIn, Stagger, StaggerItem } from "@/components/motion";

interface FaqMeta {
  id: string;
  roles?: Role[]; // undefined = all roles
}

const FAQ_META: FaqMeta[] = [
  { id: "getPaid", roles: ["WORKER"] },
  { id: "tallyScore", roles: ["WORKER", "TRADER"] },
  { id: "logSale", roles: ["TRADER"] },
  { id: "escrowProtect", roles: ["EMPLOYER"] },
  { id: "hireWorkers", roles: ["EMPLOYER"] },
  { id: "loans", roles: ["WORKER", "TRADER"] },
  { id: "verify" },
  { id: "dataSafe" },
];

export default function HelpPage() {
  const { activeRole } = useSession();
  const t = useTranslations("Support");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<number | null>(0);

  const faqs = useMemo(() => {
    const forRole = FAQ_META.filter((f) => !f.roles || f.roles.includes(activeRole)).map((f) => ({
      id: f.id,
      q: t(`faqs.${f.id}.q`),
      a: t(`faqs.${f.id}.a`),
    }));
    const q = query.trim().toLowerCase();
    if (!q) return forRole;
    return forRole.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [activeRole, query, t]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title={t("title")} subtitle={t("subtitle")} />

      <FadeIn delay={0.05}>
        <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5">
          <Search className="h-4 w-4 shrink-0 text-ink-muted" strokeWidth={2} />
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(null); }}
            placeholder={t("searchPlaceholder")}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-muted"
          />
        </div>
      </FadeIn>

      <div className="space-y-2.5">
        {faqs.length === 0 ? (
          <Card className="p-6"><p className="text-sm text-ink-muted">{t("noResults")}</p></Card>
        ) : (
          faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Card key={f.id} className="overflow-hidden">
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
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">{t("stillNeedHelp")}</h2>
        <Stagger className="grid gap-3 sm:grid-cols-3">
          <StaggerItem>
            <a href="https://wa.me/2348000000000" target="_blank" rel="noreferrer">
              <ContactCard icon={MessageCircle} label={t("whatsapp")} hint={t("whatsappHint")} />
            </a>
          </StaggerItem>
          <StaggerItem>
            <a href="mailto:support@tally.ng">
              <ContactCard icon={Mail} label={t("emailUs")} hint={t("emailHint")} />
            </a>
          </StaggerItem>
          <StaggerItem>
            <Link href="/verify">
              <ContactCard icon={ShieldCheck} label={t("verifyIdentity")} hint={t("verifyHint")} />
            </Link>
          </StaggerItem>
        </Stagger>
      </div>

      <Card className="flex items-center gap-3 bg-brand-50/50 p-5">
        <LifeBuoy className="h-5 w-5 shrink-0 text-brand-700" />
        <p className="text-sm text-ink-soft">
          {t.rich("alertsNote", {
            link: (chunks) => <Link href="/settings" className="font-medium text-brand-700">{chunks}</Link>,
          })}
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
