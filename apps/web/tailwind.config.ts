import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Inter everywhere (brief: General Sans/Inter). `display` kept as an
        // alias so existing font-display headings render Inter, tighter.
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        // Slate canvas + white surfaces.
        canvas: "#f8fafc",
        surface: "#ffffff",
        ink: {
          DEFAULT: "#0f172a",
          soft: "#475569",
          muted: "#94a3b8",
        },
        line: "#e2e8f0",
        // Primary: indigo — actions, nav, links, logo.
        brand: {
          50: "#eef0fe",
          100: "#e0e1fd",
          200: "#c7c8fb",
          300: "#a3a3f8",
          400: "#7b79f5",
          500: "#3d3bf3",
          600: "#2e2cdb",
          700: "#2725b0",
          800: "#22218c",
          900: "#1f1e70",
        },
        // Accent: warm gold — money & score moments only.
        gold: {
          50: "#fef7e6",
          100: "#fdecc2",
          200: "#fbdd8f",
          500: "#f5b301",
          600: "#d99a00",
          700: "#a67600",
        },
        accent: "#f5b301",
        success: "#16a34a",
        warning: "#d97706",
        error: "#dc2626",
      },
      borderRadius: {
        xl: "0.75rem", // 12px per brief
        "2xl": "1rem",
        "3xl": "1.4rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 10px rgba(15, 23, 42, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
