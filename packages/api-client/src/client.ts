import type {
  EmployerDashboard,
  JobDetail,
  JobSearchResults,
  JobSuggestion,
  Skill,
  WorkerProfileEdit,
  EmployerProfileEdit,
  PublicJobDetail,
  PortfolioItem,
  NotificationFeed,
  NotificationPreferences,
  OtpRequestResponse,
  OtpVerifyResponse,
  ScoreBreakdown,
  TraderDashboard,
  UserRoles,
  VerificationStatus,
  WalletData,
  WorkerDashboard,
  WorkerPublicProfile,
  EmployerPublicProfile,
  Review,
  ReviewEligibility,
} from "./types";

export interface VerificationSubmission {
  requestedLevel: "BASIC" | "BVN_VERIFIED" | "FULL";
  bvn?: string;
  documents?: Array<{ type: string; label: string; url: string }>;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: string,
  ) {
    super(`API ${status}: ${body}`);
    this.name = "ApiError";
  }
}

export interface TallyClientConfig {
  /** Base URL of the API, e.g. http://localhost:4000/api */
  baseUrl: string;
  /**
   * Optional auth-token provider. Each platform supplies its own: mobile reads
   * SecureStore, web/admin may return null and rely on cookies. Injected here so
   * the package stays free of platform env/session assumptions.
   */
  getToken?: () => string | null | Promise<string | null>;
  /** Override fetch (tests / non-standard runtimes). Defaults to global fetch. */
  fetch?: typeof fetch;
}

/**
 * Construct a typed Tally API client. The same package powers web, mobile, and
 * (future) admin — they differ only in the config passed here.
 */
