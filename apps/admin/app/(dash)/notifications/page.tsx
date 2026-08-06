import { adminFetch, Me } from "@/lib/admin-api";
import { PageHeader, EmptyState } from "@/components/ui";
import { TemplateManager } from "@/components/template-manager";
import { BroadcastComposer } from "@/components/broadcast-composer";

type Channel = "INAPP" | "EMAIL" | "SMS" | "WHATSAPP" | "IVR" | "PUSH";
type Language = "EN" | "PCM" | "YO" | "HA" | "IG";

interface TemplatesData {
  events: Array<{
    eventKey: string;
    category: "SECURITY" | "TRANSACTIONAL" | "ACTIVITY" | "MARKETING";
    channels: Channel[];
    defaults: { title?: string; body: string };
  }>;
  languages: Language[];
  templates: Array<{
    id: string;
    eventKey: string;
    channel: Channel;
    language: Language;
    subject: string | null;
    body: string;
    isActive: boolean;
  }>;
}

export default async function NotificationsPage() {
  const [data, me] = await Promise.all([
    adminFetch<TemplatesData>("/admin/notification-templates"),
    adminFetch<Me>("/admin/me"),
  ]);
  if (!data || !me) return <EmptyState>You don&apos;t have access to notification templates.</EmptyState>;

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Send one-off broadcasts and edit the templates users receive per event, channel, and language. Empty slots fall back to English, then the built-in default. Every change is audited."
      />
      <div className="mb-8">
        <BroadcastComposer />
      </div>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Templates</h2>
      <TemplateManager events={data.events} languages={data.languages} templates={data.templates} />
    </>
  );
}
