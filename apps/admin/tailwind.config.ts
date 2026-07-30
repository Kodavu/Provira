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
          400: "#7b79f5",
          500: "#3d3bf3",
          600: "#2e2cdb",
          700: "#2725b0",
        },
      },
    },
  },
  plugins: [],
};

export default config;
