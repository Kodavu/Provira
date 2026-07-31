import type { NotificationCategory, NotificationChannel } from "@tally/db";

/**
 * The catalog of notification event types. Each event declares its category
 * (which decides whether a user can opt out) and the channels it may use, in
 * priority order. The router intersects `channels` with what the user has
 * enabled and what's actually deliverable to them. `defaults` is the fallback
 * content used when no active NotificationTemplate row exists for the event.
 */
export interface NotificationEvent {
  category: NotificationCategory;
  channels: NotificationChannel[];
  defaults: { title?: string; body: string };
}

export const EVENTS: Record<string, NotificationEvent> = {
  "dispute.replied": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "PUSH"],
    defaults: { title: "New reply on your case", body: "Support replied on {code}: {preview}" },
  },
  "dispute.resolved": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "PUSH"],
    defaults: { title: "Your case was resolved", body: "Your case {code} has been resolved." },
  },
  "payout.sent": {
    category: "TRANSACTIONAL",
    channels: ["INAPP", "SMS", "PUSH"],
    defaults: { title: "Payment sent", body: "{amount} has been sent to your account." },
  },
  "job.offer": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "WHATSAPP", "PUSH"],
    defaults: { title: "New job near you", body: "{title} pays {pay} at {location}. Open Tally to accept." },
  },
  "otp.code": {
    category: "SECURITY",
    channels: ["SMS"],
    defaults: { body: "Your Tally code is {code}. It expires in 5 minutes." },
  },
};

export function eventDef(eventKey: string): NotificationEvent | undefined {
  return EVENTS[eventKey];
}

export interface EventCatalogEntry extends NotificationEvent {
  eventKey: string;
}

/** The full catalog, for the admin template editor to render every editable slot. */
export function listEvents(): EventCatalogEntry[] {
  return Object.entries(EVENTS).map(([eventKey, e]) => ({ eventKey, ...e }));
}
