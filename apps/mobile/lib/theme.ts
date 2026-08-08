// Shared design tokens, mirroring the web brand (indigo + gold on slate).
export const colors = {
  canvas: "#f8fafc",
  surface: "#ffffff",
  ink: "#0f172a",
  inkSoft: "#475569",
  inkMuted: "#94a3b8",
  line: "#e2e8f0",
  brand: "#3d3bf3",
  brandDark: "#2725b0",
  brand50: "#eef0fe",
  brand700: "#2725b0",
  gold: "#f5b301",
  gold50: "#fef7e6",
  gold700: "#a67600",
  success: "#16a34a",
  error: "#dc2626",
};

export const radius = { md: 12, lg: 16, xl: 20, pill: 999 };
export const space = (n: number) => n * 4;

const TIER_STYLE: Record<string, { bg: string; fg: string }> = {
  BUILDING: { bg: colors.canvas, fg: colors.inkSoft },
  EMERGING: { bg: colors.gold50, fg: colors.gold700 },
  TRUSTED: { bg: colors.brand50, fg: colors.brand700 },
  ESTABLISHED: { bg: colors.brand, fg: "#ffffff" },
};
export const tierStyle = (t: string) => TIER_STYLE[t] ?? TIER_STYLE.BUILDING;

// Shared with web + admin via the api-client package.
export { formatNaira } from "@provira/api-client";
