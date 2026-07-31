import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminAuthService } from "./admin-auth.service.js";
import { AdminAuthController } from "./admin-auth.controller.js";
import { AuditService } from "./audit.service.js";
import { DisputesService } from "./disputes.service.js";
import { HrService } from "./hr.service.js";
import { HrController } from "./hr.controller.js";
import { ImpersonationController } from "./impersonation.controller.js";
import { NotificationTemplatesController } from "./notification-templates.controller.js";
import { FinanceController } from "./finance.controller.js";
import { FinanceService } from "./finance.service.js";
import { NotificationsModule } from "../notifications/notifications.module.js";
import { AdminAuthGuard, PermissionsGuard } from "./rbac.js";
import {
  AdminController,
  AdminUsersController,
  AdminMetaController,
  AdminDisputesController,
} from "./admin.controllers.js";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-change-me",
      signOptions: { expiresIn: "12h" },
    }),
    NotificationsModule,
  ],
  controllers: [
    AdminAuthController,
    AdminController,
    AdminUsersController,
    AdminMetaController,
    AdminDisputesController,
    HrController,
    ImpersonationController,
    NotificationTemplatesController,
    FinanceController,
  ],
  providers: [
    AdminAuthService,
    AuditService,
    DisputesService,
    HrService,
    FinanceService,
    AdminAuthGuard,
    PermissionsGuard,
  ],
})
export class AdminModule {}
