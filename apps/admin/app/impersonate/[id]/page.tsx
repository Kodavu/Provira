import { adminFetch } from "@/lib/admin-api";
import { ImpersonationWindow, type ViewData } from "@/components/impersonation-window";

// Standalone, full-screen impersonation window (opened in a new tab). It sits
// OUTSIDE the (dash) admin chrome so it reads as the user's own app. Driven by
// the audited, time-boxed grant session on the API.
export default async function ImpersonateWindowPage({ params }: { params: { id: string } }) {
  const data = await adminFetch<ViewData>(`/admin/impersonation/${params.id}/view`);
  if (!data) {
    return (
      <div style={{ colorScheme: "light" }} className="grid min-h-screen place-items-center bg-[#f8fafc] p-6 text-center">
        <div>
          <p className="font-semibold text-slate-900">Session unavailable</p>
          <p className="mt-1 text-sm text-slate-500">This impersonation session has expired or isn&apos;t yours. Close this window and start a new one.</p>
        </div>
      </div>
    );
  }
  return <ImpersonationWindow data={data} />;
}
