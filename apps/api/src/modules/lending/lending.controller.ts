import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { LendingService } from "./lending.service.js";
import { OwnerFrom, UserAuthGuard } from "../auth/user-auth.guard.js";

@Controller("lending")
@UseGuards(UserAuthGuard)
export class LendingController {
  constructor(private readonly lending: LendingService) {}

  @Get("eligibility/:userId")
  eligibility(@Param("userId") userId: string) {
    return this.lending.eligibility(userId);
  }

  @Post("apply")
  @OwnerFrom({ body: "userId" })
  apply(@Body() body: { userId: string; productId: string; amount: string }) {
    return this.lending.apply(body.userId, body.productId, BigInt(body.amount));
  }

  @Post("disburse/:applicationId")
  disburse(@Param("applicationId") applicationId: string) {
    return this.lending.disburse(applicationId);
  }
}
