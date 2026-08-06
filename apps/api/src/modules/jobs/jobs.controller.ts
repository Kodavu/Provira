import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JobsService } from "./jobs.service.js";
import type { Language } from "@tally/db";
import { OwnerFrom, UserAuthGuard } from "../auth/user-auth.guard.js";
import { ResourceOwner, ResourceOwnerGuard } from "../auth/resource-owner.guard.js";

@Controller("jobs")
export class JobsController {
  constructor(private readonly jobs: JobsService) {}

  // Only the employer who owns the profile may post a job under it.
  @Post()
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "employerProfile", owner: "employer", body: "employerId" })
  create(
    @Body()
    body: {
      employerId: string;
      title: string;
      description?: string;
      payAmount: string; // kobo total as string to avoid JSON bigint issues
      headcount?: number;
      languages?: Language[];
      skillSlugs?: string[];
      locationId?: string;
      locationLabel?: string;
      locationState?: string;
      locationArea?: string;
      locationWard?: string;
      startAt?: string;
      endAt?: string;
    },
  ) {
    return this.jobs.create({
      ...body,
      payAmount: BigInt(body.payAmount),
      startAt: body.startAt ? new Date(body.startAt) : undefined,
      endAt: body.endAt ? new Date(body.endAt) : undefined,
    });
  }

  @Post(":id/publish")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "job", owner: "employer" })
  publish(@Param("id") id: string) {
    return this.jobs.publish(id);
  }

  // Employer funds the job's escrow holding account before work starts.
  @Post(":id/fund")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "job", owner: "employer" })
  fund(@Param("id") id: string) {
    return this.jobs.fundEscrow(id);
  }

  // Employer cancels a job; the unreleased escrow remainder is refunded to them.
  @Post(":id/cancel")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "job", owner: "employer" })
  cancel(@Param("id") id: string) {
    return this.jobs.cancel(id);
  }

  // Ranked, qualified workers to invite (not added to the job).
  @Get(":id/suggestions")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "job", owner: "employer" })
  suggestions(@Param("id") id: string) {
    return this.jobs.suggest(id);
  }

  // Employer invites a suggested worker.
  @Post(":id/invite")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "job", owner: "employer" })
  invite(@Param("id") id: string, @Body() body: { workerId: string }) {
    return this.jobs.invite(id, body.workerId);
  }

  // Worker applies to a job (pending the employer's acceptance).
  @Post(":id/apply")
  @UseGuards(UserAuthGuard)
  @OwnerFrom({ body: "userId" })
  apply(@Param("id") id: string, @Body() body: { userId: string }) {
    return this.jobs.applyToJob(id, body.userId);
  }

  // Employer accepts a pending application → worker joins + gets a code.
  @Post(":id/assignments/:assignmentId/accept")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "job", owner: "employer" })
  acceptApplication(@Param("id") id: string, @Param("assignmentId") assignmentId: string) {
    return this.jobs.acceptApplication(id, assignmentId);
  }

  // Worker accepts / declines an employer's invite.
  @Post("invites/:assignmentId/accept")
  @UseGuards(UserAuthGuard)
  @OwnerFrom({ body: "userId" })
  acceptInvite(@Param("assignmentId") assignmentId: string, @Body() body: { userId: string }) {
    return this.jobs.acceptInvite(assignmentId, body.userId);
  }

  @Post("invites/:assignmentId/decline")
  @UseGuards(UserAuthGuard)
  @OwnerFrom({ body: "userId" })
  declineInvite(@Param("assignmentId") assignmentId: string, @Body() body: { userId: string }) {
    return this.jobs.declineInvite(assignmentId, body.userId);
  }

  // Worker-safe job detail (no applicant PII). `userId` resolves my status.
  @Get(":id/public")
  publicDetail(@Param("id") id: string, @Query("userId") userId?: string) {
    return this.jobs.publicDetail(id, userId);
  }

  // Full employer detail: grouped assignments + attendance codes (has applicant
  // PII), so it's restricted to the job's own employer.
  @Get(":id")
  @UseGuards(ResourceOwnerGuard)
  @ResourceOwner({ resource: "job", owner: "employer" })
  detail(@Param("id") id: string) {
    return this.jobs.detail(id);
  }

  // Worker search across open jobs. `feed` (ALL|SKILLS|NEARBY) overrides the
  // worker's saved preference for this request.
  @Get()
  search(
    @Query("userId") userId?: string,
    @Query("q") q?: string,
    @Query("skill") skill?: string,
    @Query("feed") feed?: string,
  ) {
    return this.jobs.search(userId, q, skill, feed);
  }
}
