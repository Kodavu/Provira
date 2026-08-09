"use client";

// Lightweight, dependency-free chart primitives (SVG + framer-motion). Built for
// the Provira palette, responsive, and respectful of prefers-reduced-motion.
// Used by the employer reports page and overview.

import { useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { formatNaira } from "@/components/ui";

const BRAND = "#3d3bf3";
const BRAND_DEEP = "#2e2cdb";
const GOLD = "#f5b301";
const EASE = [0.22, 1, 0.36, 1] as const;

// Palette for categorical series (donut / bars).
export const SERIES = ["#3d3bf3", "#f5b301", "#10b981", "#f97316", "#8b5cf6", "#ec4899", "#0ea5e9", "#64748b"];

/* --------------------------------- Area line -------------------------------- */

export function AreaChart({
  data,
  height = 160,
  money = false,
  className = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  money?: boolean;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const gid = useId();
  const w = 100; // viewBox width units; SVG scales to container
  const h = height;
  const pad = 6;
  const values = data.map((d) => d.value);
  const max = Math.max(1, ...values);
  const stepX = data.length > 1 ? (w - pad * 2) / (data.length - 1) : 0;
  const x = (i: number) => pad + i * stepX;
  const y = (v: number) => h - pad - (v / max) * (h - pad * 2);

  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(d.value).toFixed(2)}`).join(" ");
  const area = `${line} L${x(data.length - 1).toFixed(2)} ${h - pad} L${x(0).toFixed(2)} ${h - pad} Z`;
  const last = data[data.length - 1];
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className={className}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-40 w-full" role="img">
        <defs>
          <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={BRAND} stopOpacity="0.28" />
            <stop offset="1" stopColor={BRAND} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={area}
          fill={`url(#fill-${gid})`}
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
        <motion.path
          d={line}
          fill="none"
          stroke={BRAND_DEEP}
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: EASE }}
        />
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
        <span>{data[0]?.label}</span>
        <span className="font-medium text-ink-soft">
          {money ? formatNaira(String(total)) : total.toLocaleString("en-NG")} total
          {last ? ` · latest ${money ? formatNaira(String(last.value)) : last.value}` : ""}
        </span>
        <span>{last?.label}</span>
      </div>
    </div>
  );
}

/* --------------------------------- Bar list --------------------------------- */

export function BarList({
  items,
  money = false,
  color = BRAND,
  className = "",
}: {
  items: { label: string; value: number; sub?: string; avatarUrl?: string | null }[];
  money?: boolean;
  color?: string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...items.map((i) => i.value));
  if (!items.length) return <p className="text-sm text-ink-muted">No data yet.</p>;
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((it, idx) => (
        <div key={it.label + idx} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="flex min-w-0 items-center gap-2">
              {it.avatarUrl !== undefined && (
                <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">
                  {it.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={it.avatarUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    it.label.slice(0, 1).toUpperCase()
                  )}
                </span>
              )}
              <span className="truncate font-medium text-ink">{it.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-ink-soft">
              {money ? formatNaira(String(it.value)) : it.value.toLocaleString("en-NG")}
              {it.sub ? <span className="ml-1 text-ink-muted">{it.sub}</span> : null}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-canvas">
            <motion.div
              className="h-full rounded-full"
              style={{ background: color }}
              initial={reduce ? { width: `${(it.value / max) * 100}%` } : { width: 0 }}
              animate={{ width: `${(it.value / max) * 100}%` }}
              transition={{ duration: 0.8, ease: EASE, delay: idx * 0.05 }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------- Donut ----------------------------------- */

export function Donut({
  segments,
  size = 168,
  thickness = 20,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color?: string }[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const reduce = useReducedMotion();
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex items-center gap-5">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#eef2f7" strokeWidth={thickness} />
          {total > 0 &&
            segments.map((seg, i) => {
              const frac = seg.value / total;
              const dash = frac * c;
              const el = (
                <motion.circle
                  key={seg.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  fill="none"
                  stroke={seg.color ?? SERIES[i % SERIES.length]}
                  strokeWidth={thickness}
                  strokeLinecap="butt"
                  strokeDasharray={`${dash} ${c - dash}`}
                  strokeDashoffset={-offset}
                  initial={reduce ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                />
              );
              offset += dash;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-2xl font-bold tracking-tight text-ink">{centerValue ?? total}</span>
          {centerLabel && <span className="text-xs text-ink-muted">{centerLabel}</span>}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
        {segments.map((seg, i) => (
          <li key={seg.label} className="flex items-center justify-between gap-2">
            <span className="flex min-w-0 items-center gap-2">
              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: seg.color ?? SERIES[i % SERIES.length] }} />
              <span className="truncate text-ink-soft">{seg.label}</span>
            </span>
            <span className="tabular-nums text-ink">{seg.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------- Funnel ---------------------------------- */

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const reduce = useReducedMotion();
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const pct = (s.value / max) * 100;
        const conv = i > 0 && steps[i - 1].value > 0 ? Math.round((s.value / steps[i - 1].value) * 100) : null;
        return (
          <div key={s.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-ink-soft">{s.label}</span>
              <span className="tabular-nums font-medium text-ink">
                {s.value}
                {conv != null && <span className="ml-2 text-xs font-normal text-ink-muted">{conv}%</span>}
              </span>
            </div>
            <div className="h-7 overflow-hidden rounded-lg bg-canvas">
              <motion.div
                className="h-full rounded-lg"
                style={{ background: `linear-gradient(90deg, ${BRAND_DEEP}, ${i === steps.length - 1 ? GOLD : BRAND})` }}
                initial={reduce ? { width: `${pct}%` } : { width: 0 }}
                animate={{ width: `${Math.max(6, pct)}%` }}
                transition={{ duration: 0.8, ease: EASE, delay: i * 0.08 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
