import { Global, Module } from "@nestjs/common";
import {
  MockLlmProvider,
  MockPaymentProvider,
  MockSmsProvider,
  MockVoiceProvider,
  MockWhatsAppProvider,
  MockEmailProvider,
  MockPushProvider,
  MockStorageProvider,
  MockOutbox,
  SquadPaymentProvider,
} from "@provira/integrations";

// Injection tokens. Services depend on these, never on a concrete provider.
export const PAYMENT_PROVIDER = Symbol("PAYMENT_PROVIDER");
export const SMS_PROVIDER = Symbol("SMS_PROVIDER");
export const VOICE_PROVIDER = Symbol("VOICE_PROVIDER");
export const WHATSAPP_PROVIDER = Symbol("WHATSAPP_PROVIDER");
export const EMAIL_PROVIDER = Symbol("EMAIL_PROVIDER");
export const PUSH_PROVIDER = Symbol("PUSH_PROVIDER");
export const STORAGE_PROVIDER = Symbol("STORAGE_PROVIDER");
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
          case "squad":
            return new SquadPaymentProvider({
              secretKey: process.env.SQUAD_SECRET_KEY ?? "",
              merchantId: process.env.SQUAD_MERCHANT_ID ?? "",
              baseUrl: process.env.SQUAD_BASE_URL, // defaults to sandbox
              publicKey: process.env.SQUAD_PUBLIC_KEY,
            });
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
    {
      provide: EMAIL_PROVIDER,
      inject: [OUTBOX],
      useFactory: (outbox: MockOutbox) => {
        switch (process.env.EMAIL_PROVIDER) {
          // case "sendgrid": return new SendgridProvider(...);
          // case "ses": return new SesProvider(...);
          default:
            return new MockEmailProvider(outbox);
        }
      },
    },
    {
      provide: PUSH_PROVIDER,
      inject: [OUTBOX],
      useFactory: (outbox: MockOutbox) => {
        switch (process.env.PUSH_PROVIDER) {
          // case "expo": return new ExpoPushProvider(...);
          // case "fcm": return new FcmProvider(...);
          default:
            return new MockPushProvider(outbox);
        }
      },
    },
    {
      provide: STORAGE_PROVIDER,
      useFactory: () => {
        switch (process.env.STORAGE_PROVIDER) {
          // case "s3": return new S3StorageProvider(...);
          // case "gcs": return new GcsStorageProvider(...);
          default:
            return new MockStorageProvider({
              baseDir: process.env.STORAGE_DIR,
              publicBaseUrl: process.env.PUBLIC_API_URL,
            });
        }
      },
    },
    { provide: LLM_PROVIDER, useFactory: () => new MockLlmProvider() },
  ],
  exports: [
    PAYMENT_PROVIDER,
    SMS_PROVIDER,
    VOICE_PROVIDER,
    WHATSAPP_PROVIDER,
    EMAIL_PROVIDER,
    PUSH_PROVIDER,
    STORAGE_PROVIDER,
    LLM_PROVIDER,
    OUTBOX,
  ],
})
export class IntegrationsModule {}
