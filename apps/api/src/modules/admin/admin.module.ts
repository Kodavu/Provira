import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AdminAuthService } from "./admin-auth.service.js";
import { AdminAuthController } from "./admin-auth.controller.js";
import { AuditService } from "./audit.service.js";
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
  ],
  controllers: [
    AdminAuthController,
    AdminController,
    AdminUsersController,
    AdminMetaController,
    AdminDisputesController,
  ],
  providers: [
    AdminAuthService,
    AuditService,
    AdminAuthGuard,
    PermissionsGuard,
  ],
})
export class AdminModule {}
