import Link from "next/link";
import { adminFetch, Me } from "@/lib/admin-api";
import { Badge, Card, EmptyState } from "@/components/ui";
import { VerificationActions } from "@/components/verification-actions";

interface Detail {
  id: string;
  requestedLevel: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  hasBvn: boolean;
  decisionReason: string | null;
  createdAt: string;
  decidedAt: string | null;
  user: { id: string; fullName: string | null; phone: string; email: string | null; kycLevel: string; status: string } | null;
  documents: Array<{ id: string; type: string; label: string; url: string }>;
}

const LEVEL_LABEL: Record<string, string> = { NONE: "None", BASIC: "Basic", BVN_VERIFIED: "BVN verified", FULL: "Full" };
const STATUS_TONE: Record<string, "neutral" | "amber" | "green" | "red"> = {
  PENDING: "amber", APPROVED: "green", REJECTED: "red",
};
const prettyType = (t: string) => t.replace(/_/g, " ").toLowerCase();
const when = (iso: string) => new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });

export default async function VerificationDetailPage({ params }: { params: { id: string } }) {
  const [d, me] = await Promise.all([
    adminFetch<Detail>(`/admin/verification/${params.id}`),
    adminFetch<Me>("/admin/me"),
  ]);
  if (!d || !me) return <EmptyState>Couldn&apos;t load this request.</EmptyState>;
  const p = new Set(me.permissions);
  const decided = d.status !== "PENDING";

  return (
    <>
      <Link href="/verification" className="text-sm text-soft hover:text-[color:var(--text)]">&larr; All verifications</Link>
      <div className="mb-6 mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{d.user?.fullName ?? "User"}</h1>
            <Badge tone={STATUS_TONE[d.status]}>{d.status.toLowerCase()}</Badge>
          </div>
          <p className="mt-1 text-sm text-soft">
            Requesting <span className="font-medium">{LEVEL_LABEL[d.requestedLevel] ?? d.requestedLevel}</span> · currently {LEVEL_LABEL[d.user?.kycLevel ?? "NONE"]}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Phone" value={d.user?.phone ?? "—"} mono />
            <Field label="Email" value={d.user?.email ?? "—"} />
            <Field label="Account status" value={(d.user?.status ?? "").toLowerCase()} />
            <Field label="BVN / NIN" value={d.hasBvn ? "Provided (hashed)" : "Not provided"} />
          </Card>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Documents</h2>
            {d.documents.length === 0 ? (
              <EmptyState>No documents attached.</EmptyState>
            ) : (
              <Card className="divide-y divide-[color:var(--border)]">
                {d.documents.map((doc) => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between px-4 py-3 text-sm hover:bg-app">
                    <span>
                      <span className="font-medium">{doc.label}</span>
                      <span className="ml-2 text-xs text-muted">{prettyType(doc.type)}</span>
                    </span>
                    <span className="text-xs text-brand-500">Open</span>
                  </a>
                ))}
              </Card>
            )}
          </div>

          {decided && d.decisionReason && (
            <Card className="p-5">
              <p className="eyebrow">Decision note</p>
              <p className="mt-1 text-sm text-soft">{d.decisionReason}</p>
            </Card>
          )}
        </div>

        <div>
          {decided ? (
            <Card className="p-5">
              <p className="text-sm">
                <Badge tone={STATUS_TONE[d.status]}>{d.status.toLowerCase()}</Badge>
              </p>
              {d.decidedAt && <p className="mt-2 text-xs text-muted">Decided {when(d.decidedAt)}</p>}
            </Card>
          ) : (
            <VerificationActions id={d.id} canApprove={p.has("verification:approve")} canReject={p.has("verification:reject")} />
          )}
          <p className="mt-3 text-center text-xs text-muted">Submitted {when(d.createdAt)}</p>
        </div>
      </div>
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className={`mt-1 font-medium ${mono ? "font-mono text-sm" : ""}`}>{value}</p>
    </div>
  );
}
