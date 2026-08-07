import { randomInt, createHash } from "node:crypto";
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../../prisma/prisma.service.js";
import { SMS_PROVIDER } from "../../integrations/integrations.module.js";
import type { SmsProvider } from "@truvo/integrations";
import { t } from "@truvo/i18n";

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject(SMS_PROVIDER) private readonly sms: SmsProvider,
  ) {}

  /**
   * Phone-first signup/login: create an OTP challenge and dispatch it over SMS.
   * Works identically whether the request originates from web, WhatsApp, or IVR
   * — the channel just changes where the code is delivered.
   */
  async requestOtp(phone: string, purpose: "login" | "signup" = "login") {
    const code = String(randomInt(1000, 10000)); // 4-digit
    const ttl = Number(process.env.OTP_TTL_SECONDS ?? 300);

    // Ensure a user shell exists so we can attach the challenge and later roles.
    const user = await this.prisma.user.upsert({
      where: { phone },
      create: { phone },
      update: {},
    });

    await this.prisma.otpChallenge.create({
      data: {
        userId: user.id,
        phone,
        codeHash: hashCode(code),
        purpose,
        expiresAt: new Date(Date.now() + ttl * 1000),
      },
    });

    await this.sms.sendSms({
      to: phone,
      body: t("otp.code", user.language, { code }),
      language: user.language,
    });

    // In dev with the mock provider, surface the code so testing is friction-free.
    const devCode = process.env.NODE_ENV !== "production" ? code : undefined;
    return { sent: true, devCode };
  }

  /** Verify the latest unconsumed OTP and issue a session token. */
  async verifyOtp(phone: string, code: string) {
    const challenge = await this.prisma.otpChallenge.findFirst({
      where: { phone, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (!challenge) throw new BadRequestException("No pending code for this number");
    if (challenge.expiresAt < new Date())
      throw new UnauthorizedException("Code expired");
    if (challenge.attempts >= challenge.maxAttempts)
      throw new UnauthorizedException("Too many attempts");

    if (challenge.codeHash !== hashCode(code)) {
      await this.prisma.otpChallenge.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException("Invalid code");
    }

    const user = await this.prisma.user.update({
      where: { phone },
      data: { status: "ACTIVE" },
    });
    await this.prisma.otpChallenge.update({
      where: { id: challenge.id },
      data: { consumedAt: new Date() },
    });

    const token = await this.jwt.signAsync({ sub: user.id, phone: user.phone });
    return { token, user: { id: user.id, phone: user.phone, status: user.status } };
  }
}
