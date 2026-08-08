import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, WorkerDashboard } from "@/lib/api";
import { session } from "@/lib/session";
import { Button, Card, Eyebrow, Pill, ProviraMark, TierBadge } from "@/components/ui";
import { colors, formatNaira, radius } from "@/lib/theme";

const TIER_MIN: Record<string, number> = { BUILDING: 0, EMERGING: 250, TRUSTED: 500, ESTABLISHED: 750 };
const TIER_ORDER = ["BUILDING", "EMERGING", "TRUSTED", "ESTABLISHED"];
const cap = (s: string) => s[0] + s.slice(1).toLowerCase();

export default function Worker() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<WorkerDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applyResult, setApplyResult] = useState<{ title: string; code: string | null } | null>(null);
  const [busyJob, setBusyJob] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = await session.userId();
    if (!userId) {
      router.replace("/login");
      return;
    }
    try {
      setData(await api.workerDashboard(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function apply(jobId: string, title: string) {
    const userId = await session.userId();
    if (!userId) return;
    setBusyJob(jobId);
    try {
      const res = await api.applyToJob(jobId, userId);
      setApplyResult({ title, code: res.code });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyJob(null);
    }
  }

  if (error && !data)
    return (
      <Centered>
        <Text style={{ color: colors.error }}>Couldn&apos;t load your dashboard.</Text>
        <Text style={{ color: colors.inkMuted, marginTop: 8, fontSize: 13 }}>{error}</Text>
      </Centered>
    );

  if (!data)
    return (
      <Centered>
        <ProviraMark size={40} />
        <Text style={{ color: colors.inkMuted, marginTop: 12 }}>Loading…</Text>
      </Centered>
    );

  const firstName = data.user.fullName?.split(" ")[0] ?? "there";
  const assignedIds = new Set(data.assignments.map((a) => a.job.id));
  const available = data.openJobs.filter((j) => !assignedIds.has(j.id));

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, gap: 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.brand} />}
    >
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ProviraMark size={28} />
          <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>provira</Text>
        </View>
        <Text
          onPress={async () => {
            await session.clear();
            router.replace("/login");
          }}
          style={{ color: colors.inkSoft, fontSize: 14, fontWeight: "600" }}
        >
          Sign out
        </Text>
      </View>

      <View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink }}>Hi, {firstName}</Text>
        <Text style={{ color: colors.inkSoft, marginTop: 2 }}>
          Your standing, your shifts, what you&apos;ve earned.
        </Text>
      </View>

      {/* Apply code banner */}
      {applyResult ? (
        <Card style={{ backgroundColor: colors.brand50, borderColor: "#c7c8fb" }}>
          <Eyebrow color={colors.brand700}>You applied — {applyResult.title}</Eyebrow>
          {applyResult.code ? (
            <>
              <Text style={{ marginTop: 6, color: colors.ink, fontSize: 15 }}>
                Confirmation code:{" "}
                <Text style={{ fontWeight: "800", fontSize: 22, letterSpacing: 4, color: colors.brand700 }}>
                  {applyResult.code}
                </Text>
              </Text>
              <Text style={{ marginTop: 4, color: colors.inkSoft, fontSize: 13 }}>
                Enter it under Your jobs to confirm attendance and get paid.
              </Text>
            </>
          ) : (
            <Text style={{ marginTop: 6, color: colors.inkSoft, fontSize: 13 }}>
              You&apos;ve already applied — find it under Your jobs.
            </Text>
          )}
          <View style={{ marginTop: 10 }}>
            <Button label="Dismiss" variant="outline" onPress={() => setApplyResult(null)} />
          </View>
        </Card>
      ) : null}

      <StandingCard score={data.score} onPress={() => router.push("/score")} />
      <WalletCard wallet={data.wallet} />

      {/* Your jobs */}
      <Section title="Your jobs">
        {data.assignments.length === 0 ? (
          <Card>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>
              No active jobs yet. Apply to a job below to get started.
            </Text>
          </Card>
        ) : (
          data.assignments.map((a) => (
            <AssignmentRow key={a.id} assignment={a} onConfirmed={load} />
          ))
        )}
      </Section>

      {/* Jobs nearby */}
      <Section title="Jobs nearby">
        {available.length === 0 ? (
          <Card>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>
              No new jobs nearby — you&apos;ve applied to what&apos;s open.
            </Text>
          </Card>
        ) : (
          available.map((j) => (
            <Card key={j.id} style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: "700", color: colors.ink, fontSize: 15 }}>{j.title}</Text>
                  <Text style={{ color: colors.inkMuted, fontSize: 13, marginTop: 2 }}>
                    {j.location?.label ?? "Nearby"}
                    {j.skills.length ? ` · ${j.skills.map((s) => s.skill.name).join(", ")}` : ""}
                  </Text>
                </View>
                <Text style={{ fontWeight: "800", color: colors.ink, fontSize: 16 }}>{formatNaira(j.payAmount)}</Text>
              </View>
              <Button
                label={busyJob === j.id ? "Applying…" : "Apply"}
                variant="outline"
                loading={busyJob === j.id}
                onPress={() => apply(j.id, j.title)}
              />
            </Card>
          ))
        )}
      </Section>

      {/* Loan offers */}
      <Section title="Loan offers">
        {data.loanOffers.map((o) => (
          <Card key={o.productId}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={{ fontWeight: "700", color: colors.ink }}>{o.name}</Text>
                <Text style={{ color: colors.inkMuted, fontSize: 13, marginTop: 2 }}>
                  Up to {formatNaira(o.maxAmount)} · needs score {o.minScore}+
                </Text>
              </View>
              {o.eligible ? <Pill tone="success">Eligible</Pill> : <Pill>Locked</Pill>}
            </View>
          </Card>
        ))}
      </Section>
    </ScrollView>
  );
}

