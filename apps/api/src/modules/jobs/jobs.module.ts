import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller.js";
import { JobsService } from "./jobs.service.js";
import { AttendanceModule } from "../attendance/attendance.module.js";
import { NotificationsModule } from "../notifications/notifications.module.js";

@Module({
  imports: [AttendanceModule, NotificationsModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
