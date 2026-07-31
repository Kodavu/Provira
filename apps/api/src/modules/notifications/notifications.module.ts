import { Module } from "@nestjs/common";
import { NotificationService } from "./notification.service.js";
import { TemplateService } from "./template.service.js";
import { NotificationDispatcher } from "./dispatcher.service.js";
import { NotificationsController } from "./notifications.controller.js";

// IntegrationsModule is @Global, so the channel adapters the dispatcher injects
// are available without importing it here.
@Module({
  controllers: [NotificationsController],
  providers: [NotificationService, TemplateService, NotificationDispatcher],
  exports: [NotificationService],
})
export class NotificationsModule {}
