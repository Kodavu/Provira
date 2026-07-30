// Plain DTO types shared by every client (web, mobile, admin). Deliberately NOT
// derived from Prisma / @tally/db — that would pull server-only code into client
// bundles. These mirror the API's JSON responses.

export type Tier = "BUILDING" | "EMERGING" | "TRUSTED" | "ESTABLISHED";

export interface LoanOffer {
  productId: string;
  name: string;
  maxAmount: string;
  minScore: number;
  minTier?: Tier;
  eligible: boolean;
}

export interface WorkerDashboard {
  user: {
    id: string;
    fullName: string | null;
    phone: string;
    language?: string;
    hasSmartphone?: boolean;
  };
  score: { value: number; tier: Tier; jobsCompleted: number; onTimeRate: number };
  wallet: { balance: string; currency: string };
  assignments: Array<{
    id: string;
    status: string;
    matchScore?: number | null;
    job: { id: string; title: string; payAmount: string; status?: string };
    attendance: { status: string } | null;
  }>;
  openJobs: Array<{
    id: string;
    title: string;
    payAmount: string;
    location: { label: string | null } | null;
    skills: Array<{ skill: { name: string } }>;
  }>;
  loanOffers: LoanOffer[];
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
  loanOffers: LoanOffer[];
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
