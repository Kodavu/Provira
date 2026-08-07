import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import {
  AdminAuthGuard,
  AdminContext,
  CurrentAdmin,
  PermissionsGuard,
  RequirePermissions,
  clientIp,
} from "./rbac.js";
import type { Language } from "@truvo/db";

// A consumed session is valid for this long before it must be re-requested.
const SESSION_TTL_MS = 30 * 60 * 1000;
const LANGUAGES: Language[] = ["EN", "PCM", "YO", "HA", "IG"];

/**
 * Impersonation with separation of duties. READ ("view as") is self-service and
 * auto-approved. WRITE ("act as") needs a DIFFERENT admin's approval. Consuming
 * an approved grant starts a short-lived, one-time session; the impersonated
 * user's data is then read (and, for WRITE, acted on) through THESE admin
 * endpoints — authorized by the live grant and audited to the admin, never the
 * user. There is no user-facing impersonation token, so nothing here depends on
 * user-session auth.
 */
@Controller("admin/impersonation")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class ImpersonationController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  @Post()
  @RequirePermissions("impersonation:request")
  async request(
    @Body() body: { targetUserId: string; mode: "READ" | "WRITE"; reason: string },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ): Promise<unknown> {
    if (!body.reason?.trim()) throw new BadRequestException("A reason is required");
    if (body.mode !== "READ" && body.mode !== "WRITE") throw new BadRequestException("Invalid mode");
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

  /** The requester's own grants — the "your access" list, newest first. */
  @Get("mine")
  @RequirePermissions("impersonation:request")
  async mine(@CurrentAdmin() admin: AdminContext): Promise<unknown> {
    const grants = await this.prisma.impersonationGrant.findMany({
      where: { requestedById: admin.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { targetUser: { select: { fullName: true, phone: true } } },
    });
    const now = Date.now();
    return grants.map((g) => ({
      ...g,
      active: g.status === "CONSUMED" && !!g.expiresAt && g.expiresAt.getTime() > now,
    }));
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
  async approve(@Param("id") id: string, @CurrentAdmin() admin: AdminContext, @Req() req: any): Promise<unknown> {
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

  /** Start the session: one-time, requester-only, from an APPROVED grant. */
  @Post(":id/consume")
  @RequirePermissions("impersonation:request")
  async consume(@Param("id") id: string, @CurrentAdmin() admin: AdminContext, @Req() req: any): Promise<unknown> {
    const grant = await this.prisma.impersonationGrant.findUnique({ where: { id } });
    if (!grant) throw new NotFoundException("Grant not found");
    if (grant.requestedById !== admin.id) throw new ForbiddenException("This grant isn't yours");
    if (grant.status !== "APPROVED") throw new BadRequestException("Grant is not approved");

    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const updated = await this.prisma.impersonationGrant.update({
      where: { id },
      data: { status: "CONSUMED", consumedAt: new Date(), expiresAt },
    });
    await this.audit.record({
      adminUserId: admin.id,
      action: "impersonation.consume",
      resource: "User",
      resourceId: grant.targetUserId,
      ip: clientIp(req),
      device: req.headers["user-agent"],
      newValue: { grantId: id, mode: grant.mode, expiresAt },
    });
    return updated;
  }

  /** The impersonated user's snapshot — the "view as" surface (READ or WRITE). */
  @Get(":id/view")
  @RequirePermissions("impersonation:request")
  async view(@Param("id") id: string, @CurrentAdmin() admin: AdminContext): Promise<unknown> {
    const grant = await this.activeGrant(id, admin);
    const targetId = grant.targetUserId;
    const [user, score, feed, disputes, roles, payout, assignments] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: targetId },
        select: { id: true, fullName: true, phone: true, email: true, language: true, status: true, kycLevel: true, hasSmartphone: true },
      }),
      this.prisma.scoreProfile.findUnique({
        where: { userId: targetId },
        select: { score: true, tier: true, jobsCompleted: true, onTimeRate: true },
      }),
      this.notifications.feed(targetId, 10),
      this.prisma.dispute.findMany({
        where: { reporterId: targetId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, code: true, title: true, status: true, createdAt: true },
      }),
      this.prisma.userRole.findMany({ where: { userId: targetId }, select: { role: true } }),
      this.prisma.account.findFirst({ where: { ownerId: targetId, type: "WORKER_PAYOUT" }, select: { balance: true } }),
      this.prisma.jobAssignment.findMany({
        where: { worker: { userId: targetId } },
        orderBy: { updatedAt: "desc" },
        take: 8,
        select: { id: true, status: true, job: { select: { title: true, payAmount: true, location: { select: { label: true } } } } },
      }),
    ]);
    return {
      grant: { id: grant.id, mode: grant.mode, expiresAt: grant.expiresAt },
      user,
      roles: roles.map((r) => r.role),
      score,
      wallet: { balance: (payout?.balance ?? 0n).toString() },
      assignments: assignments.map((a) => ({
        id: a.id,
        status: a.status,
        title: a.job.title,
        payAmount: a.job.payAmount.toString(),
        location: a.job.location?.label ?? null,
      })),
      notifications: feed.items,
      disputes,
    };
  }

  /** Act as the user (WRITE grants only). A small, whitelisted, audited surface. */
  @Post(":id/act")
  @RequirePermissions("impersonation:request")
  async act(
    @Param("id") id: string,
    @Body() body: { action: string; language?: Language },
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ): Promise<unknown> {
    const grant = await this.activeGrant(id, admin);
    if (grant.mode !== "WRITE") throw new ForbiddenException("This is a read-only session");

    let result: string;
    switch (body.action) {
      case "mark_notifications_read":
        await this.notifications.markAllRead(grant.targetUserId);
        result = "Marked all notifications read";
        break;
      case "set_language": {
        if (!body.language || !LANGUAGES.includes(body.language)) throw new BadRequestException("Invalid language");
        await this.prisma.user.update({ where: { id: grant.targetUserId }, data: { language: body.language } });
        result = `Set language to ${body.language}`;
        break;
      }
      default:
        throw new BadRequestException("Unsupported action");
    }
    await this.audit.record({
      adminUserId: admin.id,
      action: "impersonation.act",
      resource: "User",
      resourceId: grant.targetUserId,
      ip: clientIp(req),
      device: req.headers["user-agent"],
      newValue: { grantId: id, act: body.action, language: body.language, impersonated: true },
    });
    return { ok: true, result };
  }

  /**
   * Loads a grant the caller may act through: theirs, CONSUMED, unexpired. An
   * expired session is flipped to EXPIRED so it can't be reused.
   */
  private async activeGrant(id: string, admin: AdminContext) {
    const grant = await this.prisma.impersonationGrant.findUnique({ where: { id } });
    if (!grant) throw new NotFoundException("Grant not found");
    if (grant.requestedById !== admin.id) throw new ForbiddenException("This grant isn't yours");
    if (grant.status !== "CONSUMED") throw new BadRequestException("No active session for this grant");
    if (!grant.expiresAt || grant.expiresAt.getTime() <= Date.now()) {
      await this.prisma.impersonationGrant.update({ where: { id }, data: { status: "EXPIRED" } });
      throw new ForbiddenException("This session has expired");
    }
    return grant;
  }
}
