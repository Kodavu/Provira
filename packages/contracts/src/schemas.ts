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
        location: z.string().nullable().optional(),
        startAt: zDate.nullable().optional(),
        endAt: zDate.nullable().optional(),
        employerName: z.string().nullable().optional(),
      }),
      attendance: z
        .object({ status: z.string(), code: z.string().nullable().optional() })
        .nullable(),
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
      payAmount: zMoney, // total (perPerson × headcount)
      perPerson: zMoney,
      headcount: z.number(),
      accepted: z.number(), // workers in the job
      applied: z.number(), // pending applications awaiting the employer
      invited: z.number(), // pending invites awaiting the worker
      location: z.string().nullable(),
      startAt: zDate.nullable(),
      endAt: zDate.nullable(),
      skills: z.array(z.string()),
      applicants: z.number(),
      escrow: z
        .object({ amount: zMoney, funded: z.boolean(), released: z.boolean() })
        .nullable(),
    }),
  ),
});
export type EmployerDashboard = z.infer<typeof zEmployerDashboard>;

// --- Job detail (employer view) ---

// A worker's public-facing profile, shown to employers reviewing applicants.
export const zWorkerProfile = z.object({
  userId: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  phone: z.string().nullable(),
  skills: z.array(z.string()),
  languages: z.array(z.string()),
  score: z.number(),
  tier: zTier,
  jobsCompleted: z.number(),
  onTimeRate: z.number(),
  kycVerified: z.boolean(),
  ratingAvg: z.number(),
  ratingCount: z.number(),
  memberSince: zDate.nullable(),
  lastActive: zDate.nullable(),
});
export type WorkerProfile = z.infer<typeof zWorkerProfile>;

export const zJobAssignmentRow = z.object({
  assignmentId: z.string(),
  workerId: z.string(),
  workerName: z.string().nullable(),
  status: z.string(),
  matchScore: z.number().nullable(),
  profile: zWorkerProfile.nullable(),
  attendance: z
    .object({ status: z.string(), code: z.string().nullable(), confirmedAt: zDate.nullable() })
    .nullable(),
});
export type JobAssignmentRow = z.infer<typeof zJobAssignmentRow>;

export const zJobSuggestion = z.object({
  workerId: z.string(),
  workerName: z.string().nullable(),
  matchScore: z.number(),
  skills: z.array(z.string()),
  score: z.number(),
  tier: zTier,
  reasons: z.array(z.string()),
});
export type JobSuggestion = z.infer<typeof zJobSuggestion>;

export const zJobDetail = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  payAmount: zMoney,
  perPerson: zMoney,
  headcount: z.number(),
  accepted: z.number(),
  filled: z.boolean(),
  location: z.string().nullable(),
  state: z.string().nullable(),
  area: z.string().nullable(),
  ward: z.string().nullable(),
  startAt: zDate.nullable(),
  endAt: zDate.nullable(),
  skills: z.array(z.string()),
  escrow: z.object({ amount: zMoney, funded: z.boolean(), released: z.boolean() }).nullable(),
  inJob: z.array(zJobAssignmentRow), // ACCEPTED / CONFIRMED
  applications: z.array(zJobAssignmentRow), // APPLIED — awaiting employer
  invites: z.array(zJobAssignmentRow), // INVITED — awaiting worker
});
export type JobDetail = z.infer<typeof zJobDetail>;

// --- Job search (worker view) ---

export const zJobSearchItem = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  perPerson: zMoney,
  headcount: z.number(),
  accepted: z.number(),
  filled: z.boolean(),
  location: z.string().nullable(),
  state: z.string().nullable(),
  area: z.string().nullable(),
  ward: z.string().nullable(),
  proximity: z.enum(["ward", "area", "state"]).nullable(), // relative to the worker's home
  matchesSkills: z.boolean(),
  startAt: zDate.nullable(),
  endAt: zDate.nullable(),
  skills: z.array(z.string()),
  employerName: z.string().nullable(),
  employerUserId: z.string().nullable(),
  myStatus: z.string().nullable(), // this worker's assignment status, if any
});
export type JobSearchItem = z.infer<typeof zJobSearchItem>;
export const zJobSearchResults = z.object({
  items: z.array(zJobSearchItem),
  feed: z.string(), // ALL | SKILLS | NEARBY — the feed actually applied
});
export type JobSearchResults = z.infer<typeof zJobSearchResults>;

// The worker's editable profile (skills, languages, home location, feed pref).
export const zWorkerProfileEdit = z.object({
  fullName: z.string().nullable(),
  jobFeed: z.string(),
  bio: z.string().nullable(),
  languages: z.array(z.string()),
  skills: z.array(z.string()),
  location: z.object({
    state: z.string().nullable(),
    area: z.string().nullable(),
    ward: z.string().nullable(),
    label: z.string().nullable(),
  }),
});
export type WorkerProfileEdit = z.infer<typeof zWorkerProfileEdit>;

export const zSkill = z.object({ slug: z.string(), name: z.string() });
export type Skill = z.infer<typeof zSkill>;

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

export const zBankAccount = z.object({
  bankCode: z.string().nullable(),
  bankName: z.string().nullable(),
  accountNumber: z.string(),
  accountName: z.string().nullable(),
});
export type BankAccount = z.infer<typeof zBankAccount>;

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
  bankAccount: zBankAccount.nullable(),
});
export type VerificationStatus = z.infer<typeof zVerificationStatus>;

