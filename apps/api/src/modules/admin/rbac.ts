import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service.js";

export interface AdminContext {
  id: string;
  email: string;
  fullName: string;
  department: string | null;
  roles: string[];
  permissions: Set<string>;
}

// Attach required permission keys to a route: @RequirePermissions("users:suspend")
export const PERMISSIONS_KEY = "required_permissions";
export const RequirePermissions = (...keys: string[]) =>
  SetMetadata(PERMISSIONS_KEY, keys);

// Inject the authenticated admin into a handler.
export const CurrentAdmin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminContext =>
    ctx.switchToHttp().getRequest().admin,
);

/**
 * Authenticates the admin JWT and loads their full permission set (roles →
 * permissions) onto the request. Every admin route is behind this.
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException("Missing admin token");

    let payload: { sub: string; kind?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException("Invalid admin token");
    }
    if (payload.kind !== "admin") throw new UnauthorizedException("Not an admin token");

    const admin = await this.prisma.adminUser.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
    if (!admin || admin.status !== "ACTIVE")
      throw new UnauthorizedException("Admin not active");

    const permissions = new Set<string>();
    for (const ur of admin.roles)
      for (const rp of ur.role.permissions) permissions.add(rp.permission.key);

    req.admin = {
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      department: admin.department,
      roles: admin.roles.map((r) => r.role.name),
      permissions,
    } satisfies AdminContext;
    return true;
  }
}

/**
 * Enforces the permissions declared with @RequirePermissions. Must run after
 * AdminAuthGuard (which populates req.admin). Requires ALL listed permissions.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const admin: AdminContext | undefined = ctx.switchToHttp().getRequest().admin;
    if (!admin) throw new UnauthorizedException();
    const missing = required.filter((k) => !admin.permissions.has(k));
    if (missing.length > 0)
      throw new ForbiddenException(`Missing permission: ${missing.join(", ")}`);
    return true;
  }
}
