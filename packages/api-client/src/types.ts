// The client's DTO types are inferred from the single source of truth in
// @tally/contracts (zod schemas the API validates against). Type-only re-export
// means no zod is pulled into web/mobile bundles.
export type {
  Tier,
  LoanOffer,
  WorkerDashboard,
  TraderDashboard,
  EmployerDashboard,
  WalletData,
  ScoreFactor,
  ScoreHistoryItem,
  ScoreBreakdown,
  OtpRequestResponse,
  OtpVerifyResponse,
  UserRoles,
  Notification,
  NotificationFeed,
  NotificationPreferences,
} from "@tally/contracts";
