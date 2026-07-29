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

  workerDashboard: (userId: string) =>
    request<WorkerDashboard>(`/users/${userId}/dashboard`),

  confirmAttendance: (assignmentId: string, code: string) =>
    request<{ status: string }>(
      `/attendance/assignment/${assignmentId}/confirm`,
      { method: "POST", body: JSON.stringify({ code, via: "WEB" }) },
    ),
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
