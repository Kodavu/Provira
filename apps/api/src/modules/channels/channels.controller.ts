import { Body, Controller, Headers, Inject, Post } from "@nestjs/common";
import { ChannelRouterService } from "./channel-router.service.js";
import {
  SMS_PROVIDER,
  WHATSAPP_PROVIDER,
  VOICE_PROVIDER,
} from "../../integrations/integrations.module.js";
import type {
  SmsProvider,
  WhatsAppProvider,
  VoiceProvider,
} from "@provira/integrations";

/**
 * Inbound webhooks from each channel gateway. Each provider adapter parses its
 * own payload into the shared NormalizedInbound shape; the router does the rest.
 */
@Controller("channels")
export class ChannelsController {
  constructor(
    private readonly router: ChannelRouterService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
    @Inject(WHATSAPP_PROVIDER) private readonly whatsapp: WhatsAppProvider,
    @Inject(VOICE_PROVIDER) private readonly voice: VoiceProvider,
  ) {}

  @Post("sms/inbound")
  smsInbound(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    return this.router.handleInbound(
      this.sms.parseInbound(headers, JSON.stringify(body)),
    );
  }

  @Post("whatsapp/inbound")
  whatsappInbound(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    return this.router.handleInbound(
      this.whatsapp.parseInbound(headers, JSON.stringify(body)),
    );
  }

  @Post("ivr/inbound")
  ivrInbound(@Headers() headers: Record<string, string>, @Body() body: unknown) {
    return this.router.handleInbound(
      this.voice.parseInbound(headers, JSON.stringify(body)),
    );
  }
}
