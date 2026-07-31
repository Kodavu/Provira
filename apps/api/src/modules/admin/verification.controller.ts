import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { VerificationService } from "./verification.service.js";
import {
  AdminAuthGuard,
  AdminContext,
  CurrentAdmin,
  PermissionsGuard,
  RequirePermissions,
} from "./rbac.js";

function reqMeta(req: any) {
  return {
    ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip,
    device: req.headers["user-agent"] as string | undefined,
  };
}

@Controller("admin/verification")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class VerificationController {
  constructor(private readonly verification: VerificationService) {}

  @Get()
  @RequirePermissions("verification:review")
  queue(@Query("status") status?: string) {
    return this.verification.queue(status === "all" ? "all" : "pending");
  }

  @Get(":id")
  @RequirePermissions("verification:review")
  detail(@Param("id") id: string) {
    return this.verification.detail(id);
  }

  @Post(":id/approve")
  @RequirePermissions("verification:approve")
  approve(@Param("id") id: string, @CurrentAdmin() admin: AdminContext, @Req() req: any) {
    return this.verification.approve(id, admin, reqMeta(req));
  }

  @Post(":id/reject")
  @RequirePermissions("verification:reject")
  reject(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.verification.reject(id, body?.reason?.trim() || "Documents could not be verified", admin, reqMeta(req));
  }
}
