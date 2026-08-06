import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { AttendanceService } from "./attendance.service.js";
import type { Channel } from "@tally/db";
import { ResourceOwner, ResourceOwnerGuard } from "../auth/resource-owner.guard.js";

@Controller("attendance")
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  // Issuing/regenerating the on-site code is the employer's action.
  @Post("assignment/:assignmentId/code")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "jobAssignment", owner: "employer", param: "assignmentId" })
  createCode(@Param("assignmentId") assignmentId: string) {
    return this.attendance.createForAssignment(assignmentId);
  }

  // The assigned worker confirms their own attendance with the code.
  @Post("assignment/:assignmentId/confirm")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "jobAssignment", owner: "worker", param: "assignmentId" })
  confirm(
    @Param("assignmentId") assignmentId: string,
    @Body() body: { code: string; via?: Channel },
  ) {
    return this.attendance.confirm(assignmentId, body.code, body.via);
  }
}
