import { redirect } from "next/navigation";
import { adminFetch, Me } from "@/lib/admin-api";
import { AdminShell } from "@/components/shell";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const me = await adminFetch<Me>("/admin/me");
  if (!me) redirect("/login");
  return <AdminShell me={me}>{children}</AdminShell>;
}
