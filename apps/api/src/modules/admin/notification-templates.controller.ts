import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import { eventDef, listEvents } from "../notifications/event-registry.js";
import {
  AdminAuthGuard,
  AdminContext,
  CurrentAdmin,
  PermissionsGuard,
  RequirePermissions,
} from "./rbac.js";
import type { Language, NotificationChannel } from "@tally/db";

const LANGUAGES: Language[] = ["EN", "PCM", "YO", "HA", "IG"];

function reqMeta(req: any) {
  return {
    ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip,
    device: req.headers["user-agent"] as string | undefined,
  };
}

/**
 * Admin CRUD for notification content. The set of editable slots is defined by
 * the code event registry (event × its channels × the supported languages); an
 * admin only overrides the content. Deleting a template reverts that slot to the
 * EN row / code default. Every change is audited.
 */
@Controller("admin/notification-templates")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class NotificationTemplatesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("notifications:manage")
  async list(): Promise<unknown> {
    const templates = await this.prisma.notificationTemplate.findMany({
      orderBy: [{ eventKey: "asc" }, { channel: "asc" }, { language: "asc" }],
    });
    return { events: listEvents(), languages: LANGUAGES, templates };
  }

  @Put()
  @RequirePermissions("notifications:manage")
  async upsert(
    @Body()
    body: {
      eventKey: string;
      channel: NotificationChannel;
      language: Language;
      subject?: string | null;
      body: string;
      isActive?: boolean;
    },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ): Promise<unknown> {
    const ev = eventDef(body.eventKey);
    if (!ev) throw new BadRequestException("Unknown event");
    if (!ev.channels.includes(body.channel))
      throw new BadRequestException("That channel isn't used by this event");
    if (!LANGUAGES.includes(body.language)) throw new BadRequestException("Unknown language");
    if (!body.body?.trim()) throw new BadRequestException("Body is required");

    const key = {
      eventKey_channel_language: {
        eventKey: body.eventKey,
        channel: body.channel,
        language: body.language,
      },
    };
    const before = await this.prisma.notificationTemplate.findUnique({ where: key });
    const subject = body.subject?.trim() ? body.subject.trim() : null;
    const saved = await this.prisma.notificationTemplate.upsert({
      where: key,
      create: {
        eventKey: body.eventKey,
        channel: body.channel,
        language: body.language,
        subject,
        body: body.body.trim(),
        isActive: body.isActive ?? true,
        updatedByAdminId: admin.id,
      },
      update: {
        subject,
        body: body.body.trim(),
        isActive: body.isActive ?? true,
        updatedByAdminId: admin.id,
        version: { increment: 1 },
      },
    });
    await this.audit.record({
      adminUserId: admin.id,
      action: before ? "notification_template.update" : "notification_template.create",
      resource: "NotificationTemplate",
      resourceId: saved.id,
      ...reqMeta(req),
      previousValue: before ? { subject: before.subject, body: before.body, isActive: before.isActive } : undefined,
      newValue: { subject, body: body.body.trim(), isActive: body.isActive ?? true },
    });
    return saved;
  }

  @Delete(":id")
  @RequirePermissions("notifications:manage")
  async remove(
    @Param("id") id: string,
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ): Promise<unknown> {
    const tpl = await this.prisma.notificationTemplate.findUnique({ where: { id } });
    if (!tpl) throw new NotFoundException("Template not found");
    await this.prisma.notificationTemplate.delete({ where: { id } });
    await this.audit.record({
      adminUserId: admin.id,
      action: "notification_template.delete",
      resource: "NotificationTemplate",
      resourceId: id,
      ...reqMeta(req),
      previousValue: { eventKey: tpl.eventKey, channel: tpl.channel, language: tpl.language },
    });
    return { ok: true };
  }
}
