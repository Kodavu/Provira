"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { NavItem } from "@/lib/nav";

// Minimal command palette (Ctrl/Cmd-K). Filters the admin's visible nav.
export function CommandPalette({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    // expose an opener for the topbar search button
    (window as any).__openPalette = () => setOpen(true);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;
  const filtered = items.filter((i) => i.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh]" onClick={() => setOpen(false)}>
      <div className="surface w-full max-w-lg overflow-hidden rounded-xl border shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Jump to…"
          className="w-full bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-[color:var(--text-muted)]"
        />
        <div className="max-h-72 overflow-y-auto border-t border-app py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted">No matches</p>
          ) : (
            filtered.map((i) => (
              <button
                key={i.href}
                onClick={() => {
                  setOpen(false);
                  router.push(i.href as never);
                }}
                className="block w-full px-4 py-2.5 text-left text-sm hover:bg-app"
              >
                {i.label}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
