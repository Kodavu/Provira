// API client for the Tally Nest backend. Base URL comes from EXPO_PUBLIC_API_URL
// so a real device can point at a LAN IP; defaults to localhost for web/dev.
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export type Tier = "BUILDING" | "EMERGING" | "TRUSTED" | "ESTABLISHED";

export interface WorkerDashboard {
  user: { id: string; fullName: string | null; phone: string };
  score: { value: number; tier: Tier; jobsCompleted: number; onTimeRate: number };
  wallet: { balance: string; currency: string };
  assignments: Array<{
    id: string;
    status: string;
    job: { id: string; title: string; payAmount: string };
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
  getUser: (userId: string) =>
    request<{ id: string; roles: Array<{ role: string }> }>(`/users/${userId}`),
  workerDashboard: (userId: string) =>
    request<WorkerDashboard>(`/users/${userId}/dashboard`),
  applyToJob: (jobId: string, userId: string) =>
    request<{ assignmentId: string; code: string | null }>(`/jobs/${jobId}/apply`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
  confirmAttendance: (assignmentId: string, code: string) =>
    request<{ status: string }>(`/attendance/assignment/${assignmentId}/confirm`, {
      method: "POST",
      body: JSON.stringify({ code, via: "WEB" }),
    }),
};
