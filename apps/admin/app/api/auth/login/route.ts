import { NextResponse } from "next/server";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// BFF login: exchange credentials for a token, store it in an httpOnly cookie so
// it never touches client JS.
export async function POST(req: Request) {
  const { email, password } = await req.json();
  const res = await fetch(`${ADMIN_API}/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }
  const data = (await res.json()) as { token: string };
  const out = NextResponse.json({ ok: true });
  out.cookies.set(SESSION_COOKIE, data.token, {
    httpOnly: true,
    sameSite: "strict", // admin session — strict CSRF posture
    path: "/",
    maxAge: 12 * 3600,
    secure: process.env.NODE_ENV === "production",
  });
  return out;
}
