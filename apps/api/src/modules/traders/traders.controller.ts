import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { TradersService } from "./traders.service.js";

@Controller("traders")
export class TradersController {
  constructor(private readonly traders: TradersService) {}

  @Get(":userId/dashboard")
  dashboard(@Param("userId") userId: string) {
    return this.traders.dashboard(userId);
  }

  @Post(":userId/sales")
  logSale(
    @Param("userId") userId: string,
    @Body() body: { amount: string; method?: string },
  ) {
    return this.traders.logSale(userId, BigInt(body.amount), body.method);
  }
}
