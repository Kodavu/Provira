import { cookies } from "next/headers";

// The admin app never exposes the API to the browser. Server components and
// route handlers read the httpOnly session cookie and call the API with it.
export const ADMIN_API = process.env.ADMIN_API_URL ?? "http://localhost:4000/api";
export const SESSION_COOKIE = "admin_session";

export function getToken(): string | null {
  return cookies().get(SESSION_COOKIE)?.value ?? null;
}

export async function adminFetch<T>(path: string): Promise<T | null> {
  const token = getToken();
  if (!token) return null;
  const res = await fetch(`${ADMIN_API}${path}`, {
    headers: { authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

export interface Me {
  admin: { id: string; email: string; fullName: string; department: string | null };
  roles: string[];
  permissions: string[];
}
