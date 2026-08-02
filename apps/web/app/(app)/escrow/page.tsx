"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Wallet } from "lucide-react";
import { api, type EmployerDashboard } from "@/lib/api";
import { useSession } from "@/lib/session-context";
import { usePageData } from "@/lib/use-page-data";
import { Button, Card, Kpi, Pill, SectionHeader, formatNaira } from "@/components/ui";
import { PageHeader, PageError, PageSkeleton, EmptyPanel } from "@/components/page";
import { CountUp, CountUpNaira, Stagger, StaggerItem } from "@/components/motion";

export default function EscrowPage() {
  const { activeRole } = useSession();
  const router = useRouter();
  const { data, error, reload } = usePageData<EmployerDashboard>((id) => api.employerDashboard(id));

  if (activeRole !== "EMPLOYER") {
    router.replace("/overview");
    return null;
  }
  if (error) return <PageError message={error} onRetry={reload} />;
  if (!data) return <PageSkeleton />;

  const withEscrow = data.jobs.filter((j) => j.escrow);
  const awaiting = withEscrow.filter((j) => j.escrow && !j.escrow.funded);
  const funded = withEscrow.filter((j) => j.escrow?.funded && !j.escrow.released);
  const released = withEscrow.filter((j) => j.escrow?.released);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Escrow"
        subtitle="Money you've committed to shifts. Funds stay held until a worker confirms attendance — then they're released."
      />

      <Stagger className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StaggerItem><Kpi icon={<Banknote className="h-4 w-4" />} label="In escrow" value={<CountUpNaira amount={data.stats.committed} />} caption="Funded, awaiting release." accent="amber" /></StaggerItem>
        <StaggerItem><Kpi icon={<Wallet className="h-4 w-4" />} label="Released" value={<CountUpNaira amount={data.stats.released} />} caption="Paid out to workers." /></StaggerItem>
        <StaggerItem><Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Needs funding" value={<CountUp value={awaiting.length} />} caption="Jobs awaiting escrow." accent="neutral" /></StaggerItem>
      </Stagger>

      {withEscrow.length === 0 ? (
        <EmptyPanel icon={Banknote} title="No escrow yet" body="Post and publish a job to create its escrow account." />
      ) : (
        <>
          <EscrowSection title="Awaiting funding" jobs={awaiting} onChange={reload} fundable />
          <EscrowSection title="Funded — held" jobs={funded} onChange={reload} />
          <EscrowSection title="Released" jobs={released} onChange={reload} />
        </>
      )}
    </div>
  );
}

function EscrowSection({
  title,
  jobs,
  onChange,
  fundable = false,
}: {
  title: string;
  jobs: EmployerDashboard["jobs"];
  onChange: () => void;
  fundable?: boolean;
}) {
  if (jobs.length === 0) return null;
  return (
    <section>
      <SectionHeader title={title} />
      <Card className="divide-y divide-line p-0">
        <Stagger>
          {jobs.map((j) => (
            <StaggerItem key={j.id}>
              <EscrowRow job={j} onChange={onChange} fundable={fundable} />
            </StaggerItem>
          ))}
        </Stagger>
      </Card>
    </section>
  );
}

function EscrowRow({
  job,
  onChange,
  fundable,
}: {
  job: EmployerDashboard["jobs"][number];
  onChange: () => void;
  fundable: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const escrow = job.escrow!;

  async function fund() {
    setBusy(true);
    try {
      await api.fundJob(job.id);
      toast.success("Escrow funded", { description: `${job.title} · ${formatNaira(escrow.amount)} secured.` });
      onChange();
    } catch (e) {
      toast.error("Funding failed", { description: (e as Error).message.replace(/^API \d+:\s*/, "") });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
      <div>
        <p className="font-semibold text-ink">{job.title}</p>
        <p className="text-sm text-ink-muted">{formatNaira(escrow.amount)} · {job.location ?? "Lagos"}</p>
      </div>
      {escrow.released ? (
        <Pill tone="green">Released</Pill>
      ) : fundable ? (
        <Button size="sm" onClick={fund} disabled={busy}>
          {busy ? "Funding…" : `Fund · ${formatNaira(escrow.amount)}`}
        </Button>
      ) : (
        <Pill tone="green">Funded · held</Pill>
      )}
    </div>
  );
}
