"use client";

import { useTranslations } from "next-intl";
import { PERSONAS, type PersonaId } from "./personas";

// Shared audience tab row for content sections (How it works, FAQ, showcase).
// Kept free of shared-layout animation so multiple instances never collide.
export function PersonaTabs({
  active,
  onChange,
  label,
}: {
  active: PersonaId;
  onChange: (id: PersonaId) => void;
  label: string;
}) {
  const tp = useTranslations("Personas");
  return (
    <div className="flex justify-center">
      <div role="tablist" aria-label={label} className="inline-flex flex-wrap items-center justify-center gap-1 rounded-2xl border border-line bg-white p-1.5 shadow-card">
        {PERSONAS.map((p) => {
          const isActive = p.id === active;
          const Icon = p.icon;
          return (
            <button
              key={p.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(p.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                isActive ? p.accent.tabActive : "text-ink-soft hover:bg-canvas hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.9} />
              {tp(`${p.id}.label`)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
