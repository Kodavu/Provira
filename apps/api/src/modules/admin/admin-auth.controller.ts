import { Body, Controller, Post, Req } from "@nestjs/common";
import { AdminAuthService } from "./admin-auth.service.js";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(private readonly auth: AdminAuthService) {}

  @Post("login")
  login(@Body() body: { email: string; password: string }, @Req() req: any) {
    const ip =
      (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip;
    const device = req.headers["user-agent"] as string | undefined;
    return this.auth.login(body.email, body.password, { ip, device });
  }
}
