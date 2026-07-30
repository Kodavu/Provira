import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// Per-staffer actions routed to their permission-gated API endpoints.
const MAP: Record<string, { method: string; path: (id: string) => string; body?: (b: any) => unknown }> = {
  status: { method: "POST", path: (id) => `/admin/staff/${id}/status`, body: (b) => ({ status: b.status }) },
  roles: { method: "POST", path: (id) => `/admin/staff/${id}/roles`, body: (b) => ({ roleIds: b.roleIds }) },
  reset: { method: "POST", path: (id) => `/admin/staff/${id}/reset-password` },
  edit: { method: "PATCH", path: (id) => `/admin/staff/${id}`, body: (b) => ({ fullName: b.fullName, department: b.department }) },
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const entry = MAP[body.action as string];
  if (!entry) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const res = await fetch(`${ADMIN_API}${entry.path(params.id)}`, {
    method: entry.method,
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: entry.body ? JSON.stringify(entry.body(body)) : undefined,
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
