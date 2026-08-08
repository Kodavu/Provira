import { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { colors, radius, tierStyle } from "@/lib/theme";

// Circular progress ring (score dial).
export function Ring({
  pct,
  size = 132,
  children,
}: {
  pct: number;
  size?: number;
  children?: ReactNode;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute", transform: [{ rotate: "-90deg" }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.brand}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c - (clamped / 100) * c}
        />
      </Svg>
      <View style={{ alignItems: "center" }}>{children}</View>
    </View>
  );
}

// Back header row for sub-screens.
export function BackHeader({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      <Text onPress={onBack} accessibilityLabel="Back" style={{ fontSize: 26, color: colors.ink, paddingRight: 4 }}>
        ‹
      </Text>
      <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>{title}</Text>
    </View>
  );
}

// Provira logomark: a confident checkmark whose rising arm carries a gold tip —
// "verified, and rising". White on the brand badge; two-tone when unboxed.
export function ProviraMark({ size = 28, boxed = true }: { size?: number; boxed?: boolean }) {
  const s = boxed ? size * 0.58 : size;
  const mark = (
    <Svg width={s} height={s} viewBox="0 0 24 24">
      <Path
        d="M4.5 12.6 L10 17.8 L14.8 11.7"
        fill="none"
        stroke={boxed ? "#ffffff" : colors.brand}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14.8 11.7 L20 5.4"
        fill="none"
        stroke={colors.gold}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
        <ProviraMark size={28} />
        <Text style={{ fontSize: 20, fontWeight: "800", color: colors.ink }}>provira</Text>
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
