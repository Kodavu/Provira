import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// approve | consume | act — each maps to the matching API endpoint. The API
// enforces the permission and the grant's state (approval, ownership, expiry).
const ALLOWED = new Set(["approve", "consume", "act"]);

export async function POST(req: Request, { params }: { params: { id: string; action: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.has(params.action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${ADMIN_API}/admin/impersonation/${params.id}/${params.action}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
