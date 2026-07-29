import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { LendingService } from "./lending.service.js";

@Controller("lending")
export class LendingController {
  constructor(private readonly lending: LendingService) {}

  @Get("eligibility/:userId")
  eligibility(@Param("userId") userId: string) {
    return this.lending.eligibility(userId);
  }

  @Post("apply")
  apply(@Body() body: { userId: string; productId: string; amount: string }) {
    return this.lending.apply(body.userId, body.productId, BigInt(body.amount));
  }

  @Post("disburse/:applicationId")
  disburse(@Param("applicationId") applicationId: string) {
    return this.lending.disburse(applicationId);
  }
}
