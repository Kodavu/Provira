import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { TradersService } from "./traders.service.js";
import { UserAuthGuard } from "../auth/user-auth.guard.js";

// Trader's own dashboard + sales log, bound to the caller via `:userId`.
@Controller("traders")
@UseGuards(UserAuthGuard)
export class TradersController {
  constructor(private readonly traders: TradersService) {}

  @Get(":userId/dashboard")
  dashboard(@Param("userId") userId: string) {
    return this.traders.dashboard(userId);
  }

  @Get(":userId/reports")
  reports(@Param("userId") userId: string, @Query("days") days?: string) {
    return this.traders.reports(userId, days ? Number(days) : undefined);
  }

  @Post(":userId/sales")
  logSale(
    @Param("userId") userId: string,
    @Body() body: { amount: string; method?: string },
  ) {
    return this.traders.logSale(userId, BigInt(body.amount), body.method);
  }
}
