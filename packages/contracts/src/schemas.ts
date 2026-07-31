import { z } from "zod";

// Normalizers so the parsed output is exactly the wire shape: money as a string
// (from BigInt/number/string) and timestamps as ISO strings (from Date/string).
// The API .parse()s its responses through these; the clients infer their types
// from the OUTPUT, so money/dates are always strings.
const zMoney = z
  .union([z.string(), z.bigint(), z.number()])
  .transform((v) => v.toString());

const zDate = z
  .union([z.string(), z.date()])
  .transform((d) => (d instanceof Date ? d.toISOString() : d));

export const zTier = z.enum(["BUILDING", "EMERGING", "TRUSTED", "ESTABLISHED"]);
export type Tier = z.infer<typeof zTier>;

export const zLoanOffer = z.object({
  productId: z.string(),
  name: z.string(),
  maxAmount: zMoney,
  minScore: z.number(),
  minTier: zTier.optional(),
  eligible: z.boolean(),
});
export type LoanOffer = z.infer<typeof zLoanOffer>;

// --- Auth ---

export const zOtpRequestResponse = z.object({
  sent: z.boolean(),
  devCode: z.string().optional(),
});
export type OtpRequestResponse = z.infer<typeof zOtpRequestResponse>;

export const zOtpVerifyResponse = z.object({
  token: z.string(),
  user: z.object({ id: z.string(), phone: z.string() }),
});
export type OtpVerifyResponse = z.infer<typeof zOtpVerifyResponse>;

export const zUserRoles = z.object({
  id: z.string(),
  fullName: z.string().nullable(),
  roles: z.array(z.object({ role: z.string() })),
});
export type UserRoles = z.infer<typeof zUserRoles>;

// --- Worker dashboard ---

export const zWorkerDashboard = z.object({
  user: z.object({
    id: z.string(),
    fullName: z.string().nullable(),
    phone: z.string(),
    language: z.string().optional(),
    hasSmartphone: z.boolean().optional(),
  }),
  score: z.object({
    value: z.number(),
    tier: zTier,
    jobsCompleted: z.number(),
    onTimeRate: z.number(),
  }),
  wallet: z.object({ balance: zMoney, currency: z.string() }),
  assignments: z.array(
    z.object({
      id: z.string(),
      status: z.string(),
      matchScore: z.number().nullable().optional(),
      job: z.object({
        id: z.string(),
        title: z.string(),
        payAmount: zMoney,
        status: z.string().optional(),
      }),
      attendance: z.object({ status: z.string() }).nullable(),
    }),
  ),
  openJobs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      payAmount: zMoney,
      location: z.object({ label: z.string().nullable() }).nullable(),
      skills: z.array(z.object({ skill: z.object({ name: z.string() }) })),
    }),
  ),
  loanOffers: z.array(zLoanOffer),
});
export type WorkerDashboard = z.infer<typeof zWorkerDashboard>;

// --- Wallet ---

export const zWalletData = z.object({
  available: zMoney,
  currency: z.string(),
  payoutDestination: z.object({
    bank: z.string(),
    accountName: z.string(),
    accountNumber: z.string(),
  }),
  activity: z.array(
    z.object({
      id: z.string(),
      direction: z.enum(["in", "out"]),
      amount: zMoney,
      type: z.string(),
      label: z.string(),
      at: zDate,
    }),
  ),
});
export type WalletData = z.infer<typeof zWalletData>;

// --- Score breakdown ---

export const zScoreFactor = z.object({
  type: z.string(),
  label: z.string(),
  count: z.number(),
  points: z.number(),
});
export type ScoreFactor = z.infer<typeof zScoreFactor>;

export const zScoreHistoryItem = z.object({
  type: z.string(),
  label: z.string(),
  points: z.number(),
  at: zDate,
});
export type ScoreHistoryItem = z.infer<typeof zScoreHistoryItem>;

