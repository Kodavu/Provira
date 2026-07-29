import { Module } from "@nestjs/common";
import { ChannelsController } from "./channels.controller.js";
import { ChannelRouterService } from "./channel-router.service.js";
import { AuthModule } from "../auth/auth.module.js";
import { JobsModule } from "../jobs/jobs.module.js";
import { AttendanceModule } from "../attendance/attendance.module.js";

@Module({
  imports: [AuthModule, JobsModule, AttendanceModule],
  controllers: [ChannelsController],
  providers: [ChannelRouterService],
})
export class ChannelsModule {}
