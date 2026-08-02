import { adminFetch, Me } from "@/lib/admin-api";
import { PageHeader, EmptyState } from "@/components/ui";
import { ImpersonationApprovals } from "@/components/impersonation-approvals";
import { ImpersonationGrants, Grant } from "@/components/impersonation-grants";

interface Pending {
  id: string;
  mode: "READ" | "WRITE";
  reason: string;
  createdAt: string;
  requestedBy: { fullName: string } | null;
  targetUser: { fullName: string | null; phone: string } | null;
}

export default async function ImpersonationPage() {
  const me = await adminFetch<Me>("/admin/me");
  if (!me) return <EmptyState>Couldn&apos;t load your access.</EmptyState>;
  const canRequest = me.permissions.includes("impersonation:request");
  const canApprove = me.permissions.includes("impersonation:approve");

  const [pending, mine] = await Promise.all([
    canApprove ? adminFetch<Pending[]>("/admin/impersonation/pending") : Promise.resolve(null),
    canRequest ? adminFetch<Grant[]>("/admin/impersonation/mine") : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        title="Impersonation"
        subtitle="View a user's account for support in a new window. Acting as a user needs a second admin's approval; every session is time-boxed and audited."
      />

      {canApprove && (
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Approvals</h2>
          <ImpersonationApprovals pending={pending ?? []} />
        </section>
      )}

      {canRequest && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your access</h2>
          <ImpersonationGrants grants={mine ?? []} />
        </section>
      )}

      {!canRequest && !canApprove && <EmptyState>You don&apos;t have impersonation access.</EmptyState>}
    </>
  );
}
