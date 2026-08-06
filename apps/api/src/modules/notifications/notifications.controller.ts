import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { zNotificationFeed, zNotificationPreferences } from "@tally/contracts";
import type { NotificationCategory, NotificationChannel } from "@tally/db";
import { NotificationService } from "./notification.service.js";
import { UserAuthGuard } from "../auth/user-auth.guard.js";

/**
 * User-facing notification endpoints. Nested under /users/:userId to match the
 * rest of the user API's convention. UserAuthGuard authenticates the session
 * token and binds :userId to the caller's own subject, so a user can only read,
 * mutate, or delete their own notifications.
 */
@Controller("users/:userId/notifications")
@UseGuards(UserAuthGuard)
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

  @Delete("clear")
  async clear(@Param("userId") userId: string, @Query("onlyRead") onlyRead?: string) {
    return zNotificationFeed.parse(await this.notifications.clear(userId, onlyRead === "true"));
  }

  @Delete(":id")
  async remove(@Param("userId") userId: string, @Param("id") id: string) {
    return zNotificationFeed.parse(await this.notifications.deleteOne(userId, id));
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
