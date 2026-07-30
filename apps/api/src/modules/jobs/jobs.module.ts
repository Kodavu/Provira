import { Module } from "@nestjs/common";
import { JobsController } from "./jobs.controller.js";
import { JobsService } from "./jobs.service.js";
import { AttendanceModule } from "../attendance/attendance.module.js";

@Module({
  imports: [AttendanceModule],
  controllers: [JobsController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
