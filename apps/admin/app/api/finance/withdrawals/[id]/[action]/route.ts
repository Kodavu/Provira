import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// approve | reject — the API enforces finance:approve_withdrawals and the
// withdrawal's state (must be awaiting approval).
const ALLOWED = new Set(["approve", "reject"]);

export async function POST(req: Request, { params }: { params: { id: string; action: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ALLOWED.has(params.action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  const body = await req.json().catch(() => ({}));
  const res = await fetch(`${ADMIN_API}/admin/finance/withdrawals/${params.id}/${params.action}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