// ---------------------------------------------------------------------------
// Reputation & public profiles (Part 2 — trust layer)
// ---------------------------------------------------------------------------

export const zReviewDirection = z.enum(["EMPLOYER_ON_WORKER", "WORKER_ON_EMPLOYER"]);
export type ReviewDirection = z.infer<typeof zReviewDirection>;

// A single published review, as shown on a public profile.
export const zReview = z.object({
  id: z.string(),
  direction: zReviewDirection,
  rating: z.number(), // 1..5 overall
  dimensions: z.object({
    communication: z.number().nullable(),
    professionalism: z.number().nullable(),
    paymentSpeed: z.number().nullable(), // worker -> employer
    quality: z.number().nullable(), // employer -> worker
  }),
  comment: z.string().nullable(),
  authorName: z.string(),
  authorAvatarUrl: z.string().nullable(),
  jobTitle: z.string().nullable(),
  helpfulCount: z.number(),
  createdAt: zDate,
});
export type Review = z.infer<typeof zReview>;

// Derived trust badges (keys only; the frontend maps to label + tooltip). See
// the profile service for how each is earned.
export const zTrustBadge = z.enum([
  "IDENTITY_VERIFIED",
  "EMAIL_VERIFIED",
  "PHONE_VERIFIED",
  "PAYMENT_VERIFIED",
  "GOV_ID_VERIFIED",
  "COMPANY_VERIFIED",
  "TOP_RATED",
  "RISING_TALENT",
  "FAST_RESPONDER",
  "TRUSTED_EMPLOYER",
  "TRUSTED_TRADER",
  "LONG_TERM_CLIENT",
]);
export type TrustBadge = z.infer<typeof zTrustBadge>;

const zRatingSummary = z.object({
  average: z.number(), // 0..5
  count: z.number(),
  breakdown: z.object({ // count of reviews at each star, 5..1
    5: z.number(), 4: z.number(), 3: z.number(), 2: z.number(), 1: z.number(),
  }),
});

// --- Worker public profile ---
export const zWorkerPublicProfile = z.object({
  userId: z.string(),
  fullName: z.string(),
  avatarUrl: z.string().nullable(),
  headline: z.string().nullable(),
  bio: z.string().nullable(),
  location: z.string().nullable(),
  languages: z.array(z.string()),
  skills: z.array(z.string()),
  memberSince: zDate.nullable(),
  lastActive: zDate.nullable(),
  kycVerified: z.boolean(),
  badges: z.array(zTrustBadge),
  stats: z.object({
    jobsCompleted: z.number(),
    completionRate: z.number(), // 0..1 (accepted -> confirmed)
    successScore: z.number(), // 0..1000 Tally Score
    tier: zTier,
    onTimeRate: z.number(), // 0..1
    responseMinutes: z.number().nullable(), // median invite -> accept
    repeatHireRate: z.number(), // 0..1 share of employers who hired again
    totalEarnings: zMoney.nullable(), // optional, kobo
  }),
  rating: zRatingSummary,
  workHistory: z.array(z.object({
    jobTitle: z.string(),
    employerName: z.string().nullable(),
    category: z.string().nullable(),
    completedAt: zDate.nullable(),
    rating: z.number().nullable(),
    feedback: z.string().nullable(),
  })),
  reviews: z.array(zReview),
  portfolio: z.array(z.object({
    id: z.string(),
    kind: z.enum(["IMAGE", "PDF", "VIDEO", "LINK"]),
    title: z.string(),
    description: z.string().nullable(),
    url: z.string(),
    thumbnailUrl: z.string().nullable(),
  })),
  certifications: z.array(z.object({
    id: z.string(),
    source: z.enum(["UPLOADED", "PLATFORM_BADGE", "ASSESSMENT"]),
    title: z.string(),
    issuer: z.string().nullable(),
    url: z.string().nullable(),
    verified: z.boolean(),
  })),
});
export type WorkerPublicProfile = z.infer<typeof zWorkerPublicProfile>;

// --- Employer public profile ---
export const zEmployerPublicProfile = z.object({
  userId: z.string(),
  companyName: z.string(),
  logoUrl: z.string().nullable(),
  industry: z.string().nullable(),
  companySize: z.string().nullable(),
  websiteUrl: z.string().nullable(),
  about: z.string().nullable(),
  location: z.string().nullable(),
  memberSince: zDate.nullable(),
  verified: z.boolean(),
  badges: z.array(zTrustBadge),
  stats: z.object({
    jobsPosted: z.number(),
    jobsCompleted: z.number(),
    hireRate: z.number(), // 0..1 applicants accepted
    avgResponseMinutes: z.number().nullable(),
    totalPaid: zMoney.nullable(), // kobo, released to workers
    repeatWorkers: z.number(), // workers hired more than once
  }),
  rating: zRatingSummary,
  jobHistory: z.array(z.object({
    title: z.string(),
    status: z.string(),
    filled: z.number(),
    headcount: z.number(),
    postedAt: zDate.nullable(),
    category: z.string().nullable(),
  })),
  reviews: z.array(zReview),
});
export type EmployerPublicProfile = z.infer<typeof zEmployerPublicProfile>;

// Whether the current user may review a given subject on a given job, and the
// existing review if already submitted (drives the review CTA + form).
export const zReviewEligibility = z.object({
  canReview: z.boolean(),
  direction: zReviewDirection.nullable(),
  reason: z.string().nullable(),
  existing: zReview.nullable(),
});
export type ReviewEligibility = z.infer<typeof zReviewEligibility>;