export const zScoreBreakdown = z.object({
  score: z.number(),
  tier: zTier,
  range: z.object({ min: z.number(), max: z.number() }),
  progress: z.object({
    nextTier: zTier.nullable(),
    pointsToNext: z.number(),
    floor: z.number(),
    ceil: z.number(),
  }),
  metrics: z.object({
    jobsCompleted: z.number(),
    onTimeRate: z.number(),
    salesCount: z.number(),
  }),
  factors: z.array(zScoreFactor),
  history: z.array(zScoreHistoryItem),
});
export type ScoreBreakdown = z.infer<typeof zScoreBreakdown>;

// --- Trader dashboard ---

export const zTraderDashboard = z.object({
  user: z.object({
    id: z.string(),
    fullName: z.string().nullable(),
    phone: z.string(),
    businessName: z.string().nullable(),
    marketName: z.string().nullable(),
  }),
  score: z.object({ value: z.number(), tier: zTier, salesCount: z.number() }),
  totals: z.object({ allTime: zMoney, thisWeek: zMoney, count: z.number() }),
  sales: z.array(
    z.object({
      id: z.string(),
      amount: zMoney,
      method: z.string(),
      occurredAt: zDate,
    }),
  ),
  loanOffers: z.array(zLoanOffer),
});
export type TraderDashboard = z.infer<typeof zTraderDashboard>;

// --- Employer dashboard ---

export const zEmployerDashboard = z.object({
  user: z.object({
    id: z.string(),
    fullName: z.string().nullable(),
    businessName: z.string().nullable(),
  }),
  employerProfileId: z.string(),
  stats: z.object({
    activeJobs: z.number(),
    committed: zMoney,
    released: zMoney,
  }),
  jobs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      status: z.string(),
      payAmount: zMoney,
      headcount: z.number(),
      location: z.string().nullable(),
      skills: z.array(z.string()),
      applicants: z.number(),
      escrow: z
        .object({ amount: zMoney, funded: z.boolean(), released: z.boolean() })
        .nullable(),
    }),
  ),
});
export type EmployerDashboard = z.infer<typeof zEmployerDashboard>;

// --- Notifications ---

export const zNotificationChannel = z.enum(["INAPP", "EMAIL", "SMS", "WHATSAPP", "IVR", "PUSH"]);
export const zNotificationCategory = z.enum(["SECURITY", "TRANSACTIONAL", "ACTIVITY", "MARKETING"]);

export const zNotification = z.object({
  id: z.string(),
  category: zNotificationCategory,
  eventKey: z.string(),
  title: z.string().nullable(),
  body: z.string(),
  data: z.unknown().nullable(),
  readAt: zDate.nullable(),
  createdAt: zDate,
});
export type Notification = z.infer<typeof zNotification>;

export const zNotificationFeed = z.object({
  items: z.array(zNotification),
  unread: z.number(),
});
export type NotificationFeed = z.infer<typeof zNotificationFeed>;

export const zNotificationPreferences = z.object({
  preferences: z.array(
    z.object({
      category: zNotificationCategory,
      channel: zNotificationChannel,
      enabled: z.boolean(),
    }),
  ),
  setting: z.object({
    muteAll: z.boolean(),
    quietStart: z.number().nullable(),
    quietEnd: z.number().nullable(),
  }),
});
export type NotificationPreferences = z.infer<typeof zNotificationPreferences>;

// --- KYC / verification ---

export const zKycLevel = z.enum(["NONE", "BASIC", "BVN_VERIFIED", "FULL"]);
export const zVerificationDocType = z.enum([
  "BVN", "NIN", "NATIONAL_ID", "DRIVERS_LICENSE", "VOTERS_CARD", "PASSPORT", "UTILITY_BILL", "SELFIE",
]);

export const zVerificationStatus = z.object({
  kycLevel: zKycLevel,
  request: z
    .object({
      id: z.string(),
      requestedLevel: zKycLevel,
      status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
      decisionReason: z.string().nullable(),
      createdAt: zDate,
      documents: z.array(z.object({ type: zVerificationDocType, label: z.string() })),
    })
    .nullable(),
});
export type VerificationStatus = z.infer<typeof zVerificationStatus>;
