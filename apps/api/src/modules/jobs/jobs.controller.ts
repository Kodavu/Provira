import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { JobsService } from "./jobs.service.js";
import { EscrowService } from "../escrow/escrow.service.js";
import type { Language } from "@tally/db";

@Controller("jobs")
export class JobsController {
  constructor(
    private readonly jobs: JobsService,
    private readonly escrow: EscrowService,
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

  @Get()
  listOpen(@Query("locationId") locationId?: string) {
    return this.jobs.listOpenNear(locationId);
  }
}
