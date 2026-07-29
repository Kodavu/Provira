import { Global, Module } from "@nestjs/common";
import {
  MockLlmProvider,
  MockPaymentProvider,
  MockSmsProvider,
  MockVoiceProvider,
  MockWhatsAppProvider,
  MockOutbox,
} from "@tally/integrations";

// Injection tokens. Services depend on these, never on a concrete provider.
export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
export const SMS_PROVIDER = Symbol("SMS_PROVIDER");
export const VOICE_PROVIDER = Symbol("VOICE_PROVIDER");
export const WHATSAPP_PROVIDER = Symbol("WHATSAPP_PROVIDER");
export const LLM_PROVIDER = Symbol("LLM_PROVIDER");
export const OUTBOX = Symbol("OUTBOX");

// Factory selects the adapter by env. Default "mock" keeps the whole stack
// runnable with no real API keys. Add real adapters here as they're built.
@Global()
@Module({
  providers: [
    { provide: OUTBOX, useFactory: () => new MockOutbox() },
    {
      provide: PAYMENT_PROVIDER,
      useFactory: () => {
        switch (process.env.PAYMENTS_PROVIDER) {
          // case "paystack": return new PaystackProvider(...);
          default:
            return new MockPaymentProvider();
        }
      },
    },
    {
      provide: SMS_PROVIDER,
      inject: [OUTBOX],
      useFactory: (outbox: MockOutbox) => new MockSmsProvider(outbox),
    },
    {
      provide: VOICE_PROVIDER,
      inject: [OUTBOX],
      useFactory: (outbox: MockOutbox) => new MockVoiceProvider(outbox),
    },
    {
      provide: WHATSAPP_PROVIDER,
      inject: [OUTBOX],
      useFactory: (outbox: MockOutbox) => new MockWhatsAppProvider(outbox),
    },
    { provide: LLM_PROVIDER, useFactory: () => new MockLlmProvider() },
  ],
  exports: [
    PAYMENT_PROVIDER,
    SMS_PROVIDER,
    VOICE_PROVIDER,
    WHATSAPP_PROVIDER,
    LLM_PROVIDER,
    OUTBOX,
  ],
})
export class IntegrationsModule {}
