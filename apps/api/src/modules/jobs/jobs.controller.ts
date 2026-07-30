import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { JobsService } from "./jobs.service.js";
import { EscrowService } from "../escrow/escrow.service.js";
import { AttendanceService } from "../attendance/attendance.service.js";
import type { Language } from "@tally/db";

@Controller("jobs")
export class JobsController {
  constructor(
    private readonly jobs: JobsService,
    private readonly escrow: EscrowService,
    private readonly attendance: AttendanceService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      employerId: string;
      title: string;
      description?: string;
      payAmount: string; // kobo as string to avoid JSON bigint issues
      headcount?: number;
      languages?: Language[];
      skillSlugs?: string[];
      locationId?: string;
    },
  ) {
    return this.jobs.create({ ...body, payAmount: BigInt(body.payAmount) });
  }

  @Post(":id/publish")
  publish(@Param("id") id: string) {
    return this.jobs.publish(id);
  }

  @Post(":id/match")
  match(@Param("id") id: string) {
    return this.jobs.match(id);
  }

  // Employer funds the job's escrow holding account before work starts.
  @Post(":id/fund")
  fund(@Param("id") id: string) {
    return this.escrow.fundFromExternal(id);
  }

  // Worker applies to a job: creates their assignment and issues the 4-digit
  // confirmation code (which, in the real flow, the employer hands over on site).
  @Post(":id/apply")
  async apply(@Param("id") id: string, @Body() body: { userId: string }) {
    const assignment = await this.jobs.applyToJob(id, body.userId);
    const issued = await this.attendance.createForAssignment(assignment.id);
    return {
      assignmentId: assignment.id,
      code: issued.code,
      alreadyIssued: "alreadyIssued" in issued ? issued.alreadyIssued : false,
    };
  }

  @Get()
  listOpen(@Query("locationId") locationId?: string) {
    return this.jobs.listOpenNear(locationId);
  }
}
