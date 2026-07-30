import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import {
  AdminAuthGuard,
  AdminContext,
  CurrentAdmin,
  PermissionsGuard,
  RequirePermissions,
} from "./rbac.js";

// --- Me + dashboard (any authenticated admin) ---

@Controller("admin")
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get("me")
  me(@CurrentAdmin() admin: AdminContext) {
    return {
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.fullName,
        department: admin.department,
      },
      roles: admin.roles,
      permissions: [...admin.permissions],
    };
  }

  @Get("dashboard")
  async dashboard() {
    const [
      totalUsers,
      activeUsers,
      pendingDisputes,
      pendingKyc,
      pendingWithdrawals,
      released,
      recentAudit,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: "ACTIVE" } }),
      this.prisma.dispute.count({
        where: { status: { in: ["OPEN", "UNDER_REVIEW", "ESCALATED", "WAITING_FOR_USER"] } },
      }),
      this.prisma.user.count({ where: { kycLevel: "NONE" } }),
      this.prisma.paymentIntent.count({
        where: { direction: "OUTBOUND", status: "PROCESSING" },
      }),
      this.prisma.escrowAccount.aggregate({
        _sum: { amount: true },
        where: { releasedAt: { not: null } },
      }),
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { adminUser: { select: { fullName: true } } },
      }),
    ]);

    return {
      stats: {
        totalUsers,
        activeUsers,
        pendingDisputes,
        pendingKyc,
        pendingWithdrawals,
        processedVolume: (released._sum.amount ?? 0n).toString(),
        fraudAlerts: 0, // placeholder until the risk engine lands
        supportTickets: 0, // placeholder until the ticketing module lands
      },
      recentActivity: recentAudit.map((a) => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        admin: a.adminUser?.fullName ?? "System",
        at: a.createdAt,
      })),
    };
  }
}

// --- Platform users (permission-gated) ---

@Controller("admin/users")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermissions("users:view")
  list(@Query("q") q?: string) {
    return this.prisma.user.findMany({
      where: q
        ? { OR: [{ phone: { contains: q } }, { fullName: { contains: q, mode: "insensitive" } }] }
        : undefined,
      select: {
        id: true,
        fullName: true,
        phone: true,
        status: true,
        kycLevel: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  @Post(":id/suspend")
  @RequirePermissions("users:suspend")
  async suspend(
    @Param("id") id: string,
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.setStatus(id, "SUSPENDED", "user.suspend", admin, req);
  }

  @Post(":id/reactivate")
  @RequirePermissions("users:suspend")
  async reactivate(
    @Param("id") id: string,
    @CurrentAdmin() admin: AdminContext,
    @Req() req: any,
  ) {
    return this.setStatus(id, "ACTIVE", "user.reactivate", admin, req);
  }

  private async setStatus(
    id: string,
    status: "ACTIVE" | "SUSPENDED",
    action: string,
    admin: AdminContext,
    req: any,
  ) {
    const before = await this.prisma.user.findUnique({
      where: { id },
      select: { status: true },
    });
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, fullName: true, phone: true, status: true },
    });
    await this.audit.record({
      adminUserId: admin.id,
      action,
      resource: "User",
      resourceId: id,
      ip: (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ?? req.ip,
      device: req.headers["user-agent"],
      previousValue: { status: before?.status },
      newValue: { status },
    });
    return updated;
  }
}

// --- Roles, permissions catalog, audit logs ---

@Controller("admin")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminMetaController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get("roles")
  @RequirePermissions("settings:view")
  async roles() {
    const [roles, permissions] = await Promise.all([
      this.prisma.role.findMany({
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { admins: true } },
        },
        orderBy: { name: "asc" },
      }),
      this.prisma.permission.findMany({ orderBy: [{ group: "asc" }, { label: "asc" }] }),
    ]);
    return {
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        isSystem: r.isSystem,
        adminCount: r._count.admins,
        permissions: r.permissions.map((p) => p.permission.key),
      })),
      permissions,
    };
  }

  @Get("audit-logs")
  @RequirePermissions("settings:view")
  auditLogs() {
    return this.audit.list(60);
  }
}

// --- Disputes (list) ---

@Controller("admin/disputes")
@UseGuards(AdminAuthGuard, PermissionsGuard)
export class AdminDisputesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @RequirePermissions("disputes:view")
  list() {
    return this.prisma.dispute.findMany({
      include: {
        reporter: { select: { fullName: true, phone: true } },
        defendant: { select: { fullName: true, phone: true } },
        assignedAdmin: { select: { fullName: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 50,
    });
  }
}
