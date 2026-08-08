import { Body, Controller, Post, Req, UseGuards } from "@nestjs/common";
import { NotificationService } from "../notifications/notification.service.js";
import { AuditService } from "./audit.service.js";
import {
  AdminAuthGuard,
  AdminContext,
  CurrentAdmin,
  PermissionsGuard,
  RequirePermissions,
} from "./rbac.js";
import type { NotificationChannel } from "@provira/db";

function reqMeta(req: any) {
  return {
    ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip,
    device: req.headers["user-agent"] as string | undefined,
  };
}

/**
 * Admin broadcast: send a custom (non-templated) message to an audience over any
 * mix of channels (in-app, push, SMS, email, WhatsApp). Gated by the same
 * `notifications:manage` permission as template editing, and fully audited.
 */
@Controller("admin/notifications")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminNotificationsController {
  constructor(
    private readonly notifications: NotificationService,
    private readonly audit: AuditService,
  ) {}

  @Post("broadcast")
  @RequirePermissions("notifications:manage")
  async broadcast(
    @Body()
    body: {
      audience: "ALL" | "ROLE" | "USER";
      role?: string;
      userId?: string;
      channels: NotificationChannel[];
      title: string;
      body: string;
    },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    const result = await this.notifications.broadcast(body);
    const meta = reqMeta(req);
    await this.audit.record({
      adminUserId: admin.id,
      action: "notifications.broadcast",
      resource: "Notification",
      ip: meta.ip,
      device: meta.device,
      newValue: {
        audience: body.audience,
        role: body.role,
        userId: body.userId,
        channels: body.channels,
        title: body.title?.slice(0, 80),
        recipients: result.recipients,
        sends: result.sends,
      },
    });
    return result;
  }
}