function StandingCard({ score, onPress }: { score: WorkerDashboard["score"]; onPress?: () => void }) {
  const idx = TIER_ORDER.indexOf(score.tier);
  const next = TIER_ORDER[idx + 1];
  const pts = next ? Math.max(0, TIER_MIN[next] - score.value) : 0;
  const base = TIER_MIN[score.tier];
  const span = next ? TIER_MIN[next] - base : 1;
  const pct = next ? Math.min(100, ((score.value - base) / span) * 100) : 100;
  return (
    <Card style={{ alignItems: "center", gap: 8 }}>
      <Text style={{ fontSize: 56, fontWeight: "800", color: colors.ink }}>{score.value}</Text>
      <TierBadge tier={score.tier} />
      <View style={{ width: "100%", marginTop: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
          <Text style={{ fontWeight: "700", color: colors.ink, fontSize: 13 }}>
            {next ? `Next: ${cap(next)}` : "Top tier"}
          </Text>
          {next ? <Text style={{ color: colors.inkMuted, fontSize: 13 }}>{pts} pts to go</Text> : null}
        </View>
        <View style={{ height: 8, borderRadius: 999, backgroundColor: colors.canvas, overflow: "hidden" }}>
          <View style={{ width: `${pct}%`, height: "100%", backgroundColor: colors.brand }} />
        </View>
        <Text style={{ color: colors.inkSoft, fontSize: 13, marginTop: 8 }}>
          {score.jobsCompleted} shifts done · {Math.round(score.onTimeRate * 100)}% on time.
        </Text>
        {onPress ? (
          <Text onPress={onPress} style={{ color: colors.brand, fontWeight: "700", fontSize: 13, marginTop: 10 }}>
            View full breakdown ›
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

function WalletCard({ wallet }: { wallet: WorkerDashboard["wallet"] }) {
  return (
    <Card>
      <Eyebrow color={colors.gold700}>Available now</Eyebrow>
      <Text style={{ fontSize: 34, fontWeight: "800", color: colors.ink, marginTop: 4 }}>
        {formatNaira(wallet.balance)}
      </Text>
      <Text style={{ color: colors.inkMuted, fontSize: 13, marginTop: 2 }}>
        Paid out same-day when a job is confirmed.
      </Text>
    </Card>
  );
}

function AssignmentRow({
  assignment,
  onConfirmed,
}: {
  assignment: WorkerDashboard["assignments"][number];
  onConfirmed: () => void;
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const confirmed = assignment.attendance?.status === "CONFIRMED";

  async function confirm() {
    setBusy(true);
    setErr(null);
    try {
      await api.confirmAttendance(assignment.id, code);
      onConfirmed();
    } catch (e) {
      setErr((e as Error).message.includes("Invalid") ? "Wrong code" : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={{ fontWeight: "700", color: colors.ink, fontSize: 15 }}>{assignment.job.title}</Text>
          <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
            {formatNaira(assignment.job.payAmount)} · {assignment.status.toLowerCase()}
          </Text>
        </View>
        {confirmed ? <Pill tone="success">Confirmed · paid</Pill> : null}
      </View>
      {!confirmed ? (
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="4-digit code"
            keyboardType="number-pad"
            maxLength={4}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.md,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: colors.ink,
            }}
          />
          <View style={{ width: 110 }}>
            <Button label={busy ? "…" : "Confirm"} onPress={confirm} loading={busy} disabled={code.length !== 4} />
          </View>
        </View>
      ) : null}
      {err ? <Text style={{ color: colors.error, fontSize: 12 }}>{err}</Text> : null}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10 }}>
      <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>{title}</Text>
      {children}
    </View>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas, padding: 24 }}>
      {children}
    </View>
  );
}
