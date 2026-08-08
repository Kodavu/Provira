// Delivery adapters for the notification engine's non-messaging channels.
// SMS / WhatsApp / IVR already have adapters under ../messaging; these add the
// two remaining channels (email, push) behind the same interface shape so the
// backend dispatcher treats every channel uniformly.

import type { Language } from "../common.js";
import type { SendResult } from "../messaging/types.js";

export interface EmailMessage {
  to: string;
  subject: string;
  /** Plain-text body — always set, used as the text/plain fallback. */
  body: string;
  /** Optional branded HTML body. Providers should prefer this when present. */
  html?: string;
  language?: Language;
}

export interface EmailProvider {
  readonly name: string;
  sendEmail(message: EmailMessage): Promise<SendResult>;
}

export interface PushMessage {
  token: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  language?: Language;
}

export interface PushProvider {
  readonly name: string;
  sendPush(message: PushMessage): Promise<SendResult>;
}
