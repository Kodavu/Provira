import { randomUUID } from "node:crypto";
import {
  NormalizedInbound,
  OutboundMessage,
  SendResult,
  SmsProvider,
  VoiceProvider,
  WhatsAppProvider,
} from "./types.js";

// All mock messaging providers record what they "sent" to an in-memory outbox
// so tests and the local dashboard can display it — no real gateway needed.
export interface OutboxEntry {
  channel: string;
  to: string;
  body: string;
  at: Date;
}

export class MockOutbox {
  readonly entries: OutboxEntry[] = [];
  record(channel: string, m: OutboundMessage) {
    this.entries.push({ channel, to: m.to, body: m.body, at: new Date() });
  }
}

export class MockSmsProvider implements SmsProvider {
  readonly name = "mock";
  constructor(private readonly outbox = new MockOutbox()) {}
  async sendSms(message: OutboundMessage): Promise<SendResult> {
    this.outbox.record("SMS", message);
    return { providerRef: `mock_sms_${randomUUID()}`, status: "sent" };
  }
  parseInbound(_h: Record<string, string>, body: string): NormalizedInbound {
    const b = JSON.parse(body);
    return { channel: "SMS", from: b.from, body: b.text, raw: b };
  }
}

export class MockVoiceProvider implements VoiceProvider {
  readonly name = "mock";
  constructor(private readonly outbox = new MockOutbox()) {}
  async placeCall(message: OutboundMessage): Promise<SendResult> {
    this.outbox.record("IVR", message);
    return { providerRef: `mock_ivr_${randomUUID()}`, status: "queued" };
  }
  parseInbound(_h: Record<string, string>, body: string): NormalizedInbound {
    const b = JSON.parse(body);
    return { channel: "IVR", from: b.from, dtmf: b.dtmf, audioRef: b.audioRef, raw: b };
  }
}

export class MockWhatsAppProvider implements WhatsAppProvider {
  readonly name = "mock";
  constructor(private readonly outbox = new MockOutbox()) {}
  async sendMessage(message: OutboundMessage): Promise<SendResult> {
    this.outbox.record("WHATSAPP", message);
    return { providerRef: `mock_wa_${randomUUID()}`, status: "sent" };
  }
  parseInbound(_h: Record<string, string>, body: string): NormalizedInbound {
    const b = JSON.parse(body);
    return { channel: "WHATSAPP", from: b.from, body: b.text, audioRef: b.audioRef, raw: b };
  }
}
