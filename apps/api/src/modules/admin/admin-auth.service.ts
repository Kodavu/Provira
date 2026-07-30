import { HttpException, HttpStatus, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service.js";
import { verifyPassword } from "./password.js";

// Simple sliding-window brute-force guard, keyed by email+IP. (Single-instance;
// use Redis in a multi-instance deploy.)
const MAX_FAILS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, number[]>();

function tooManyAttempts(key: string): boolean {
  const now = Date.now();
  const recent = (failures.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  failures.set(key, recent);
  return recent.length >= MAX_FAILS;
}
function recordFailure(key: string) {
  const arr = failures.get(key) ?? [];
  arr.push(Date.now());
  failures.set(key, arr);
}

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string, meta: { ip?: string; device?: string }) {
    const key = `${email.toLowerCase().trim()}|${meta.ip ?? "?"}`;
    if (tooManyAttempts(key)) {
      throw new HttpException(
        "Too many failed attempts. Try again later.",
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });

    const ok =
      admin?.passwordHash && admin.status === "ACTIVE"
        ? verifyPassword(password, admin.passwordHash)
        : false;

    // Record the attempt (success or failure) for the login-history feature.
    if (admin) {
      await this.prisma.adminLoginEvent.create({
        data: { adminUserId: admin.id, ip: meta.ip, device: meta.device, success: ok },
      });
    }
    if (!admin || !ok) {
      recordFailure(key);
      throw new UnauthorizedException("Invalid credentials");
    }
    failures.delete(key); // successful login clears the counter

    await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = new Set<string>();
    for (const ur of admin.roles)
      for (const rp of ur.role.permissions) permissions.add(rp.permission.key);

    const token = await this.jwt.signAsync({ sub: admin.id, kind: "admin" });
    return {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        department: admin.department,
      },
      roles: admin.roles.map((r) => r.role.name),
      permissions: [...permissions],
    };
  }
}
