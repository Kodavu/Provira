import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

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
 * Authenticates the user session JWT (issued by AuthService on OTP verify) and,
 * when the route carries a `:userId` param, binds it to the token's subject —
 * so a caller can only ever act on their own resources. Admin tokens (kind:
 * "admin") are rejected here; they belong to the admin API surface.
 */
@Injectable()
export class UserAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();

    const header: string | undefined = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) throw new UnauthorizedException("Missing session token");

    let payload: { sub: string; phone?: string; kind?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException("Invalid session token");
    }
    if (payload.kind === "admin") throw new UnauthorizedException("Not a user token");

    req.user = { id: payload.sub, phone: payload.phone } satisfies UserContext;

    // Ownership: a :userId in the path must match the authenticated subject.
    const routeUserId = req.params?.userId;
    if (routeUserId && routeUserId !== payload.sub) {
      throw new ForbiddenException("You can only access your own resources");
    }
    return true;
  }
}
