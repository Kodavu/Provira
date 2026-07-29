import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tally — Economic identity for the informal economy",
  description:
    "Turn informal work, sales, and payments into a verifiable record that builds a reliability score — unlocking loans and better jobs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-neutral-900">{children}</body>
    </html>
  );
}
