import { Body, Controller, Param, Post } from "@nestjs/common";
import { AttendanceService } from "./attendance.service.js";
import type { Channel } from "@tally/db";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Post("assignment/:assignmentId/code")
  createCode(@Param("assignmentId") assignmentId: string) {
    return this.attendance.createForAssignment(assignmentId);
  }

  @Post("assignment/:assignmentId/confirm")
  confirm(
    @Param("assignmentId") assignmentId: string,
    @Body() body: { code: string; via?: Channel },
  ) {
    return this.attendance.confirm(assignmentId, body.code, body.via);
  }
}
