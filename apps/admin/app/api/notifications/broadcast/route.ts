import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// Send a custom broadcast. Permission (notifications:manage) enforced by the API.
export async function POST(req: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${ADMIN_API}/admin/notifications/broadcast`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
