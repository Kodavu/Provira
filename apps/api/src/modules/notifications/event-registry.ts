import type { NotificationCategory, NotificationChannel } from "@provira/db";

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
  "escrow.funded": {
    category: "TRANSACTIONAL",
    channels: ["INAPP", "PUSH"],
    defaults: { title: "Escrow funded", body: "You funded {amount} for {title}. Workers can now be confirmed and paid." },
  },
  "earnings.credited": {
    category: "TRANSACTIONAL",
    channels: ["INAPP", "SMS", "PUSH"],
    defaults: { title: "Payment released", body: "{amount} for {title} is now in your Provira balance — withdraw anytime." },
  },
  "escrow.refunded": {
    category: "TRANSACTIONAL",
    channels: ["INAPP", "PUSH"],
    defaults: { title: "Escrow refunded", body: "{amount} from {title} was returned to your Provira balance." },
  },
  "withdrawal.requested": {
    category: "TRANSACTIONAL",
    channels: ["INAPP", "PUSH"],
    defaults: { title: "Withdrawal processing", body: "Your withdrawal of {amount} is being processed to your bank." },
  },
  "review.received": {
    category: "ACTIVITY",
    channels: ["INAPP", "PUSH"],
    defaults: { title: "You got a new review", body: "{stars} for {job}. See what they said on your profile." },
  },
  "job.offer": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "WHATSAPP", "PUSH"],
    defaults: { title: "New job near you", body: "{title} pays {pay} at {location}. Open Provira to accept." },
  },
  "job.invited": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "WHATSAPP", "PUSH"],
    defaults: { title: "You've been invited to a job", body: "{employer} invited you to {title} — {pay} per person. Open Provira to accept or decline." },
  },
  "job.application": {
    category: "ACTIVITY",
    channels: ["INAPP", "PUSH"],
    defaults: { title: "New applicant", body: "{worker} applied to {title}. Review and accept them in Provira." },
  },
  "job.invite.accepted": {
    category: "ACTIVITY",
    channels: ["INAPP", "PUSH"],
    defaults: { title: "Invite accepted", body: "{worker} accepted your invite to {title}." },
  },
  "job.hired": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "WHATSAPP", "PUSH"],
    defaults: { title: "You're hired!", body: "You're confirmed for {title}. The employer will give you your attendance code on site." },
  },
  "verification.approved": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "PUSH"],
    defaults: { title: "You're verified", body: "Your identity check passed. Your account is now {level}." },
  },
  "verification.rejected": {
    category: "ACTIVITY",
    channels: ["INAPP", "SMS", "PUSH"],
    defaults: { title: "Verification needs attention", body: "We couldn't verify your identity: {reason}. Please resubmit." },
  },
  "otp.code": {
    category: "SECURITY",
    channels: ["SMS"],
    defaults: { body: "Your Provira code is {code}. It expires in 5 minutes." },
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
