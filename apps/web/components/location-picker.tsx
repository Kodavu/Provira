"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export interface LocationValue {
  state: string;
  area: string; // LGA
  ward: string;
}

const sel =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:opacity-50";

// Cascading State → LGA → Ward selects backed by the /geo API. Choosing a state
// loads its LGAs; choosing an LGA loads its wards. Clears downstream selections
// when a parent changes so the value stays consistent.
export function LocationPicker({
  value,
  onChange,
  wardOptional = true,
}: {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
  wardOptional?: boolean;
}) {
  const [states, setStates] = useState<string[]>([]);
  const [lgas, setLgas] = useState<string[]>([]);
  const [wards, setWards] = useState<string[]>([]);

  useEffect(() => {
    api.geoStates().then(setStates).catch(() => setStates([]));
  }, []);

  useEffect(() => {
    if (!value.state) { setLgas([]); return; }
    api.geoLgas(value.state).then(setLgas).catch(() => setLgas([]));
  }, [value.state]);

  useEffect(() => {
    if (!value.state || !value.area) { setWards([]); return; }
    api.geoWards(value.state, value.area).then(setWards).catch(() => setWards([]));
  }, [value.state, value.area]);

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">State</span>
        <select
          className={sel}
          value={value.state}
          onChange={(e) => onChange({ state: e.target.value, area: "", ward: "" })}
        >
          <option value="">Select state…</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">LGA</span>
        <select
          className={sel}
          value={value.area}
          disabled={!value.state}
          onChange={(e) => onChange({ ...value, area: e.target.value, ward: "" })}
        >
          <option value="">{value.state ? "Select LGA…" : "Pick a state first"}</option>
          {lgas.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-ink-soft">
          Ward{wardOptional ? " (optional)" : ""}
        </span>
        <select
          className={sel}
          value={value.ward}
          disabled={!value.area}
          onChange={(e) => onChange({ ...value, ward: e.target.value })}
        >
          <option value="">{value.area ? "Select ward…" : "Pick an LGA first"}</option>
          {wards.map((w) => <option key={w} value={w}>{w}</option>)}
        </select>
      </label>
    </div>
  );
}