export function createTallyClient(config: TallyClientConfig) {
  const doFetch = config.fetch ?? fetch;

  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = config.getToken ? await config.getToken() : null;
    const res = await doFetch(`${config.baseUrl}${path}`, {
      ...options,
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(options.headers ?? {}),
      },
    });
    if (!res.ok) throw new ApiError(res.status, await res.text());
    return res.json() as Promise<T>;
  }

  const post = (path: string, body?: unknown) =>
    request(path, { method: "POST", body: body ? JSON.stringify(body) : undefined });

  return {
    request,

    // Auth
    requestOtp: (phone: string) =>
      post("/auth/otp/request", { phone }) as Promise<OtpRequestResponse>,
    verifyOtp: (phone: string, code: string) =>
      post("/auth/otp/verify", { phone, code }) as Promise<OtpVerifyResponse>,
    getUser: (userId: string) => request<UserRoles>(`/users/${userId}`),
    updateProfile: (userId: string, patch: { fullName?: string; hasSmartphone?: boolean; language?: string; jobFeed?: string }) =>
      request<UserRoles>(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(patch) }),
    addRole: (userId: string, role: "WORKER" | "TRADER" | "EMPLOYER") =>
      post(`/users/${userId}/roles`, { role }) as Promise<unknown>,

    // Geo (cascading location) + bank catalog
    geoStates: () => request<string[]>(`/geo/states`),
    geoLgas: (state: string) => request<string[]>(`/geo/lgas?state=${encodeURIComponent(state)}`),
    geoWards: (state: string, lga: string) =>
      request<string[]>(`/geo/wards?state=${encodeURIComponent(state)}&lga=${encodeURIComponent(lga)}`),
    banks: () => request<{ code: string; name: string }[]>(`/banks`),

    // Skill catalog + worker profile
    skills: () => request<Skill[]>(`/skills`),
    workerProfile: (userId: string) => request<WorkerProfileEdit>(`/users/${userId}/worker-profile`),
    updateWorkerProfile: (
      userId: string,
      patch: {
        fullName?: string;
        headline?: string;
        avatarUrl?: string;
        bio?: string;
        languages?: string[];
        skillSlugs?: string[];
        state?: string;
        area?: string;
        ward?: string;
        label?: string;
      },
    ) =>
      request<WorkerProfileEdit>(`/users/${userId}/worker-profile`, {
        method: "PUT",
        body: JSON.stringify(patch),
      }),

    // Employer company profile (edit)
    employerProfile: (userId: string) =>
      request<EmployerProfileEdit>(`/employers/${userId}/profile`),
    updateEmployerProfile: (
      userId: string,
      patch: {
        businessName?: string;
        logoUrl?: string;
        industry?: string;
        companySize?: string;
        websiteUrl?: string;
        about?: string;
        state?: string;
        area?: string;
        ward?: string;
        label?: string;
      },
    ) =>
      request<EmployerProfileEdit>(`/employers/${userId}/profile`, {
        method: "PUT",
        body: JSON.stringify(patch),
      }),

    // Worker-safe job detail
    publicJobDetail: (jobId: string, userId?: string) =>
      request<PublicJobDetail>(`/jobs/${jobId}/public${userId ? `?userId=${encodeURIComponent(userId)}` : ""}`),

    // Worker portfolio management
    portfolio: (userId: string) => request<PortfolioItem[]>(`/users/${userId}/portfolio`),
    addPortfolio: (
      userId: string,
      item: { kind: "IMAGE" | "PDF" | "VIDEO" | "LINK"; title: string; description?: string; url: string; thumbnailUrl?: string },
    ) => post(`/users/${userId}/portfolio`, item) as Promise<PortfolioItem[]>,
    deletePortfolio: (userId: string, itemId: string) =>
      request<PortfolioItem[]>(`/users/${userId}/portfolio/${itemId}`, { method: "DELETE" }),

    // Worker
    workerDashboard: (userId: string) =>
      request<WorkerDashboard>(`/users/${userId}/dashboard`),
    wallet: (userId: string) => request<WalletData>(`/users/${userId}/wallet`),
    scoreBreakdown: (userId: string) =>
      request<ScoreBreakdown>(`/scoring/${userId}/breakdown`),
    withdraw: (userId: string, amount: string) =>
      post(`/users/${userId}/withdraw`, { amount }) as Promise<WalletData>,
    applyToJob: (jobId: string, userId: string) =>
      post(`/jobs/${jobId}/apply`, { userId }) as Promise<{
        assignmentId: string;
        code: string | null;
        alreadyIssued?: boolean;
      }>,
    confirmAttendance: (assignmentId: string, code: string) =>
      post(`/attendance/assignment/${assignmentId}/confirm`, { code, via: "WEB" }) as Promise<{
        status: string;
      }>,

    // Trader
    traderDashboard: (userId: string) =>
      request<TraderDashboard>(`/traders/${userId}/dashboard`),
    logSale: (userId: string, amount: string, method: string) =>
      post(`/traders/${userId}/sales`, { amount, method }) as Promise<{ id: string }>,

    // Employer
    employerDashboard: (userId: string) =>
      request<EmployerDashboard>(`/employers/${userId}/dashboard`),
    createJob: (input: {
      employerId: string;
      title: string;
      description?: string;
      payAmount: string; // kobo total (perPerson × headcount)
      headcount?: number;
      skillSlugs?: string[];
      languages?: string[];
      locationLabel?: string; // address / landmark
      locationState?: string;
      locationArea?: string; // LGA
      locationWard?: string;
      startAt?: string;
      endAt?: string;
    }) => post("/jobs", input) as Promise<{ id: string }>,
    publishJob: (jobId: string) => post(`/jobs/${jobId}/publish`) as Promise<{ id: string }>,
    fundJob: (jobId: string) => post(`/jobs/${jobId}/fund`) as Promise<{ jobId: string }>,

    // Jobs — detail, matching (suggest only), invite/apply/accept
    jobDetail: (jobId: string) => request<JobDetail>(`/jobs/${jobId}`),
    jobSuggestions: (jobId: string) => request<JobSuggestion[]>(`/jobs/${jobId}/suggestions`),
    inviteWorker: (jobId: string, workerId: string) =>
      post(`/jobs/${jobId}/invite`, { workerId }) as Promise<{ id: string; status: string }>,
    acceptApplication: (jobId: string, assignmentId: string) =>
      post(`/jobs/${jobId}/assignments/${assignmentId}/accept`) as Promise<{ id: string; status: string }>,
    acceptInvite: (assignmentId: string, userId: string) =>
      post(`/jobs/invites/${assignmentId}/accept`, { userId }) as Promise<{ id: string; status: string }>,
    declineInvite: (assignmentId: string, userId: string) =>
      post(`/jobs/invites/${assignmentId}/decline`, { userId }) as Promise<{ id: string; status: string }>,
    searchJobs: (userId?: string, q?: string, skill?: string, feed?: string) => {
      const params = new URLSearchParams();
      if (userId) params.set("userId", userId);
      if (q) params.set("q", q);
      if (skill) params.set("skill", skill);
      if (feed) params.set("feed", feed);
      const qs = params.toString();
      return request<JobSearchResults>(`/jobs${qs ? `?${qs}` : ""}`);
    },

    // Lending
    loanEligibility: (userId: string) =>
      request<unknown>(`/lending/eligibility/${userId}`),
    applyForLoan: (userId: string, productId: string, amount: string) =>
      post("/lending/apply", { userId, productId, amount }) as Promise<{
        id: string;
        status: "APPROVED" | "REJECTED" | "PENDING";
        amount: string;
        decisionReason: string | null;
      }>,

    // Notifications
    notifications: (userId: string, limit?: number) =>
      request<NotificationFeed>(
        `/users/${userId}/notifications${limit ? `?limit=${limit}` : ""}`,
      ),
    markNotificationRead: (userId: string, id: string) =>
      post(`/users/${userId}/notifications/${id}/read`) as Promise<NotificationFeed>,
    markAllNotificationsRead: (userId: string) =>
      post(`/users/${userId}/notifications/read-all`) as Promise<NotificationFeed>,
    deleteNotification: (userId: string, id: string) =>
      request<NotificationFeed>(`/users/${userId}/notifications/${id}`, { method: "DELETE" }),
    clearNotifications: (userId: string, onlyRead?: boolean) =>
      request<NotificationFeed>(
        `/users/${userId}/notifications/clear${onlyRead ? "?onlyRead=true" : ""}`,
        { method: "DELETE" },
      ),
    notificationPreferences: (userId: string) =>
      request<NotificationPreferences>(`/users/${userId}/notifications/preferences`),
    setNotificationPreference: (
      userId: string,
      pref: { category: string; channel: string; enabled: boolean },
    ) =>
      request<NotificationPreferences>(`/users/${userId}/notifications/preferences`, {
        method: "PUT",
        body: JSON.stringify(pref),
      }),
    setNotificationSetting: (
      userId: string,
      patch: { muteAll?: boolean; quietStart?: number | null; quietEnd?: number | null },
    ) =>
      request<NotificationPreferences>(`/users/${userId}/notifications/settings`, {
        method: "PUT",
        body: JSON.stringify(patch),
      }),

    // Object storage — upload a document, get back its stored URL.
    uploadFile: async (file: File, purpose = "docs") => {
      const form = new FormData();
      form.append("purpose", purpose);
      form.append("file", file);
      const token = config.getToken ? await config.getToken() : null;
      const res = await doFetch(`${config.baseUrl}/uploads`, {
        method: "POST",
        body: form,
        headers: token ? { authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new ApiError(res.status, await res.text());
      return res.json() as Promise<{ key: string; url: string; contentType: string; size: number }>;
    },

    // KYC / verification
    verificationStatus: (userId: string) =>
      request<VerificationStatus>(`/users/${userId}/verification`),
    submitVerification: (userId: string, submission: VerificationSubmission) =>
      post(`/users/${userId}/verification`, submission) as Promise<{ id: string; status: string }>,
    lookupBankAccount: (userId: string, bankCode: string, accountNumber: string) =>
      post(`/users/${userId}/bank-account/lookup`, { bankCode, accountNumber }) as Promise<{ accountName: string }>,
    saveBankAccount: (
      userId: string,
      account: { bankCode: string; bankName?: string; accountNumber: string; accountName: string },
    ) =>
      request<{ ok: true }>(`/users/${userId}/bank-account`, {
        method: "PUT",
        body: JSON.stringify(account),
      }),

    // Public profiles (trust layer)
    workerPublicProfile: (userId: string) =>
      request<WorkerPublicProfile>(`/profiles/worker/${userId}`),
    employerPublicProfile: (userId: string) =>
      request<EmployerPublicProfile>(`/profiles/employer/${userId}`),

    // Reviews
    reviewEligibility: (assignmentId: string, userId: string) =>
      request<ReviewEligibility>(`/reviews/eligibility/${assignmentId}?userId=${encodeURIComponent(userId)}`),
    reviewsForUser: (userId: string) => request<Review[]>(`/reviews/user/${userId}`),
    createReview: (input: {
      assignmentId: string;
      authorUserId: string;
      rating: number;
      communication?: number | null;
      professionalism?: number | null;
      paymentSpeed?: number | null;
      quality?: number | null;
      comment?: string | null;
    }) => post("/reviews", input) as Promise<Review>,
    markReviewHelpful: (reviewId: string, userId: string) =>
      post(`/reviews/${reviewId}/helpful`, { userId }) as Promise<{ helpfulCount: number }>,
    reportReview: (reviewId: string, userId: string, reason?: string) =>
      post(`/reviews/${reviewId}/report`, { userId, reason }) as Promise<{ reported: boolean }>,
  };
}

export type TallyClient = ReturnType<typeof createTallyClient>;
