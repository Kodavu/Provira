import { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, ViewStyle } from "react-native";
import Svg, { G, Line } from "react-native-svg";
import { colors, radius, tierStyle } from "@/lib/theme";

// Tally-stroke logomark: four verticals + a gold diagonal fifth.
export function TallyMark({ size = 28, boxed = true }: { size?: number; boxed?: boolean }) {
  const s = boxed ? size * 0.62 : size;
  const mark = (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <G stroke={boxed ? "#ffffff" : colors.brand} strokeWidth={2.1} strokeLinecap="round">
        <Line x1="5" y1="5" x2="5" y2="19" />
        <Line x1="9.5" y1="5" x2="9.5" y2="19" />
        <Line x1="14" y1="5" x2="14" y2="19" />
        <Line x1="18.5" y1="5" x2="18.5" y2="19" />
      </G>
      <Line x1="3.5" y1="8" x2="20" y2="16" stroke={colors.gold} strokeWidth={2.1} strokeLinecap="round" />
    </Svg>
  );
  if (!boxed) return mark;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: colors.brand,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {mark}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.line,
          padding: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "outline";
  disabled?: boolean;
  loading?: boolean;
}) {
  const primary = variant === "primary";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        backgroundColor: primary ? (pressed ? colors.brandDark : colors.brand) : "transparent",
        borderWidth: primary ? 0 : 1,
        borderColor: colors.line,
        borderRadius: radius.md,
        paddingVertical: 12,
        paddingHorizontal: 18,
        alignItems: "center",
        opacity: disabled ? 0.5 : 1,
      })}
    >
      {loading ? (
        <ActivityIndicator color={primary ? "#fff" : colors.brand} />
      ) : (
        <Text style={{ color: primary ? "#fff" : colors.ink, fontWeight: "700", fontSize: 15 }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "gold" | "success";
}) {
  const map = {
    neutral: { bg: colors.canvas, fg: colors.inkSoft },
    gold: { bg: colors.gold50, fg: colors.gold700 },
    success: { bg: "#dcfce7", fg: colors.success },
  }[tone];
  return (
    <View style={{ backgroundColor: map.bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ color: map.fg, fontSize: 12, fontWeight: "600" }}>{children}</Text>
    </View>
  );
}

export function TierBadge({ tier }: { tier: string }) {
  const st = tierStyle(tier);
  const label = tier[0] + tier.slice(1).toLowerCase();
  return (
    <View style={{ backgroundColor: st.bg, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
      <Text style={{ color: st.fg, fontSize: 12, fontWeight: "700" }}>{label}</Text>
    </View>
  );
}

export function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14 }}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink, marginTop: 4 }}>{value}</Text>
      {caption ? <Text style={{ fontSize: 11, color: colors.inkMuted, marginTop: 2 }}>{caption}</Text> : null}
    </View>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: "row", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 4, gap: 4 }}>
      {options.map((o) => {
        const active = o === value;
        return (
          <Text
            key={o}
            onPress={() => onChange(o)}
            style={{
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: radius.md - 4,
              backgroundColor: active ? colors.brand : "transparent",
              color: active ? "#fff" : colors.inkSoft,
              fontWeight: "700",
              fontSize: 12,
              textTransform: "capitalize",
              overflow: "hidden",
            }}
          >
            {o}
          </Text>
        );
      })}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Text
      onPress={onPress}
      style={{
        borderWidth: active ? 0 : 1,
        borderColor: colors.line,
        backgroundColor: active ? colors.brand : colors.surface,
        color: active ? "#fff" : colors.inkSoft,
        borderRadius: radius.pill,
        paddingHorizontal: 12,
        paddingVertical: 6,
        fontSize: 12,
        fontWeight: "700",
        overflow: "hidden",
      }}
    >
      {label}
    </Text>
  );
}

export function ScreenHeader({ onSignOut }: { onSignOut: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TallyMark size={28} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>tally</Text>
      </View>
      <Text onPress={onSignOut} style={{ color: colors.inkSoft, fontSize: 14, fontWeight: "600" }}>
        Sign out
      </Text>
    </View>
  );
}

export function Eyebrow({ children, color }: { children: ReactNode; color?: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        letterSpacing: 0.8,
        textTransform: "uppercase",
        fontWeight: "700",
        color: color ?? colors.inkMuted,
      }}
    >
      {children}
    </Text>
  );
}
