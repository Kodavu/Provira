import { Module } from "@nestjs/common";
import { TradersController } from "./traders.controller.js";
import { TradersService } from "./traders.service.js";
import { ScoringModule } from "../scoring/scoring.module.js";

@Module({
  imports: [ScoringModule],
  controllers: [TradersController],
  providers: [TradersService],
})
export class TradersModule {}
