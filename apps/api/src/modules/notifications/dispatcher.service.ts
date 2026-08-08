import { Inject, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { renderBrandedEmail } from "./email-layout.js";
import {
  EMAIL_PROVIDER,
  PUSH_PROVIDER,
  SMS_PROVIDER,
  VOICE_PROVIDER,
  WHATSAPP_PROVIDER,
} from "../../integrations/integrations.module.js";
import type {
  EmailProvider,
  PushProvider,
  SmsProvider,
  VoiceProvider,
  WhatsAppProvider,
} from "@truvo/integrations";
import type { Language, NotificationChannel } from "@truvo/db";

// The subset of a Notification (plus its recipient contact fields) the
// dispatcher needs to deliver on an external channel.
export interface Dispatchable {
  id: string;
  userId: string;
  channel: NotificationChannel;
  language: Language;
  title: string | null;
  body: string;
  data: unknown;
  user: { phone: string; email: string | null };
}

/**
 * Delivers a persisted Notification over its channel and records the outcome.
 * INAPP needs no external send (the row is the delivery). Every external send
 * is wrapped so a provider failure marks the row FAILED (with the error and an
 * incremented attempt count) rather than throwing into the caller — the row is
 * the durable record a retry sweep can pick up.
 */
@Injectable()
export class NotificationDispatcher {
  private readonly log = new Logger("NotificationDispatcher");

  constructor(
    private readonly prisma: PrismaService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsAppProvider,
    @Inject(VOICE_PROVIDER) private readonly voice: VoiceProvider,
    @Inject(EMAIL_PROVIDER) private readonly email: EmailProvider,
    @Inject(PUSH_PROVIDER) private readonly push: PushProvider,
  ) {}

  async dispatch(n: Dispatchable): Promise<void> {
    if (n.channel === "INAPP") return; // the row itself is the delivery
    try {
      const providerRef = await this.send(n);
      await this.prisma.notification.update({
        where: { id: n.id },
        data: { status: "SENT", providerRef, sentAt: new Date(), attempts: { increment: 1 }, error: null },
      });
    } catch (e) {
      const message = (e as Error).message;
      await this.prisma.notification.update({
        where: { id: n.id },
        data: { status: "FAILED", attempts: { increment: 1 }, error: message },
      });
      this.log.warn(`send failed for ${n.id} (${n.channel}): ${message}`);
    }
  }

  private async send(n: Dispatchable): Promise<string> {
    const { language } = n;
    switch (n.channel) {
      case "SMS":
        return (await this.sms.sendSms({ to: n.user.phone, body: n.body, language })).providerRef;
      case "WHATSAPP":
        return (await this.whatsapp.sendMessage({ to: n.user.phone, body: n.body, language })).providerRef;
      case "IVR":
        return (await this.voice.placeCall({ to: n.user.phone, body: n.body, language })).providerRef;
      case "EMAIL": {
        if (!n.user.email) throw new Error("no email on file");
        return (
          await this.email.sendEmail({
            to: n.user.email,
            subject: n.title ?? "Truvo",
            body: n.body,
            html: renderBrandedEmail({ title: n.title, body: n.body }),
            language,
          })
        ).providerRef;
      }
      case "PUSH": {
        const device = await this.prisma.pushDevice.findFirst({
          where: { userId: n.userId },
          orderBy: { lastSeenAt: "desc" },
        });
        if (!device) throw new Error("no registered device");
        return (
          await this.push.sendPush({
            token: device.token,
            title: n.title ?? "Truvo",
            body: n.body,
            data: (n.data as Record<string, unknown>) ?? undefined,
            language,
          })
        ).providerRef;
      }
      default:
        throw new Error(`unsupported channel ${n.channel}`);
    }
  }
}
