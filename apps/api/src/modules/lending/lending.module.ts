import { Module } from "@nestjs/common";
import { LendingController } from "./lending.controller.js";
import { LendingService } from "./lending.service.js";

@Module({
  controllers: [LendingController],
  providers: [LendingService],
  exports: [LendingService],
})
export class LendingModule {}
