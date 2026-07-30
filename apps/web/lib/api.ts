// Thin typed client for the Tally API. Base URL is configurable so the same
// build points at local docker or a deployed backend.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export type Tier = "BUILDING" | "EMERGING" | "TRUSTED" | "ESTABLISHED";

export interface WorkerDashboard {
  user: {
    id: string;
    fullName: string | null;
    phone: string;
    language: string;
    hasSmartphone: boolean;
  };
  score: {
    value: number;
    tier: Tier;
    jobsCompleted: number;
    onTimeRate: number;
  };
  wallet: { balance: string; currency: string };
  assignments: Array<{
    id: string;
    status: string;
    matchScore: number | null;
    job: { id: string; title: string; payAmount: string; status: string };
    attendance: { status: string } | null;
  }>;
  openJobs: Array<{
    id: string;
    title: string;
    payAmount: string;
    location: { label: string | null } | null;
    skills: Array<{ skill: { name: string } }>;
  }>;
  loanOffers: Array<{
    productId: string;
    name: string;
    maxAmount: string;
    minScore: number;
    minTier: Tier;
    eligible: boolean;
  }>;
}

export interface TraderDashboard {
  user: {
    id: string;
    fullName: string | null;
    phone: string;
    businessName: string | null;
    marketName: string | null;
  };
  score: { value: number; tier: Tier; salesCount: number };
  totals: { allTime: string; thisWeek: string; count: number };
  sales: Array<{ id: string; amount: string; method: string; occurredAt: string }>;
  loanOffers: WorkerDashboard["loanOffers"];
}

export interface EmployerDashboard {
  user: { id: string; fullName: string | null; businessName: string | null };
  employerProfileId: string;
  stats: { activeJobs: number; committed: string; released: string };
  jobs: Array<{
    id: string;
    title: string;
    status: string;
    payAmount: string;
    headcount: number;
    location: string | null;
    skills: string[];
    applicants: number;
    escrow: { amount: string; funded: boolean; released: boolean } | null;
  }>;
}

export interface WalletData {
  available: string;
  currency: string;
  payoutDestination: { bank: string; accountName: string; accountNumber: string };
  activity: Array<{
    id: string;
    direction: "in" | "out";
    amount: string;
    type: string;
    label: string;
    at: string;
  }>;
}

export const api = {
  requestOtp: (phone: string) =>
    request<{ sent: boolean; devCode?: string }>("/auth/otp/request", {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),

  verifyOtp: (phone: string, code: string) =>
    request<{ token: string; user: { id: string; phone: string } }>(
      "/auth/otp/verify",
      { method: "POST", body: JSON.stringify({ phone, code }) },
    ),

  getUser: (userId: string) =>
    request<{ id: string; fullName: string | null; roles: Array<{ role: string }> }>(
      `/users/${userId}`,
    ),

  workerDashboard: (userId: string) =>
    request<WorkerDashboard>(`/users/${userId}/dashboard`),

  wallet: (userId: string) => request<WalletData>(`/users/${userId}/wallet`),

  withdraw: (userId: string, amount: string) =>
    request<WalletData>(`/users/${userId}/withdraw`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),

  applyToJob: (jobId: string, userId: string) =>
    request<{ assignmentId: string; code: string | null; alreadyIssued: boolean }>(
      `/jobs/${jobId}/apply`,
      { method: "POST", body: JSON.stringify({ userId }) },
    ),

  confirmAttendance: (assignmentId: string, code: string) =>
    request<{ status: string }>(
      `/attendance/assignment/${assignmentId}/confirm`,
      { method: "POST", body: JSON.stringify({ code, via: "WEB" }) },
    ),

  // Trader
  traderDashboard: (userId: string) =>
    request<TraderDashboard>(`/traders/${userId}/dashboard`),

  logSale: (userId: string, amount: string, method: string) =>
    request<{ id: string }>(`/traders/${userId}/sales`, {
      method: "POST",
      body: JSON.stringify({ amount, method }),
    }),

  // Employer
  employerDashboard: (userId: string) =>
    request<EmployerDashboard>(`/employers/${userId}/dashboard`),

  createJob: (input: {
    employerId: string;
    title: string;
    payAmount: string;
    skillSlugs?: string[];
    languages?: string[];
  }) =>
    request<{ id: string }>("/jobs", {
      method: "POST",
      body: JSON.stringify(input),
    }),

  publishJob: (jobId: string) =>
    request<{ id: string }>(`/jobs/${jobId}/publish`, { method: "POST" }),

  fundJob: (jobId: string) =>
    request<{ jobId: string }>(`/jobs/${jobId}/fund`, { method: "POST" }),
};

/** Format kobo (minor units, as string) into naira for display. */
export function formatNaira(kobo: string | number): string {
  const n = Number(kobo) / 100;
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(n);
}
