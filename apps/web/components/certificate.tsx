"use client";

// A formal, print-to-PDF "proof of work / trade" certificate. Rendered on screen
// as an A4-styled document; "Download PDF" opens the browser print dialog scoped
// (via the .print-area rules in globals.css) to just this document, which the
// user saves as a clean, presentable PDF.
//
// Credibility comes from *verifiability*: every record carries an issue date, a
// stable reference code, and a live verification URL (the holder's public
// profile) so a bank, landlord, or new employer can independently confirm it.

import { useMemo } from "react";
import { Printer, ShieldCheck } from "lucide-react";
import { ProviraMark } from "@/components/ui";

// Stable, human-readable reference derived from the holder id (no PII).
function refCode(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return "PRV-" + (h >>> 0).toString(36).toUpperCase().padStart(7, "0").slice(0, 7);
}

function maskPhone(phone?: string | null): string | null {
  if (!phone) return null;
  const d = phone.replace(/\s/g, "");
  return d.length > 5 ? `${d.slice(0, 4)}••••${d.slice(-2)}` : phone;
}

export interface CertMetric {
  label: string;
  value: string;
}
export interface CertRow {
  cells: string[];
}

export function Certificate({
  title,
  holderId,
  holderName,
  subtitle,
  phone,
  location,
  memberSince,
  score,
  metrics,
  table,
  verifyUrl,
  statement,
}: {
  title: string;
  holderId: string;
  holderName: string;
  subtitle?: string | null;
  phone?: string | null;
  location?: string | null;
  memberSince?: string | null;
  score?: { value: number; tier: string } | null;
  metrics: CertMetric[];
  table?: { columns: string[]; rows: CertRow[] } | null;
  verifyUrl: string;
  statement: string;
}) {
  const ref = useMemo(() => refCode(holderId), [holderId]);
  const issued = new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const masked = maskPhone(phone);

  return (
    <div>
      {/* Toolbar — hidden when printing */}
      <div className="no-print mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">Preview — download a shareable PDF to present anywhere.</p>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          <Printer className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* The document */}
      <div className="print-area mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        {/* Brand bar */}
        <div className="flex items-center justify-between gap-4 border-b border-line bg-gradient-to-r from-brand-600 to-indigo-700 px-8 py-6 text-white">
          <div className="flex items-center gap-3">
            <ProviraMark className="h-11 w-11" />
            <div>
              <p className="text-lg font-bold leading-none tracking-tight">Provira</p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/70">Verified record</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-[0.15em] text-white/70">Issued</p>
            <p className="text-sm font-semibold">{issued}</p>
          </div>
        </div>

        <div className="px-8 py-7">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-emerald-700">
            <ShieldCheck className="h-4 w-4" /> {statement}
          </p>

          {/* Holder */}
          <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-y border-line py-5">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">Issued to</p>
              <p className="text-xl font-semibold text-ink">{holderName}</p>
              <p className="text-sm text-ink-soft">
                {[subtitle, location, masked].filter(Boolean).join(" · ")}
              </p>
              {memberSince && (
                <p className="mt-0.5 text-xs text-ink-muted">
                  Member since {new Date(memberSince).toLocaleDateString("en-NG", { month: "long", year: "numeric" })}
                </p>
              )}
            </div>
            {score && (
              <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-2.5 text-center">
                <p className="text-[11px] uppercase tracking-wide text-brand-700">Provira Score</p>
                <p className="text-2xl font-bold tabular-nums text-brand-800">{score.value}</p>
                <p className="text-[11px] font-medium text-brand-700">{score.tier} tier</p>
              </div>
            )}
          </div>

          {/* Verified metrics */}
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-xs uppercase tracking-wide text-ink-muted">{m.label}</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums text-ink">{m.value}</p>
              </div>
            ))}
          </div>

          {/* Optional history table */}
          {table && table.rows.length > 0 && (
            <div className="mt-7">
              <p className="mb-2 text-sm font-semibold text-ink">History</p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-muted">
                    {table.columns.map((c) => (
                      <th key={c} className="py-2 pr-3 font-medium">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((r, i) => (
                    <tr key={i} className="border-b border-line/60">
                      {r.cells.map((cell, j) => (
                        <td key={j} className={`py-2 pr-3 ${j === 0 ? "font-medium text-ink" : "text-ink-soft"}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Verification block */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-dashed border-brand-200 bg-brand-50/40 px-5 py-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-ink-muted">Reference</p>
              <p className="font-mono text-sm font-semibold text-ink">{ref}</p>
            </div>
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Verify this record</p>
              <p className="truncate text-sm font-medium text-brand-700">{verifyUrl.replace(/^https?:\/\//, "")}</p>
            </div>
          </div>

          <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
            This record is generated by Provira from verified, escrow-backed transactions and cannot be self-edited.
            Confirm its authenticity at the verification link above using reference {ref}. Issued {issued}.
          </p>
        </div>
      </div>
    </div>
  );
}
