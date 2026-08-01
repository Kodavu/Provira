// Authentication business logic — the single place that talks to the API and
// the session store for auth. UI components call these; they contain no JSX.

import { api } from "@/lib/api";
import { saveSession, getUserId, clearSession } from "@/lib/session";

export type UserType = "worker" | "trader" | "employer";

export const ROLE_TO_PATH: Record<string, string> = {
  EMPLOYER: "/employer",
  TRADER: "/trader",
  WORKER: "/worker",
};

/** Where a user lands after auth, given their roles. */
export function routeForRoles(roles: string[]): string {
  if (roles.includes("EMPLOYER")) return "/employer";
  if (roles.includes("TRADER")) return "/trader";
  return "/worker";
}

export function pathForType(type: UserType): string {
  return `/${type}`;
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
    return roles.length === 0 ? null : routeForRoles(roles);
  } catch {
    clearSession();
    return null;
  }
}

export { clearSession };
