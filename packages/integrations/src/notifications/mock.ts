import { randomUUID } from "node:crypto";
import type { MockOutbox } from "../messaging/mock.js";
import type { SendResult } from "../messaging/types.js";
import type { EmailMessage, EmailProvider, PushMessage, PushProvider } from "./types.js";

// Mock email/push providers record to the shared outbox so the local dashboard
// and tests can see what would have been delivered — no real gateway needed.
export class MockEmailProvider implements EmailProvider {
  readonly name = "mock";
  constructor(private readonly outbox?: MockOutbox) {}
  async sendEmail(m: EmailMessage): Promise<SendResult> {
    this.outbox?.record("EMAIL", { to: m.to, body: `${m.subject}\n\n${m.body}` });
    return { providerRef: `mock_email_${randomUUID()}`, status: "sent" };
  }
}

export class MockPushProvider implements PushProvider {
  readonly name = "mock";
  constructor(private readonly outbox?: MockOutbox) {}
  async sendPush(m: PushMessage): Promise<SendResult> {
    this.outbox?.record("PUSH", { to: m.token, body: `${m.title}: ${m.body}` });
    return { providerRef: `mock_push_${randomUUID()}`, status: "sent" };
  }
}
