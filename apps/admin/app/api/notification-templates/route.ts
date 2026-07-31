import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// Upsert a notification template. Permission (notifications:manage) enforced by the API.
export async function PUT(req: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const res = await fetch(`${ADMIN_API}/admin/notification-templates`, {
    method: "PUT",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
