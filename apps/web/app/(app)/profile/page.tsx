"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, MapPin, User } from "lucide-react";
import { api, type Skill, type WorkerProfileEdit } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { LocationPicker, type LocationValue } from "@/components/location-picker";
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

const fieldCls =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-muted focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export default function ProfilePage() {
  const { userId, activeRole, refresh } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<WorkerProfileEdit | null>(null);
  const [catalog, setCatalog] = useState<Skill[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [fullName, setFullName] = useState("");
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
      setBio(p.bio ?? "");
      setLoc({ state: p.location.state ?? "", area: p.location.area ?? "", ward: p.location.ward ?? "" });
      setSkills(new Set(p.skills));
      setLangs(new Set(p.languages.length ? p.languages : ["EN"]));
    } catch (e) {
      setError((e as Error).message.replace(/^API \d+:\s*/, ""));
    }
  }, [userId]);

  useEffect(() => {
    if (activeRole !== "WORKER") {
      router.replace("/overview");
      return;
    }
    load();
  }, [activeRole, router, load]);

  if (activeRole !== "WORKER") return null;
  if (error) return <PageError message={error} onRetry={load} />;
  if (!profile) return <PageSkeleton />;

  function toggle(set: Set<string>, key: string, setter: (s: Set<string>) => void) {
    const next = new Set(set);
    next.has(key) ? next.delete(key) : next.add(key);
    setter(next);
  }

  async function save() {
    if (fullName.trim().length < 2) return toast.error("Add your name");
    setSaving(true);
    try {
      await api.updateWorkerProfile(userId, {
        fullName: fullName.trim(),
        bio: bio.trim(),
        languages: [...langs],
        skillSlugs: [...skills],
        state: loc.state || undefined,
        area: loc.area || undefined,
        ward: loc.ward || undefined,
      });
      await refresh();
      toast.success("Profile saved", { description: "Employers will see your updated profile." });
    } catch (e) {
      toast.error("Couldn't save", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Your profile"
        subtitle="This is what employers see when you apply. Add your skills and location so the right jobs — and jobs near you — find you."
      />

      <FadeIn delay={0.05} className="space-y-5">
        <Card className="p-5">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">Full name</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input className={`${fieldCls} pl-9`} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="e.g. Amaka Okafor" />
            </div>
          </label>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-ink-soft">About you</span>
            <textarea className={`${fieldCls} min-h-[80px] resize-y`} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="A sentence or two about your experience and what you're good at." />
          </label>
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-ink">Skills</p>
          <p className="text-sm text-ink-soft">Pick what you do — jobs matching these can be shown first.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {catalog.map((s) => {
              const on = skills.has(s.slug);
              return (
                <button
                  key={s.slug}
                  type="button"
                  onClick={() => toggle(skills, s.slug, setSkills)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    on ? "bg-brand-600 text-white" : "border border-line bg-surface text-ink-soft hover:bg-canvas"
                  }`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {s.name}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <p className="font-semibold text-ink">Languages</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {LANGUAGES.map((l) => {
              const on = langs.has(l.code);
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => toggle(langs, l.code, setLangs)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    on ? "bg-brand-600 text-white" : "border border-line bg-surface text-ink-soft hover:bg-canvas"
                  }`}
                >
                  {on && <Check className="h-3.5 w-3.5" />}
                  {l.label}
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <p className="flex items-center gap-1.5 font-semibold text-ink"><MapPin className="h-4 w-4 text-brand-600" /> Where you work</p>
          <p className="text-sm text-ink-soft">Used to show you jobs near you.</p>
          <div className="mt-3">
            <LocationPicker value={loc} onChange={setLoc} />
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save profile"}</Button>
        </div>
      </FadeIn>
    </div>
  );
}
