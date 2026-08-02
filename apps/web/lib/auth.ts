// Authentication business logic — the single place that talks to the API and
// the session store for auth. UI components call these; they contain no JSX.

import { api } from "@/lib/api";
import { saveSession, getUserId, clearSession } from "@/lib/session";

export type UserType = "worker" | "trader" | "employer";
export type Role = "WORKER" | "TRADER" | "EMPLOYER";

// The whole authenticated app lives at /overview and adapts to the active role,
// so there's a single home for every user regardless of how many roles they hold.
export const HOME = "/overview";

// When a user holds more than one role we default to the "richest" experience.
const ROLE_PRIORITY: Role[] = ["EMPLOYER", "TRADER", "WORKER"];

/** Pick the default active role for a set of roles (highest priority wins). */
export function primaryRole(roles: string[]): Role | null {
  for (const r of ROLE_PRIORITY) if (roles.includes(r)) return r;
  return null;
}

export const ROLE_LABEL: Record<Role, string> = {
  WORKER: "Worker",
  TRADER: "Trader",
  EMPLOYER: "Employer",
};

/** Where a user lands after auth. One home for everyone; content follows role. */
export function routeForRoles(roles: string[]): string {
  return roles.length > 0 ? HOME : "/signup";
}

export function pathForType(_type: UserType): string {
  return HOME;
}

/** E.164-ish validation matching the API's DTO. */
export function isValidPhone(phone: string): boolean {
  return /^\+?[1-9]\d{7,14}$/.test(phone.trim());
}

/** Send an OTP. Returns the dev code when the API surfaces one (non-prod). */
export async function requestOtp(phone: string): Promise<{ devCode: string | null }> {
  const res = await api.requestOtp(phone.trim());
  return { devCode: res.devCode ?? null };
}

export interface VerifiedUser {
  userId: string;
  roles: string[];
  fullName: string | null;
  /** New = verified but hasn't picked a role yet → needs onboarding. */
  isNew: boolean;
}

/** Verify the code, persist the session, and load the user's profile + roles. */
export async function verifyOtp(phone: string, code: string): Promise<VerifiedUser> {
  const res = await api.verifyOtp(phone.trim(), code);
  saveSession(res.token, res.user.id);
  const profile = await api.getUser(res.user.id);
  const roles = profile.roles.map((r) => r.role);
  return { userId: res.user.id, roles, fullName: profile.fullName, isNew: roles.length === 0 };
}

/** Finish signup: set the name and role, returning the dashboard path. */
export async function completeOnboarding(
  userId: string,
  fullName: string,
  type: UserType,
): Promise<string> {
  await api.updateProfile(userId, { fullName: fullName.trim() });
  await api.addRole(userId, type.toUpperCase() as "WORKER" | "TRADER" | "EMPLOYER");
  return pathForType(type);
}

/** Is there a persisted session? (Used to fast-forward returning users.) */
export function hasSession(): boolean {
  return !!getUserId();
}

/** Resolve the dashboard for the persisted session, or null if none/invalid. */
export async function resolveSessionRoute(): Promise<string | null> {
  const userId = getUserId();
  if (!userId) return null;
  try {
    const profile = await api.getUser(userId);
    const roles = profile.roles.map((r) => r.role);
    // A session with no role yet isn't onboarded — send them to finish signup.
    return roles.length === 0 ? null : HOME;
  } catch {
    clearSession();
    return null;
  }
}

export { clearSession };
