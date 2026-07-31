import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { Language, NotificationChannel } from "@tally/db";
import { eventDef } from "./event-registry.js";

/** {placeholder} interpolation. Unknown keys are left as-is so gaps are visible. */
function interpolate(tpl: string, data: Record<string, unknown>): string {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (data[k] != null ? String(data[k]) : `{${k}}`));
}

export interface RenderedContent {
  subject?: string;
  body: string;
}

/**
 * Resolves notification content with a fallback chain:
 *   active DB template (event × channel × language)
 *   → active DB template (event × channel × EN)
 *   → the code default in the event registry.
 * Admins edit the DB templates; the code defaults guarantee something always sends.
 */
@Injectable()
export class TemplateService {
  constructor(private readonly prisma: PrismaService) {}

  async render(
    eventKey: string,
    channel: NotificationChannel,
    language: Language,
    data: Record<string, unknown>,
  ): Promise<RenderedContent> {
    let tpl = await this.prisma.notificationTemplate.findUnique({
      where: { eventKey_channel_language: { eventKey, channel, language } },
    });
    if ((!tpl || !tpl.isActive) && language !== "EN") {
      tpl = await this.prisma.notificationTemplate.findUnique({
        where: { eventKey_channel_language: { eventKey, channel, language: "EN" } },
      });
    }
    if (tpl && tpl.isActive) {
      return {
        subject: tpl.subject ? interpolate(tpl.subject, data) : undefined,
        body: interpolate(tpl.body, data),
      };
    }
    const def = eventDef(eventKey)?.defaults;
    return {
      subject: def?.title ? interpolate(def.title, data) : undefined,
      body: def ? interpolate(def.body, data) : "",
    };
  }
}
