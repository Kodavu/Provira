import type {
  EmployerDashboard,
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
    updateProfile: (userId: string, patch: { fullName?: string; hasSmartphone?: boolean; language?: string }) =>
      request<UserRoles>(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(patch) }),
    addRole: (userId: string, role: "WORKER" | "TRADER" | "EMPLOYER") =>
      post(`/users/${userId}/roles`, { role }) as Promise<unknown>,

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
      payAmount: string;
      skillSlugs?: string[];
      languages?: string[];
    }) => post("/jobs", input) as Promise<{ id: string }>,
    publishJob: (jobId: string) => post(`/jobs/${jobId}/publish`) as Promise<{ id: string }>,
    fundJob: (jobId: string) => post(`/jobs/${jobId}/fund`) as Promise<{ jobId: string }>,
    matchJob: (jobId: string) => post(`/jobs/${jobId}/match`) as Promise<unknown>,

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
  };
}

export type TallyClient = ReturnType<typeof createTallyClient>;
