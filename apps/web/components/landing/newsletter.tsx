"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Newsletter() {
  const t = useTranslations("Footer");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError(t("newsletterInvalid"));
      return;
    }
    setError(null);
    setDone(true); // no backend list yet; this is the success state
  }

  if (done)
    return (
      <p className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
        {t("newsletterDone")}
      </p>
    );

  return (
    <form onSubmit={submit} noValidate>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("newsletterPlaceholder")}
          aria-label={t("newsletterEmailLabel")}
          aria-invalid={!!error}
          className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
        <button
          type="submit"
          className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t("newsletterSubmit")}
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
    </form>
  );
}
