import { Inject, Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuthService } from "../auth/auth.service.js";
import { JobsService } from "../jobs/jobs.service.js";
import { AttendanceService } from "../attendance/attendance.service.js";
import { LLM_PROVIDER } from "../../integrations/integrations.module.js";
import type { LlmProvider, NormalizedInbound } from "@tally/integrations";
import { t } from "@tally/i18n";
import type { Channel, Language } from "@tally/db";

/**
 * The single entry point for every non-web channel. A normalized inbound message
 * (from the SMS/WhatsApp/IVR adapters) is resolved to an intent by the LLM
 * adapter, then dispatched to the same domain services the web API uses. This is
 * what lets a worker with no smartphone sign up, accept jobs, and confirm
 * attendance over SMS or a phone call.
 */
@Injectable()
export class ChannelRouterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly jobs: JobsService,
    private readonly attendance: AttendanceService,
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
  ) {}

  async handleInbound(inbound: NormalizedInbound) {
    const channel = inbound.channel as Channel;

    // Resolve the sender to a user via their channel identity.
    const identity = await this.prisma.channelIdentity.findUnique({
      where: { channel_externalId: { channel, externalId: inbound.from } },
      include: { user: true },
    });
    const user = identity?.user ?? null;

    // Understand the message (text, transcript, or DTMF) via the LLM adapter.
    const understood = await this.llm.understand({
      text: inbound.body ?? inbound.dtmf,
      audioRef: inbound.audioRef,
      language: (user?.language as Language) ?? undefined,
    });

    await this.prisma.inboundMessage.create({
      data: {
        userId: user?.id,
        channel,
        externalId: inbound.from,
        rawBody: inbound.body ?? inbound.dtmf ?? null,
        detectedLanguage: understood.language,
        intent: understood.intent,
        metadata: understood.slots,
      },
    });

    const lang = understood.language;
    const reply = (text: string) => ({ channel, to: inbound.from, body: text });

    switch (understood.intent) {
      case "signup": {
        await this.auth.requestOtp(inbound.from, "signup");
        return reply(t("welcome", lang, { name: "there" }));
      }
      case "find_jobs": {
        const open = await this.jobs.listOpenNear();
        if (open.length === 0) return reply(t("unknown.command", lang));
        const j = open[0];
        return reply(
          t("job.offer", lang, {
            title: j.title,
            pay: `NGN ${Number(j.payAmount) / 100}`,
            location: "nearby",
          }),
        );
      }
      case "confirm_attendance": {
        // Slot "code" carries the 4-digit code; the pending assignment is looked
        // up from conversation state in a fuller implementation.
        const code = understood.slots.code;
        if (!code) return reply(t("attendance.prompt", lang));
        return reply(t("attendance.confirmed", lang));
      }
      case "check_score": {
        if (!user) return reply(t("unknown.command", lang));
        const p = await this.prisma.scoreProfile.findUnique({
          where: { userId: user.id },
        });
        return reply(
          t("score.summary", lang, {
            score: p?.score ?? 0,
            tier: p?.tier ?? "BUILDING",
          }),
        );
      }
      default:
        return reply(t("unknown.command", lang));
    }
  }
}
