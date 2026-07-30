import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge IP allowlist for the whole admin surface. Set ADMIN_IP_ALLOWLIST to a
// comma-separated list of IPs/CIDRs (or leave unset / "*" to allow all in dev).
function clientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? req.ip ?? "";
}

function ipToLong(ip: string): number | null {
  const p = ip.replace(/^::ffff:/, "").split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return null;
  return ((p[0] << 24) | (p[1] << 16) | (p[2] << 8) | p[3]) >>> 0;
}

function allowed(ip: string, list?: string): boolean {
  if (!list) return true;
  const entries = list.split(",").map((s) => s.trim()).filter(Boolean);
  if (entries.length === 0 || entries.includes("*")) return true;
  const norm = ip.replace(/^::ffff:/, "");
  return entries.some((e) => {
    if (!e.includes("/")) return e === norm;
    const [range, bitsStr] = e.split("/");
    const a = ipToLong(norm);
    const b = ipToLong(range);
    const bits = parseInt(bitsStr, 10);
    if (a == null || b == null || Number.isNaN(bits)) return false;
    const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
    return (a & mask) === (b & mask);
  });
}

export function middleware(req: NextRequest) {
  if (!allowed(clientIp(req), process.env.ADMIN_IP_ALLOWLIST)) {
    return new NextResponse("Forbidden — your network is not allowed", { status: 403 });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
