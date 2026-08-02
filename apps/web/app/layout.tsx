import type { Metadata } from "next";
import { Toaster } from "sonner";
import { inter } from "./fonts";
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
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: "rounded-xl border border-line",
            },
          }}
        />
      </body>
    </html>
  );
}
