import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
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
        // Warm gold accent, matching the user app (money & score moments).
        gold: {
          50: "#fef7e6",
          100: "#fdecc2",
          200: "#fbdd8f",
          500: "#f5b301",
          600: "#d99a00",
          700: "#a67600",
        },
      },
    },
  },
  plugins: [],
};

export default config;
