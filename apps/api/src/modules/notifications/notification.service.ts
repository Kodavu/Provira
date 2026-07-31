import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { Language, NotificationCategory, NotificationChannel } from "@tally/db";
import { eventDef } from "./event-registry.js";
import { TemplateService } from "./template.service.js";
import { NotificationDispatcher } from "./dispatcher.service.js";

// Categories that always send, regardless of a user's preferences or global mute.
const ALWAYS_ON: NotificationCategory[] = ["SECURITY", "TRANSACTIONAL"];

export interface NotifyOptions {
  language?: Language;
  /** When set, a matching (user, channel, dedupeKey) row suppresses a duplicate. */
  dedupeKey?: string;
}

// Explicit return shapes keep Prisma's internal types out of the emitted .d.ts
// (avoids TS2742 "not portable" across the workspace).
export interface FeedResult {
  items: unknown[];
  unread: number;
}
export interface PreferencesResult {
  preferences: Array<{ category: NotificationCategory; channel: NotificationChannel; enabled: boolean }>;
  setting: { muteAll: boolean; quietStart: number | null; quietEnd: number | null };
}

/**
 * The one entry point domain code calls: notify(userId, eventKey, data). It
 * resolves the recipient's routing (preferences + deliverability), renders each
 * channel's content from templates, persists a Notification row per channel
 * (the durable outbox + in-app feed), and dispatches the external ones.
 */
@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplateService,
    private readonly dispatcher: NotificationDispatcher,
  ) {}

  async notify(
    userId: string,
    eventKey: string,
    data: Record<string, unknown> = {},
    opts: NotifyOptions = {},
  ): Promise<unknown[]> {
    const def = eventDef(eventKey);
    if (!def) return [];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        email: true,
        language: true,
        channelIdentities: { select: { channel: true } },
        notificationSetting: true,
        notificationPrefs: { where: { category: def.category } },
        pushDevices: { select: { id: true }, take: 1 },
      },
    });
    if (!user) return [];

    const language = opts.language ?? user.language;
    const mutable = !ALWAYS_ON.includes(def.category);

    // Global mute only silences mutable categories.
    if (mutable && user.notificationSetting?.muteAll) return [];

    const prefEnabled = new Map(user.notificationPrefs.map((p) => [p.channel, p.enabled]));
    const identities = new Set(user.channelIdentities.map((c) => c.channel));
    const hasDevice = user.pushDevices.length > 0;

    const created = [];
    for (const channel of def.channels) {
      if (!this.deliverable(channel, user.email, identities, hasDevice)) continue;
      // Preference gate applies to mutable categories only; default is on.
      if (mutable && prefEnabled.get(channel) === false) continue;

      if (opts.dedupeKey) {
        const dupe = await this.prisma.notification.findFirst({
          where: { userId, channel, dedupeKey: opts.dedupeKey },
          select: { id: true },
        });
        if (dupe) continue;
      }

      const { subject, body } = await this.templates.render(eventKey, channel, language, data);
      if (!body) continue;

      const inApp = channel === "INAPP";
      const n = await this.prisma.notification.create({
        data: {
          userId,
          category: def.category,
          eventKey,
          channel,
          language,
          title: subject ?? null,
          body,
          data: (data as object) ?? undefined,
          dedupeKey: opts.dedupeKey ?? null,
          status: inApp ? "SENT" : "PENDING",
          sentAt: inApp ? new Date() : null,
        },
        include: { user: { select: { phone: true, email: true } } },
      });
      created.push(n);
      if (!inApp) await this.dispatcher.dispatch(n);
    }
    return created;
  }

  private deliverable(
    channel: NotificationChannel,
    email: string | null,
    identities: Set<string>,
    hasDevice: boolean,
  ): boolean {
    switch (channel) {
      case "INAPP":
        return true;
      case "SMS":
        return true; // phone is the primary identifier — everyone has one
      case "EMAIL":
        return !!email;
      case "PUSH":
        return hasDevice;
      case "WHATSAPP":
        return identities.has("WHATSAPP");
      case "IVR":
        return identities.has("IVR");
      default:
        return false;
    }
  }

  // --- In-app feed ---

  async feed(userId: string, limit = 30): Promise<FeedResult> {
    const [items, unread] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, channel: "INAPP" },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId, channel: "INAPP", readAt: null } }),
    ]);
    return { items, unread };
  }

  async markRead(userId: string, id: string): Promise<FeedResult> {
    await this.prisma.notification.updateMany({
      where: { id, userId, channel: "INAPP", readAt: null },
      data: { readAt: new Date(), status: "READ" },
    });
    return this.feed(userId);
  }

  async markAllRead(userId: string): Promise<FeedResult> {
    await this.prisma.notification.updateMany({
      where: { userId, channel: "INAPP", readAt: null },
      data: { readAt: new Date(), status: "READ" },
    });
    return this.feed(userId);
  }

  // --- Preferences ---

  async getPreferences(userId: string): Promise<PreferencesResult> {
    const [prefs, setting] = await Promise.all([
      this.prisma.notificationPreference.findMany({ where: { userId } }),
      this.prisma.notificationSetting.findUnique({ where: { userId } }),
    ]);
    return {
      preferences: prefs.map((p) => ({ category: p.category, channel: p.channel, enabled: p.enabled })),
      setting: {
        muteAll: setting?.muteAll ?? false,
        quietStart: setting?.quietStart ?? null,
        quietEnd: setting?.quietEnd ?? null,
      },
    };
  }

  async setPreference(
    userId: string,
    category: NotificationCategory,
    channel: NotificationChannel,
    enabled: boolean,
  ): Promise<PreferencesResult> {
    await this.prisma.notificationPreference.upsert({
      where: { userId_category_channel: { userId, category, channel } },
      create: { userId, category, channel, enabled },
      update: { enabled },
    });
    return this.getPreferences(userId);
  }

  async updateSetting(
    userId: string,
    patch: { muteAll?: boolean; quietStart?: number | null; quietEnd?: number | null },
  ): Promise<PreferencesResult> {
    await this.prisma.notificationSetting.upsert({
      where: { userId },
      create: { userId, ...patch },
      update: patch,
    });
    return this.getPreferences(userId);
  }

  // --- Push device registration (used once push is wired) ---

  async registerDevice(userId: string, token: string, platform: string, provider = "expo"): Promise<unknown> {
    return this.prisma.pushDevice.upsert({
      where: { token },
      create: { userId, token, platform, provider },
      update: { userId, platform, provider, lastSeenAt: new Date() },
    });
  }
}
