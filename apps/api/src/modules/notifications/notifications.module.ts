import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service.js";
import { TemplateService } from "./template.service.js";
import { NotificationDispatcher } from "./dispatcher.service.js";
import { NotificationsController } from "./notifications.controller.js";
import { AuthModule } from "../auth/auth.module.js";

// IntegrationsModule is @Global, so the channel adapters the dispatcher injects
// are available without importing it here. AuthModule provides UserAuthGuard,
// which binds the user-scoped routes to the caller's own token.
@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationService, TemplateService, NotificationDispatcher],
  exports: [NotificationService],
})
export class NotificationsModule {}
