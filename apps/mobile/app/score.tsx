import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, ScoreBreakdown } from "@/lib/api";
import { session } from "@/lib/session";
import { BackHeader, Card, Ring, TruvoMark, TierBadge } from "@/components/ui";
import { colors, radius } from "@/lib/theme";

const cap = (s: string) => s[0] + s.slice(1).toLowerCase();

const TIPS = [
  { label: "Complete a shift", delta: "+25", up: true },
  { label: "Show up on time", delta: "+10", up: true },
  { label: "Repay a loan on time", delta: "+40", up: true },
  { label: "A no-show costs", delta: "−40", up: false },
];

function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  return `${Math.floor(d / 86400)}d ago`;
}

function Points({ n }: { n: number }) {
  const up = n >= 0;
  return (
    <Text style={{ fontWeight: "800", color: up ? colors.gold700 : colors.error }}>
      {up ? "+" : "−"}
      {Math.abs(n)}
    </Text>
  );
}

export default function Score() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<ScoreBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const userId = await session.userId();
    if (!userId) {
      router.replace("/login");
      return;
    }
    try {
      setData(await api.scoreBreakdown(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!data)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas }}>
        <TruvoMark size={40} />
        <Text style={{ color: error ? colors.error : colors.inkMuted, marginTop: 12 }}>
          {error ?? "Loading…"}
        </Text>
      </View>
    );

  const pctOfMax = (data.score / data.range.max) * 100;

  return (
    <ScrollView
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32, gap: 16 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.brand} />}
    >
      <BackHeader onBack={() => (router.canGoBack() ? router.back() : router.replace("/worker"))} title="Your Truvo Score" />
      <Text style={{ color: colors.inkSoft, marginTop: -4 }}>
        Exactly what moved your score — the ledger behind the number.
      </Text>

      {/* Score + progress */}
      <Card style={{ alignItems: "center", gap: 12 }}>
        <Ring pct={pctOfMax} size={150}>
          <Text style={{ fontSize: 40, fontWeight: "800", color: colors.ink }}>{data.score}</Text>
          <Text style={{ fontSize: 12, color: colors.inkMuted }}>/ {data.range.max}</Text>
        </Ring>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TierBadge tier={data.tier} />
          {data.progress.nextTier ? (
            <Text style={{ color: colors.inkSoft, fontSize: 13 }}>
              {data.progress.pointsToNext} pts to {cap(data.progress.nextTier)}
            </Text>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", gap: 10, width: "100%" }}>
          <Metric label="Shifts" value={String(data.metrics.jobsCompleted)} />
          <Metric label="On-time" value={`${Math.round(data.metrics.onTimeRate * 100)}%`} />
          <Metric label="Sales" value={String(data.metrics.salesCount)} />
        </View>
      </Card>

      {/* What's in your score */}
      <View style={{ gap: 10 }}>
        <View>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>What&apos;s in your score</Text>
          <Text style={{ color: colors.inkSoft, fontSize: 13 }}>Every signal, and the points it added or removed.</Text>
        </View>
        {data.factors.length === 0 ? (
          <Card>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>No score activity yet.</Text>
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            {data.factors.map((f, i) => (
              <View
                key={f.type}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  borderTopWidth: i === 0 ? 0 : 1,
                  borderTopColor: colors.line,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: f.points >= 0 ? colors.gold50 : "#fee2e2", alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: f.points >= 0 ? colors.gold700 : colors.error, fontWeight: "800" }}>
                      {f.points >= 0 ? "↑" : "↓"}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ fontWeight: "600", color: colors.ink }}>{f.label}</Text>
                    <Text style={{ fontSize: 12, color: colors.inkMuted }}>×{f.count}</Text>
                  </View>
                </View>
                <Points n={f.points} />
              </View>
            ))}
          </Card>
        )}
      </View>

      {/* Recent activity */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>Recent activity</Text>
        <Card style={{ padding: 0 }}>
          {data.history.map((h, i) => (
            <View
              key={i}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 11,
                borderTopWidth: i === 0 ? 0 : 1,
                borderTopColor: colors.line,
              }}
            >
              <View>
                <Text style={{ fontWeight: "600", color: colors.ink }}>{h.label}</Text>
                <Text style={{ fontSize: 12, color: colors.inkMuted }}>{timeAgo(h.at)}</Text>
              </View>
              <Points n={h.points} />
            </View>
          ))}
        </Card>
      </View>

      {/* How to move it */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>How to move it</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {TIPS.map((t) => (
            <View key={t.label} style={{ flexBasis: "47%", flexGrow: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14 }}>
              <Text style={{ fontSize: 22, fontWeight: "800", color: t.up ? colors.gold700 : colors.error }}>{t.delta}</Text>
              <Text style={{ color: colors.inkSoft, fontSize: 13, marginTop: 2 }}>{t.label}</Text>
            </View>
          ))}
        </View>
        <Text style={{ color: colors.inkMuted, fontSize: 13 }}>
          Banks and lenders can verify this record — it&apos;s what turns your work into credit.
        </Text>
      </View>
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, borderRadius: radius.md, padding: 10 }}>
      <Text style={{ fontSize: 16, fontWeight: "800", color: colors.ink }}>{value}</Text>
      <Text style={{ fontSize: 11, color: colors.inkMuted }}>{label}</Text>
    </View>
  );
}
