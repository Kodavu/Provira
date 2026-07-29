import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        // Warm cream canvas + white surfaces (Guild-style).
        canvas: "#faf9f4",
        surface: "#ffffff",
        ink: {
          DEFAULT: "#1a211c",
          soft: "#4b524c",
          muted: "#8a8f89",
        },
        line: "#ece9e1",
        brand: {
          50: "#eef5ef",
          100: "#dcecdf",
          200: "#bcdac2",
          500: "#1f9d55",
          600: "#188046",
          700: "#146639",
          800: "#124e2d",
          900: "#0f3d24",
        },
        // Warm terracotta used for the headline score number.
        ember: "#c65b3d",
        accent: "#e0912f",
      },
      borderRadius: {
        xl: "0.85rem",
        "2xl": "1.15rem",
        "3xl": "1.6rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 30, 24, 0.04), 0 1px 12px rgba(20, 30, 24, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;
