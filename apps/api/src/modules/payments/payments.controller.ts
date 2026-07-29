import { Body, Controller, Headers, Post } from "@nestjs/common";
import { PaymentsService } from "./payments.service.js";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  // Provider posts webhooks here. Body is captured raw for signature checks.
  @Post("webhook")
  webhook(
    @Headers() headers: Record<string, string>,
    @Body() body: unknown,
  ) {
    return this.payments.handleWebhook(headers, JSON.stringify(body));
  }
}
