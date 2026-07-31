import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { FinanceService } from "./finance.service.js";
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

@Controller("admin/finance")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class FinanceController {
  constructor(private readonly finance: FinanceService) {}

  @Get("summary")
  @RequirePermissions("finance:view_transactions")
  summary() {
    return this.finance.summary();
  }

  @Get("withdrawals")
  @RequirePermissions("finance:view_transactions")
  withdrawals(@Query("status") status?: string) {
    return this.finance.withdrawals(status === "all" ? "all" : "pending");
  }

  @Get("transactions")
  @RequirePermissions("finance:view_transactions")
  transactions() {
    return this.finance.transactions();
  }

  @Post("withdrawals/:id/approve")
  @RequirePermissions("finance:approve_withdrawals")
  approve(@Param("id") id: string, @CurrentAdmin() admin: AdminContext, @Req() req: any) {
    return this.finance.approve(id, admin, reqMeta(req));
  }

  @Post("withdrawals/:id/reject")
  @RequirePermissions("finance:approve_withdrawals")
  reject(
    @Param("id") id: string,
    @Body() body: { reason?: string },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.finance.reject(id, body?.reason?.trim() || "No reason given", admin, reqMeta(req));
  }
}
