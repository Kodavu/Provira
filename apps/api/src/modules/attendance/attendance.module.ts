import { Module } from "@nestjs/common";
import { AttendanceController } from "./attendance.controller.js";
import { AttendanceService } from "./attendance.service.js";
import { ScoringModule } from "../scoring/scoring.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

// EscrowModule is @Global, so it's available here without importing.
@Module({
  imports: [ScoringModule, NotificationsModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
