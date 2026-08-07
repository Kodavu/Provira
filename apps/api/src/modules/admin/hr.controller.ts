import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { HrService } from "./hr.service.js";
import {
  AdminAuthGuard,
  AdminContext,
  CurrentAdmin,
  PermissionsGuard,
  RequirePermissions,
} from "./rbac.js";
import type { AdminStatus } from "@truvo/db";

function reqMeta(req: any) {
  return {
    ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip,
    device: req.headers["user-agent"] as string | undefined,
  };
}

@Controller("admin/staff")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class HrController {
  constructor(private readonly hr: HrService) {}

  @Get()
  @RequirePermissions("admin_users:edit")
  list() {
    return this.hr.list();
  }

  @Get("assignable-roles")
  @RequirePermissions("admin_users:assign_roles")
  roles() {
    return this.hr.assignableRoles();
  }

  @Get(":id")
  @RequirePermissions("admin_users:edit")
  detail(@Param("id") id: string) {
    return this.hr.detail(id);
  }

  @Post()
  @RequirePermissions("admin_users:create")
  invite(
    @Body() body: { email: string; fullName: string; department?: string; roleIds: string[] },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.hr.invite(body, admin, reqMeta(req));
  }

  @Patch(":id")
  @RequirePermissions("admin_users:edit")
  update(
    @Param("id") id: string,
    @Body() body: { fullName?: string; department?: string },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.hr.updateProfile(id, body, admin, reqMeta(req));
  }

  @Post(":id/status")
  @RequirePermissions("admin_users:disable")
  status(
    @Param("id") id: string,
    @Body() body: { status: AdminStatus },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.hr.setStatus(id, body.status, admin, reqMeta(req));
  }

  @Post(":id/roles")
  @RequirePermissions("admin_users:assign_roles")
  setRoles(
    @Param("id") id: string,
    @Body() body: { roleIds: string[] },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.hr.setRoles(id, body.roleIds, admin, reqMeta(req));
  }

  @Post(":id/reset-password")
  @RequirePermissions("admin_users:edit")
  reset(@Param("id") id: string, @CurrentAdmin() admin: AdminContext, @Req() req: any) {
    return this.hr.resetPassword(id, admin, reqMeta(req));
  }
}
