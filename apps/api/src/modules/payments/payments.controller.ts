import { Controller, Headers, Post, Req } from "@nestjs/common";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { PaymentsService } from "./payments.service.js";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // Provider posts webhooks here (public — the signature is the auth). We pass
  // the RAW request bytes so HMAC verification matches exactly what the provider
  // signed; re-serializing the parsed JSON would change the bytes and fail.
  @Post("webhook")
  webhook(@Headers() headers: Record<string, string>, @Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody ? req.rawBody.toString("utf8") : JSON.stringify(req.body ?? {});
    return this.payments.handleWebhook(headers, raw);
  }
}
