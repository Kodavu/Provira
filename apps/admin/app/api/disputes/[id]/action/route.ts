import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// One BFF endpoint routes each workflow action to its permission-gated API
// endpoint. Enforcement (assign/escalate/resolve/close) happens in the API.
const MAP: Record<string, { path: (id: string) => string; body?: (b: any) => unknown }> = {
  assign: { path: (id) => `/admin/disputes/${id}/assign`, body: (b) => ({ adminUserId: b.adminUserId }) },
  status: { path: (id) => `/admin/disputes/${id}/status`, body: (b) => ({ status: b.status }) },
  escalate: { path: (id) => `/admin/disputes/${id}/escalate`, body: (b) => ({ note: b.note }) },
  resolve: { path: (id) => `/admin/disputes/${id}/resolve`, body: (b) => ({ note: b.note }) },
  close: { path: (id) => `/admin/disputes/${id}/close`, body: (b) => ({ note: b.note }) },
  note: { path: (id) => `/admin/disputes/${id}/notes`, body: (b) => ({ body: b.note }) },
  reply: { path: (id) => `/admin/disputes/${id}/reply`, body: (b) => ({ body: b.body }) },
  evidence: { path: (id) => `/admin/disputes/${id}/evidence`, body: (b) => ({ label: b.label, url: b.url }) },
};

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const entry = MAP[body.action as string];
  if (!entry) return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const res = await fetch(`${ADMIN_API}${entry.path(params.id)}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify(entry.body ? entry.body(body) : {}),
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
