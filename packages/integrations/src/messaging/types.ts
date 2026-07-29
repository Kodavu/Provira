// Channel messaging interfaces (SMS, voice/IVR, WhatsApp). Each provider adapter
// normalizes its own webhook payloads into InboundMessage so the backend's
// channel router handles one shape regardless of transport.

import type { Channel, Language } from "../common.js";

export interface OutboundMessage {
  to: string; // msisdn or wa_id
  body: string;
  language?: Language;
}

export interface SendResult {
  providerRef: string;
  status: "sent" | "queued" | "failed";
}

export interface NormalizedInbound {
  channel: Channel;
  from: string; // sender channel id
  body?: string; // text or transcript
  // For IVR: the raw DTMF the caller pressed (e.g. "1234").
  dtmf?: string;
  // For voice notes: a URL/base64 the LLM adapter can transcribe.
  audioRef?: string;
  raw: unknown;
}

export interface SmsProvider {
  readonly name: string;
  sendSms(message: OutboundMessage): Promise<SendResult>;
  parseInbound(headers: Record<string, string>, body: string): NormalizedInbound;
}

export interface VoiceProvider {
  readonly name: string;
  /** Place an outbound IVR call reading `body` (TTS) in the given language. */
  placeCall(message: OutboundMessage): Promise<SendResult>;
  parseInbound(headers: Record<string, string>, body: string): NormalizedInbound;
}

export interface WhatsAppProvider {
  readonly name: string;
  sendMessage(message: OutboundMessage): Promise<SendResult>;
  parseInbound(headers: Record<string, string>, body: string): NormalizedInbound;
}
