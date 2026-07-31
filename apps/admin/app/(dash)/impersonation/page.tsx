import { adminFetch, Me } from "@/lib/admin-api";
import { PageHeader, EmptyState } from "@/components/ui";
import { ImpersonationApprovals } from "@/components/impersonation-approvals";
import { ImpersonationGrants, Grant } from "@/components/impersonation-grants";
import { ImpersonationView, ViewData } from "@/components/impersonation-view";

interface Pending {
  id: string;
  mode: "READ" | "WRITE";
  reason: string;
  createdAt: string;
  requestedBy: { fullName: string } | null;
  targetUser: { fullName: string | null; phone: string } | null;
}

export default async function ImpersonationPage({ searchParams }: { searchParams: { session?: string } }) {
  const me = await adminFetch<Me>("/admin/me");
  if (!me) return <EmptyState>Couldn&apos;t load your access.</EmptyState>;
  const canRequest = me.permissions.includes("impersonation:request");
  const canApprove = me.permissions.includes("impersonation:approve");

  const [pending, mine, session] = await Promise.all([
    canApprove ? adminFetch<Pending[]>("/admin/impersonation/pending") : Promise.resolve(null),
    canRequest ? adminFetch<Grant[]>("/admin/impersonation/mine") : Promise.resolve(null),
    searchParams.session && canRequest
      ? adminFetch<ViewData>(`/admin/impersonation/${searchParams.session}/view`)
      : Promise.resolve(null),
  ]);

  return (
    <>
      <PageHeader
        title="Impersonation"
        subtitle="View a user's account for support. Acting as a user needs a second admin's approval; every session is time-boxed and audited."
      />

      {searchParams.session && (
        session ? (
          <div className="mb-8">
            <ImpersonationView data={session} />
          </div>
        ) : (
          <EmptyState>That session has expired or isn&apos;t available. Request access again below.</EmptyState>
        )
      )}

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
