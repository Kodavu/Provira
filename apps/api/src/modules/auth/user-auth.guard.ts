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

export interface UserContext {
  id: string;
  phone?: string;
}

// Inject the authenticated user into a handler: @CurrentUser() user: UserContext
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserContext =>
    ctx.switchToHttp().getRequest().user,
);

/**
 * Verify the bearer session token on `req`, reject admin-kind tokens, attach
 * `req.user`, and return the context. Shared by UserAuthGuard and the
 * resource-ownership guard so token handling stays in one place.
 */
export async function authenticateUser(
  req: { headers: Record<string, unknown>; user?: UserContext },
  jwt: JwtService,
): Promise<UserContext> {
  const header = req.headers.authorization as string | undefined;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw new UnauthorizedException("Missing session token");

  let payload: { sub: string; phone?: string; kind?: string };
  try {
    payload = await jwt.verifyAsync(token);
  } catch {
    throw new UnauthorizedException("Invalid session token");
  }
  if (payload.kind === "admin") throw new UnauthorizedException("Not a user token");

  const ctx: UserContext = { id: payload.sub, phone: payload.phone };
  req.user = ctx;
  return ctx;
}

/**
 * Where a route carries the "owner" user id. The guard binds that id to the
 * authenticated subject, so a caller can only act on their own resources.
 * Defaults to the `userId` route param when unset.
 */
export interface OwnerBinding {
  /** Route param holding the owner id (default: "userId"). */
  param?: string;
  /** Query param holding the owner id. */
  query?: string;
  /** Body field holding the owner id. */
  body?: string;
}
export const OWNER_KEY = "user_owner_binding";
export const OwnerFrom = (binding: OwnerBinding) => SetMetadata(OWNER_KEY, binding);

/**
 * Authenticates the user session JWT (issued by AuthService on OTP verify) and
 * enforces resource ownership: it resolves the route's owner id (from the
 * configured param / query / body, defaulting to the `userId` param) and rejects
 * the request unless it matches the token's subject. Admin tokens (kind:
 * "admin") are rejected — they belong to the admin API surface.
 *
 * When a route has no owner id to bind (none of the configured sources are
 * present), the guard still requires a valid session but performs no ownership
 * check — use it as an authenticated-only gate for those handlers.
 */
@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = await authenticateUser(req, this.jwt);

    // Resolve the owner id from the configured source (handler overrides class),
    // defaulting to the conventional `userId` route param.
    const binding =
      this.reflector.getAllAndOverride<OwnerBinding>(OWNER_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? {};
    const ownerId =
      (binding.param && req.params?.[binding.param]) ??
      (binding.query && req.query?.[binding.query]) ??
      (binding.body && req.body?.[binding.body]) ??
      (!binding.param && !binding.query && !binding.body ? req.params?.userId : undefined);

    if (ownerId && ownerId !== user.id) {
      throw new ForbiddenException("You can only access your own resources");
    }
    return true;
  }
}
