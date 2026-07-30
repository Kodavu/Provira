import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api, TraderDashboard } from "@/lib/api";
import { session } from "@/lib/session";
import { Button, Card, Eyebrow, Pill, ScreenHeader, Segmented, StatTile, TallyMark, TierBadge } from "@/components/ui";
import { colors, formatNaira, radius } from "@/lib/theme";

export default function Trader() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<TraderDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<"card" | "cash" | "transfer">("card");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const userId = await session.userId();
    if (!userId) {
      router.replace("/login");
      return;
    }
    try {
      setData(await api.traderDashboard(userId));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function logSale() {
    const userId = await session.userId();
    const naira = Number(amount);
    if (!userId || !naira || naira <= 0) return;
    setBusy(true);
    try {
      await api.logSale(userId, String(Math.round(naira * 100)), method);
      setAmount("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!data)
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.canvas }}>
        <TallyMark size={40} />
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
        <Text style={{ fontSize: 28, fontWeight: "800", color: colors.ink }}>Your stall, counted</Text>
        <Text style={{ color: colors.inkSoft, marginTop: 2 }}>
          {data.user.marketName ? `${data.user.marketName} · ` : ""}Log every sale to unlock stock loans.
        </Text>
      </View>

      {/* Standing */}
      <Card style={{ alignItems: "center", gap: 8 }}>
        <Text style={{ fontSize: 56, fontWeight: "800", color: colors.ink }}>{data.score.value}</Text>
        <TierBadge tier={data.score.tier} />
        <Text style={{ color: colors.inkSoft, fontSize: 13 }}>{data.score.salesCount} sales logged. Keep going.</Text>
      </Card>

      {/* Stats */}
      <View style={{ flexDirection: "row", gap: 10 }}>
        <StatTile label="This week" value={formatNaira(data.totals.thisWeek)} caption="Last 7 days" />
        <StatTile label="All-time" value={formatNaira(data.totals.allTime)} caption="Total sales" />
        <StatTile label="Count" value={String(data.totals.count)} caption="Transactions" />
      </View>

      {/* Log a sale */}
      <Card style={{ gap: 12 }}>
        <View>
          <Eyebrow>Log a sale</Eyebrow>
          <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink, marginTop: 2 }}>Record what you sold</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12 }}>
          <Text style={{ color: colors.inkMuted, fontSize: 16 }}>₦</Text>
          <TextInput
            value={amount}
            onChangeText={(t) => setAmount(t.replace(/[^\d.]/g, ""))}
            placeholder="0"
            keyboardType="number-pad"
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, color: colors.ink, fontSize: 15 }}
          />
        </View>
        <Segmented options={["card", "cash", "transfer"]} value={method} onChange={setMethod} />
        <Button label={busy ? "Logging…" : "Log sale"} onPress={logSale} loading={busy} />
      </Card>

      {/* Sales history */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>Sales history</Text>
        {data.sales.length === 0 ? (
          <Card>
            <Text style={{ color: colors.inkMuted, fontSize: 14 }}>No sales logged yet.</Text>
          </Card>
        ) : (
          <Card style={{ padding: 0 }}>
            {data.sales.map((s, i) => (
              <View
                key={s.id}
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
                <View>
                  <Text style={{ fontWeight: "600", color: colors.ink }}>Sale</Text>
                  <Text style={{ fontSize: 12, color: colors.inkMuted }}>
                    {new Date(s.occurredAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Pill tone="neutral">{s.method}</Pill>
                  <Text style={{ fontWeight: "800", color: colors.gold700 }}>+{formatNaira(s.amount)}</Text>
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>

      {/* Loan offers */}
      <View style={{ gap: 10 }}>
        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.ink }}>Stock loans</Text>
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
      </View>
    </ScrollView>
  );
}
