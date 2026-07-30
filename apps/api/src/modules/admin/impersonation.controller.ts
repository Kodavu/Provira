import { BadRequestException, Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import {
  AdminAuthGuard,
  AdminContext,
  CurrentAdmin,
  PermissionsGuard,
  RequirePermissions,
  clientIp,
} from "./rbac.js";

/**
 * Impersonation with separation of duties. READ ("view as") is self-service and
 * auto-approved. WRITE ("act as") creates a PENDING grant that a DIFFERENT admin
 * with impersonation:approve must approve — so acting as a user always takes two
 * people, and both are on the audit record.
 */
@Controller("admin/impersonation")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class ImpersonationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  @RequirePermissions("impersonation:request")
  async request(
    @Body() body: { targetUserId: string; mode: "READ" | "WRITE"; reason: string },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    if (!body.reason?.trim()) throw new BadRequestException("A reason is required");
    const target = await this.prisma.user.findUnique({ where: { id: body.targetUserId }, select: { id: true } });
    if (!target) throw new NotFoundException("Target user not found");

    const autoApprove = body.mode === "READ";
    const grant = await this.prisma.impersonationGrant.create({
      data: {
        requestedById: admin.id,
        targetUserId: body.targetUserId,
        mode: body.mode,
        reason: body.reason.trim(),
        status: autoApprove ? "APPROVED" : "PENDING",
        approvedById: autoApprove ? admin.id : null,
        decidedAt: autoApprove ? new Date() : null,
      },
    });
    await this.audit.record({
      adminUserId: admin.id,
      action: "impersonation.request",
      resource: "User",
      resourceId: body.targetUserId,
      ip: clientIp(req),
      device: req.headers["user-agent"],
      newValue: { mode: body.mode, status: grant.status, reason: grant.reason },
    });
    return grant;
  }

  @Get("pending")
  @RequirePermissions("impersonation:approve")
  pending() {
    return this.prisma.impersonationGrant.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: { select: { fullName: true } },
        targetUser: { select: { fullName: true, phone: true } },
      },
    });
  }

  @Post(":id/approve")
  @RequirePermissions("impersonation:approve")
  async approve(@Param("id") id: string, @CurrentAdmin() admin: AdminContext, @Req() req: any) {
    const grant = await this.prisma.impersonationGrant.findUnique({ where: { id } });
    if (!grant) throw new NotFoundException("Grant not found");
    if (grant.status !== "PENDING") throw new BadRequestException("Grant is not pending");
    // Separation of duties: you cannot approve your own request.
    if (grant.requestedById === admin.id)
      throw new BadRequestException("You can't approve your own impersonation request");

    const updated = await this.prisma.impersonationGrant.update({
      where: { id },
      data: { status: "APPROVED", approvedById: admin.id, decidedAt: new Date() },
    });
    await this.audit.record({
      adminUserId: admin.id,
      action: "impersonation.approve",
      resource: "User",
      resourceId: grant.targetUserId,
      ip: clientIp(req),
      device: req.headers["user-agent"],
      newValue: { grantId: id, requestedById: grant.requestedById, approvedById: admin.id, mode: grant.mode },
    });
    return updated;
  }
}
