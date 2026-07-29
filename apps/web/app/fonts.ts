import { Fraunces, Inter } from "next/font/google";

// Display serif for headings and big numbers (warm, editorial — matches the
// Guild reference). Body sans for everything else.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
