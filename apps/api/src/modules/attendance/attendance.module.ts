import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller.js";
import { AttendanceService } from "./attendance.service.js";
import { ScoringModule } from "../scoring/scoring.module.js";

// EscrowModule and PaymentsModule are @Global, so they're available here.
@Module({
  imports: [ScoringModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
