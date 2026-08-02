import { SessionProvider } from "@/lib/session-context";
import { AppShell } from "@/components/shell";

// Shared chrome for every authenticated page: resolve the session once, then
// render the role-aware shell around whatever page is active. Individual pages
// are pure content — no shell wiring, no identity refetch.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AppShell>{children}</AppShell>
    </SessionProvider>
  );
}
