import type {
  EmployerDashboard,
  ScoreBreakdown,
  TraderDashboard,
  WalletData,
  WorkerDashboard,
} from "./types";

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
      post("/auth/otp/request", { phone }) as Promise<{ sent: boolean; devCode?: string }>,
    verifyOtp: (phone: string, code: string) =>
      post("/auth/otp/verify", { phone, code }) as Promise<{
        token: string;
        user: { id: string; phone: string };
      }>,
    getUser: (userId: string) =>
      request<{ id: string; fullName: string | null; roles: Array<{ role: string }> }>(
        `/users/${userId}`,
      ),

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
  };
}

export type TallyClient = ReturnType<typeof createTallyClient>;
