import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// Proxy a status change to the API with the admin's token. Permission
// enforcement (users:suspend) happens server-side in the API.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { status } = await req.json();
  const action = status === "SUSPENDED" ? "suspend" : "reactivate";
  const res = await fetch(`${ADMIN_API}/admin/users/${params.id}/${action}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}` },
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
