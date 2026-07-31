import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { zNotificationFeed, zNotificationPreferences } from "@tally/contracts";
import type { NotificationCategory, NotificationChannel } from "@tally/db";
import { NotificationService } from "./notification.service.js";

/**
 * User-facing notification endpoints. Nested under /users/:userId to match the
 * rest of the user API's convention. (The user API is currently unauthenticated
 * app-wide — a session guard binding token.sub to :userId is tracked as separate
 * platform hardening, not introduced here in isolation.)
 */
@Controller("users/:userId/notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  async feed(@Param("userId") userId: string, @Query("limit") limit?: string) {
    return zNotificationFeed.parse(await this.notifications.feed(userId, limit ? Number(limit) : undefined));
  }

  @Post("read-all")
  async readAll(@Param("userId") userId: string) {
    return zNotificationFeed.parse(await this.notifications.markAllRead(userId));
  }

  @Post(":id/read")
  async read(@Param("userId") userId: string, @Param("id") id: string) {
    return zNotificationFeed.parse(await this.notifications.markRead(userId, id));
  }

  @Get("preferences")
  async preferences(@Param("userId") userId: string) {
    return zNotificationPreferences.parse(await this.notifications.getPreferences(userId));
  }

  @Put("preferences")
  setPreference(
    @Param("userId") userId: string,
    @Body() body: { category: NotificationCategory; channel: NotificationChannel; enabled: boolean },
  ) {
    return this.notifications.setPreference(userId, body.category, body.channel, body.enabled);
  }

  @Put("settings")
  setSetting(
    @Param("userId") userId: string,
    @Body() body: { muteAll?: boolean; quietStart?: number | null; quietEnd?: number | null },
  ) {
    return this.notifications.updateSetting(userId, body);
  }

  @Post("devices")
  registerDevice(
    @Param("userId") userId: string,
    @Body() body: { token: string; platform: string; provider?: string },
  ) {
    return this.notifications.registerDevice(userId, body.token, body.platform, body.provider);
  }
}
