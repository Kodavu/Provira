import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, EmployerDashboard } from "@/lib/api";
import { session } from "@/lib/session";
import { Button, Card, Chip, Eyebrow, Pill, ScreenHeader, StatTile, TruvoMark } from "@/components/ui";
import { colors, formatNaira, radius } from "@/lib/theme";

const CATEGORIES = [
  { slug: "loading", label: "Loading" },
  { slug: "cleaning", label: "Cleaning" },
  { slug: "driving", label: "Driving" },
  { slug: "tailoring", label: "Tailoring" },
  { slug: "bricklaying", label: "Construction" },
];

const STATUS_TONE: Record<string, "success" | "gold" | "neutral"> = {
  OPEN: "gold",
  FILLED: "success",
  IN_PROGRESS: "success",
  COMPLETED: "success",
  DRAFT: "neutral",
};

export default function Employer() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<EmployerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [pay, setPay] = useState("");
  const [slug, setSlug] = useState("loading");
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const userId = await session.userId();
    if (!userId) {
      router.replace("/login");
      return;
    }
    try {
      setData(await api.employerDashboard(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function post() {
    const naira = Number(pay);
    if (!data || !title.trim() || !naira) return;
    setPosting(true);
    try {
      const job = await api.createJob({
        employerId: data.employerProfileId,
        title: title.trim(),
        payAmount: String(Math.round(naira * 100)),
        skillSlugs: [slug],
      });
      await api.publishJob(job.id);
      setTitle("");
      setPay("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPosting(false);
    }
  }

  if (!data)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas }}>
        <TruvoMark size={40} />
        <Text style={{ color: error ? colors.error : colors.inkMuted, marginTop: 12 }}>
          {error ?? "Loading…"}
        </Text>
      </View>
    );

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, gap: 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.brand} />}
    >
      <ScreenHeader
        onSignOut={async () => {
          await session.clear();
          router.replace("/login");
        }}
      />

      <View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink }}>Your jobs</Text>
        <Text style={{ color: colors.inkSoft, marginTop: 2 }}>
          Post a shift, fund escrow, and pay releases on a confirmed code.
        </Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <StatTile label="Active" value={String(data.stats.activeJobs)} caption="Jobs" />
        <StatTile label="In escrow" value={formatNaira(data.stats.committed)} caption="Committed" />
        <StatTile label="Paid out" value={formatNaira(data.stats.released)} caption="Released" />
      </View>

      {/* Post a job */}
      <Card style={{ gap: 12 }}>
        <View>
          <Eyebrow>Post a job</Eyebrow>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 2 }}>Hire for a shift</Text>
        </View>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. Warehouse loading (1 day)"
          style={inputStyle}
        />
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12 }}>
          <Text style={{ color: colors.inkMuted, fontSize: 16 }}>₦</Text>
          <TextInput
            value={pay}
            onChangeText={(t) => setPay(t.replace(/[^\d.]/g, ""))}
            placeholder="Pay"
            keyboardType="number-pad"
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: colors.ink, fontSize: 15 }}
          />
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {CATEGORIES.map((c) => (
            <Chip key={c.slug} label={c.label} active={slug === c.slug} onPress={() => setSlug(c.slug)} />
          ))}
        </View>
        <Button label={posting ? "Posting…" : "Post job"} onPress={post} loading={posting} />
      </Card>

      {/* Jobs board */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>Posted jobs</Text>
        {data.jobs.length === 0 ? (
          <Card>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>No jobs yet. Post your first shift above.</Text>
          </Card>
        ) : (
          data.jobs.map((j) => <JobRow key={j.id} job={j} onChange={load} />)
        )}
      </View>
    </ScrollView>
  );
}

function JobRow({ job, onChange }: { job: EmployerDashboard["jobs"][number]; onChange: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const escrow = job.escrow;

  async function fund() {
    setBusy("fund");
    try {
      await api.fundJob(job.id);
      onChange();
    } finally {
      setBusy(null);
    }
  }
  async function match() {
    setBusy("match");
    try {
      await api.publishJob(job.id).catch(() => {});
      // Matching now suggests workers rather than adding them; invite the
      // top-ranked candidate so the mobile quick-action stays functional.
      const suggestions = await api.jobSuggestions(job.id);
      if (suggestions[0]) await api.inviteWorker(job.id, suggestions[0].workerId);
      onChange();
    } finally {
      setBusy(null);
    }
  }

  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: "700", color: colors.ink, fontSize: 15 }}>{job.title}</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 13, marginTop: 2 }}>
            {formatNaira(job.payAmount)} · {job.location ?? "Lagos"}
          </Text>
          <Text style={{ color: colors.inkSoft, fontSize: 13, marginTop: 2 }}>
            {job.applicants} applicant{job.applicants === 1 ? "" : "s"}
          </Text>
        </View>
        <Pill tone={STATUS_TONE[job.status] ?? "neutral"}>{job.status.toLowerCase()}</Pill>
      </View>

      {escrow ? (
        escrow.released ? (
          <Pill tone="success">Escrow released</Pill>
        ) : escrow.funded ? (
          <Pill tone="success">{`Escrow funded · ${formatNaira(escrow.amount)}`}</Pill>
        ) : (
          <Button
            label={busy === "fund" ? "Funding…" : `Fund escrow · ${formatNaira(escrow.amount)}`}
            onPress={fund}
            loading={busy === "fund"}
          />
        )
      ) : null}
      <Button label={busy === "match" ? "Inviting…" : "Invite a worker"} variant="outline" onPress={match} loading={busy === "match"} />
    </Card>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.md,
  paddingHorizontal: 14,
  paddingVertical: 11,
  fontSize: 15,
  color: colors.ink,
  backgroundColor: colors.surface,
} as const;
