import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_API, SESSION_COOKIE } from "@/lib/admin-api";

// Delete a template override (reverts the slot to the default). Permission enforced by the API.
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const res = await fetch(`${ADMIN_API}/admin/notification-templates/${params.id}`, {
    method: "DELETE",
    headers: { authorization: `Bearer ${token}` },
  });
  return NextResponse.json(await res.json().catch(() => ({})), { status: res.status });
}
