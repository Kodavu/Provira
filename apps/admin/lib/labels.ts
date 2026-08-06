// Human-readable labels for the machine keys the platform uses internally
// (audit actions, notification event keys, dispute timeline types, ledger
// entry types). Anything not in a map falls back to a sentence-cased version
// of the key, so new keys still read reasonably without a code change.

/** "job.invite_accepted" → "Job invite accepted" */
export function titleize(key: string): string {
  const words = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2") // split camelCase
    .split(/[._\-\s]+/)
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Audit log actions (what an admin did).
const ACTIONS: Record<string, string> = {
  "admin_user.assign_roles": "Assigned roles",
  "admin_user.edit": "Edited a staff member",
  "admin_user.invite": "Invited a staff member",
  "admin_user.reset_password": "Reset a password",
  "dispute.assign": "Assigned a dispute",
  "dispute.escrow_resolve": "Resolved dispute & settled escrow",
  "dispute.evidence": "Added evidence",
  "dispute.note": "Added a private note",
  "dispute.reply": "Replied to the user",
  "impersonation.act": "Started impersonating a user",
  "impersonation.approve": "Approved an impersonation request",
  "impersonation.consume": "Used an impersonation grant",
  "impersonation.request": "Requested impersonation",
  "notification_template.delete": "Deleted a notification template",
  "notifications.broadcast": "Sent a broadcast",
  "verification.approve": "Approved a verification",
  "verification.reject": "Rejected a verification",
  "withdrawal.approve": "Approved a withdrawal",
  "withdrawal.reject": "Rejected a withdrawal",
};

// Notification event keys (what a user receives).
const EVENTS: Record<string, string> = {
  "dispute.replied": "Dispute reply",
  "dispute.resolved": "Dispute resolved",
  "earnings.credited": "Earnings credited",
  "escrow.funded": "Escrow funded",
  "escrow.refunded": "Escrow refunded",
  "job.application": "New job application",
  "job.hired": "Hired for a job",
  "job.invite.accepted": "Invite accepted",
  "job.invited": "Job invitation",
  "job.offer": "Job offer",
  "otp.code": "One-time passcode",
  "payout.sent": "Payout sent",
  "review.received": "New review received",
  "verification.approved": "Verification approved",
  "verification.rejected": "Verification rejected",
  "withdrawal.requested": "Withdrawal requested",
  "admin.broadcast": "Broadcast from Tally",
};

// Dispute timeline event types.
const DISPUTE_EVENTS: Record<string, string> = {
  created: "Dispute opened",
  status_change: "Status changed",
  assigned: "Assigned to an admin",
  escalated: "Escalated",
  note: "Private note added",
  reply: "Replied to the user",
  evidence: "Evidence added",
  escrow_resolve: "Escrow settled",
  resolved: "Marked resolved",
};

// Ledger / transaction entry types (finance).
const LEDGER_TYPES: Record<string, string> = {
  ESCROW_FUND: "Escrow funded",
  ESCROW_RELEASE: "Released to worker",
  ESCROW_REFUND: "Refunded to employer",
  JOB_ESCROW: "Job escrow",
  WITHDRAWAL: "Withdrawal",
  PLATFORM_FEE: "Platform fee",
};

export const humanizeAction = (key: string): string => ACTIONS[key] ?? titleize(key);
export const humanizeEvent = (key: string): string => EVENTS[key] ?? titleize(key);
export const humanizeDisputeEvent = (key: string): string =>
  DISPUTE_EVENTS[key] ?? titleize(key);
export const humanizeLedgerType = (key: string): string =>
  LEDGER_TYPES[key] ?? titleize(key);
