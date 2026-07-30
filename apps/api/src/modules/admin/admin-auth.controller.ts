import { Body, Controller, ForbiddenException, Post, Req } from "@nestjs/common";
import { AdminAuthService } from "./admin-auth.service.js";
import { clientIp, ipAllowed } from "./rbac.js";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post("login")
  login(@Body() body: { email: string; password: string }, @Req() req: any) {
    // Enforce the IP allowlist at the door, before any credential check.
    if (!ipAllowed(clientIp(req), process.env.ADMIN_IP_ALLOWLIST)) {
      throw new ForbiddenException("Access from this network is not permitted");
    }
    const ip = clientIp(req);
    const device = req.headers["user-agent"] as string | undefined;
    return this.auth.login(body.email, body.password, { ip, device });
  }
}
