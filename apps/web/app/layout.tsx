import type { Metadata } from "next";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { inter } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Truvo — Economic identity for the informal economy",
  description:
    "Turn informal work, sales, and payments into a verifiable record that builds a reliability score — unlocking loans and better jobs.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
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
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
