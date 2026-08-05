"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Check, ExternalLink, MapPin, User } from "lucide-react";
import { api, type EmployerProfileEdit, type Skill, type WorkerProfileEdit } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { LocationPicker, type LocationValue } from "@/components/location-picker";
import { ImageUploader } from "@/components/image-uploader";
import { Button, Card } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton } from "@/components/page";
import { FadeIn } from "@/components/motion";

const LANGUAGES = [
  { code: "EN", label: "English" },
  { code: "PCM", label: "Pidgin" },
  { code: "YO", label: "Yoruba" },
  { code: "HA", label: "Hausa" },
  { code: "IG", label: "Igbo" },
];

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-500", "500+"];

const fieldCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

/** A link to the user's own public profile, so they can see it as others do. */
function PublicProfileLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:border-brand-200 hover:text-brand-700">
      View public profile <ExternalLink className="h-3.5 w-3.5" />
    </Link>
  );
}

export default function ProfilePage() {
  const { activeRole } = useSession();
  if (activeRole === "EMPLOYER") return <EmployerEditor />;
  return <WorkerEditor />;
}

function WorkerEditor() {
  const { userId, refresh } = useSession();
  const t = useTranslations("Profile");

  const [profile, setProfile] = useState<WorkerProfileEdit | null>(null);
  const [catalog, setCatalog] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [loc, setLoc] = useState<LocationValue>({ state: "", area: "", ward: "" });
  const [skills, setSkills] = useState<Set<string>>(new Set());
  const [langs, setLangs] = useState<Set<string>>(new Set(["EN"]));

  const load = useCallback(async () => {
    try {
      setError(null);
      const [p, c] = await Promise.all([api.workerProfile(userId), api.skills()]);
      setProfile(p);
      setCatalog(c);
      setFullName(p.fullName ?? "");
      setHeadline(p.headline ?? "");
      setAvatarUrl(p.avatarUrl ?? null);
      setBio(p.bio ?? "");
      setLoc({ state: p.location.state ?? "", area: p.location.area ?? "", ward: p.location.ward ?? "" });
      setSkills(new Set(p.skills));
      setLangs(new Set(p.languages.length ? p.languages : ["EN"]));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <PageError message={error} onRetry={load} />;
  if (!profile) return <PageSkeleton />;

  function toggle(set: Set<string>, key: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  }

  async function save() {
    if (fullName.trim().length < 2) return toast.error(t("addName"));
    setSaving(true);
    try {
      await api.updateWorkerProfile(userId, {
        fullName: fullName.trim(),
        headline: headline.trim(),
        avatarUrl: avatarUrl ?? "",
        bio: bio.trim(),
        languages: [...langs],
        skillSlugs: [...skills],
        state: loc.state || undefined,
        area: loc.area || undefined,
        ward: loc.ward || undefined,
      });
      await refresh();
      toast.success(t("saved"), { description: t("savedDesc") });
    } catch (e) {
      toast.error(t("saveFailed"), { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={t("title")} subtitle={t("subtitle")} />
        <PublicProfileLink href={`/w/${userId}`} />
      </div>

      <FadeIn delay={0.05} className="space-y-5">
        <Card className="space-y-4 p-5">
          <ImageUploader value={avatarUrl} onChange={setAvatarUrl} name={fullName} />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">{t("fullName")}</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input className={`${fieldCls} pl-9`} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("namePlaceholder")} />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">Headline</span>
            <input className={fieldCls} value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Reliable event steward · Lagos" maxLength={80} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">{t("about")}</span>
            <textarea className={`${fieldCls} min-h-[80px] resize-y`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder={t("aboutPlaceholder")} />
          </label>
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-ink">{t("skills")}</p>
          <p className="text-sm text-ink-soft">{t("skillsHint")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {catalog.map((s) => {
              const on = skills.has(s.slug);
              return (
                <button key={s.slug} type="button" onClick={() => toggle(skills, s.slug, setSkills)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? "bg-brand-600 text-white" : "border border-line bg-surface text-ink-soft hover:bg-canvas"}`}>
                  {on && <Check className="h-3.5 w-3.5" />}{s.name}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-ink">{t("languages")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const on = langs.has(l.code);
              return (
                <button key={l.code} type="button" onClick={() => toggle(langs, l.code, setLangs)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${on ? "bg-brand-600 text-white" : "border border-line bg-surface text-ink-soft hover:bg-canvas"}`}>
                  {on && <Check className="h-3.5 w-3.5" />}{l.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <p className="flex items-center gap-1.5 font-semibold text-ink"><MapPin className="h-4 w-4 text-brand-600" /> {t("whereYouWork")}</p>
          <p className="text-sm text-ink-soft">{t("whereHint")}</p>
          <div className="mt-3"><LocationPicker value={loc} onChange={setLoc} /></div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>{t("save")}</Button>
        </div>
      </FadeIn>
    </div>
  );
}

function EmployerEditor() {
  const { userId, refresh } = useSession();
  const [profile, setProfile] = useState<EmployerProfileEdit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [about, setAbout] = useState("");
  const [loc, setLoc] = useState<LocationValue>({ state: "", area: "", ward: "" });

  const load = useCallback(async () => {
    try {
      setError(null);
      const p = await api.employerProfile(userId);
      setProfile(p);
      setBusinessName(p.businessName ?? "");
      setLogoUrl(p.logoUrl ?? null);
      setIndustry(p.industry ?? "");
      setCompanySize(p.companySize ?? "");
      setWebsiteUrl(p.websiteUrl ?? "");
      setAbout(p.about ?? "");
      setLoc({ state: p.location.state ?? "", area: p.location.area ?? "", ward: p.location.ward ?? "" });
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  if (error) return <PageError message={error} onRetry={load} />;
  if (!profile) return <PageSkeleton />;

  async function save() {
    if (businessName.trim().length < 2) return toast.error("Add your company name.");
    setSaving(true);
    try {
      await api.updateEmployerProfile(userId, {
        businessName: businessName.trim(),
        logoUrl: logoUrl ?? "",
        industry: industry.trim(),
        companySize: companySize || undefined,
        websiteUrl: websiteUrl.trim(),
        about: about.trim(),
        state: loc.state || undefined,
        area: loc.area || undefined,
        ward: loc.ward || undefined,
      });
      await refresh();
      toast.success("Profile saved", { description: "Your company profile is up to date." });
    } catch (e) {
      toast.error("Couldn't save", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title="Company profile" subtitle="How workers see your business when deciding to apply." />
        <PublicProfileLink href={`/e/${userId}`} />
      </div>

      <FadeIn delay={0.05} className="space-y-5">
        <Card className="space-y-4 p-5">
          <ImageUploader value={logoUrl} onChange={setLogoUrl} name={businessName} shape="square" purpose="logos" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">Company name</span>
            <input className={fieldCls} value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Bright Events Ltd" />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-soft">Industry</span>
              <input className={fieldCls} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="e.g. Events & hospitality" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-soft">Company size</span>
              <select className={fieldCls} value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
                <option value="">Select…</option>
                {COMPANY_SIZES.map((s) => <option key={s} value={s}>{s} people</option>)}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">Website</span>
            <input className={fieldCls} value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://…" inputMode="url" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">About</span>
            <textarea className={`${fieldCls} min-h-[90px] resize-y`} value={about} onChange={(e) => setAbout(e.target.value)} placeholder="What your business does and what it's like to work with you." maxLength={600} />
          </label>
        </Card>

        <Card className="p-5">
          <p className="flex items-center gap-1.5 font-semibold text-ink"><MapPin className="h-4 w-4 text-brand-600" /> Location</p>
          <p className="text-sm text-ink-soft">Where your business is based.</p>
          <div className="mt-3"><LocationPicker value={loc} onChange={setLoc} /></div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} loading={saving}>Save</Button>
        </div>
      </FadeIn>
    </div>
  );
}
