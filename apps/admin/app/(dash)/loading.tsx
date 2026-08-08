import { ProviraMark } from "@/components/ui";

// Shown instantly in the content area while the next page's data loads, so a
// navigation never looks like nothing happened. Mirrors the page header +
// content rhythm so the swap feels like the real page settling in.
export default function DashLoading() {
  return (
    <div className="animate-pulse">
      <div aria-hidden className="mb-5">
        <ProviraMark className="h-9 w-9" />
      </div>
      <div className="mb-7 rounded-3xl border border-app surface p-6">
        <div className="h-5 w-40 rounded-full bg-slate-200/70 dark:bg-white/10" />
        <div className="mt-3 h-9 w-64 rounded-xl bg-slate-200/80 dark:bg-white/10" />
        <div className="mt-2 h-4 w-80 max-w-full rounded bg-slate-200/60 dark:bg-white/5" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-app surface p-5">
            <div className="h-3 w-20 rounded bg-slate-200/70 dark:bg-white/10" />
            <div className="mt-3 h-8 w-24 rounded-lg bg-slate-200/80 dark:bg-white/10" />
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-3 rounded-2xl border border-app surface p-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-1/2 rounded bg-slate-200/70 dark:bg-white/10" />
            <div className="h-4 w-16 rounded bg-slate-200/50 dark:bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
