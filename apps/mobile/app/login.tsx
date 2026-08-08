import { useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { api } from "@/lib/api";
import { session } from "@/lib/session";
import { routeForRoles } from "@/lib/roles";
import { Button, Eyebrow, ProviraMark } from "@/components/ui";
import { colors, radius } from "@/lib/theme";

export default function Login() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+2348010000001");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.requestOtp(phone);
      setDevCode(res.devCode ?? null);
      setStep("code");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.verifyOtp(phone, code);
      await session.save(res.token, res.user.id);
      const user = await api.getUser(res.user.id);
      router.replace(routeForRoles(user.roles.map((r) => r.role)));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        justifyContent: "center",
        padding: 24,
        paddingTop: insets.top + 24,
      }}
      style={{ backgroundColor: colors.canvas }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <ProviraMark size={32} />
        <Text style={{ fontSize: 24, fontWeight: "800", color: colors.ink }}>provira</Text>
      </View>

      <Text style={{ fontSize: 30, fontWeight: "800", color: colors.ink }}>Sign in</Text>
      <Text style={{ marginTop: 4, marginBottom: 24, color: colors.inkSoft, fontSize: 16 }}>
        We&apos;ll text you a 4-digit code — no password needed.
      </Text>

      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 20,
          gap: 16,
        }}
      >
        {step === "phone" ? (
          <>
            <Field label="Phone number">
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+234…"
                keyboardType="phone-pad"
                autoCapitalize="none"
                style={inputStyle}
              />
            </Field>
            <Button label={loading ? "Sending…" : "Send code"} onPress={send} loading={loading} />
          </>
        ) : (
          <>
            {devCode ? (
              <View style={{ backgroundColor: colors.gold50, borderRadius: radius.md, padding: 12 }}>
                <Text style={{ color: colors.gold700, fontSize: 14 }}>
                  Dev mode: your code is <Text style={{ fontWeight: "800" }}>{devCode}</Text>
                </Text>
              </View>
            ) : null}
            <Field label="Enter the 4-digit code">
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={4}
                style={[inputStyle, { letterSpacing: 8, fontSize: 20 }]}
              />
            </Field>
            <Button label={loading ? "Verifying…" : "Verify & continue"} onPress={verify} loading={loading} />
            <Button label="Back" variant="outline" onPress={() => setStep("phone")} />
          </>
        )}
        {error ? <Text style={{ color: colors.error, fontSize: 14 }}>{error}</Text> : null}
      </View>

      <View style={{ marginTop: 24 }}>
        <Eyebrow>Demo — tap to fill</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
          {[
            ["Worker", "+2348010000001"],
            ["Trader", "+2348010000002"],
            ["Employer", "+2348010000003"],
          ].map(([label, p]) => (
            <Text
              key={p}
              onPress={() => {
                setPhone(p);
                setStep("phone");
                setDevCode(null);
              }}
              style={{
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.pill,
                paddingHorizontal: 12,
                paddingVertical: 6,
                color: colors.inkSoft,
                fontSize: 13,
                overflow: "hidden",
              }}
            >
              {label} · {p}
            </Text>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.inkSoft }}>{label}</Text>
      {children}
    </View>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: colors.line,
  borderRadius: radius.md,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontSize: 15,
  color: colors.ink,
  backgroundColor: colors.surface,
} as const;
