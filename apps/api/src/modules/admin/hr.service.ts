import { randomBytes } from "node:crypto";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import { hashPassword } from "./password.js";
import type { AdminContext } from "./rbac.js";
import type { AdminStatus } from "@truvo/db";

interface Meta {
  ip?: string;
  device?: string;
}

/**
 * HR / internal staff management. Deliberately scoped by the admin_users:*
 * permissions — HR is NOT a super admin. Every change is audited.
 */
@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list() {
    const admins = await this.prisma.adminUser.findMany({
      orderBy: { createdAt: "desc" },
      include: { roles: { include: { role: { select: { name: true } } } } },
    });
    return admins.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      email: a.email,
      department: a.department,
      status: a.status,
      lastLoginAt: a.lastLoginAt,
      createdAt: a.createdAt,
      roles: a.roles.map((r) => r.role.name),
    }));
  }

  async detail(id: string) {
    const a = await this.prisma.adminUser.findUnique({
      where: { id },
      include: { roles: { include: { role: { select: { id: true, name: true } } } } },
    });
    if (!a) throw new NotFoundException("Admin not found");

    const [logins, activity] = await Promise.all([
      this.prisma.adminLoginEvent.findMany({
        where: { adminUserId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      this.prisma.adminAuditLog.findMany({
        where: { adminUserId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { id: true, action: true, resource: true, createdAt: true },
      }),
    ]);

    return {
      id: a.id,
      fullName: a.fullName,
      email: a.email,
      department: a.department,
      status: a.status,
      lastLoginAt: a.lastLoginAt,
      createdAt: a.createdAt,
      roles: a.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
      loginHistory: logins.map((l) => ({ id: l.id, ip: l.ip, device: l.device, success: l.success, at: l.createdAt })),
      activity,
    };
  }

  assignableRoles() {
    return this.prisma.role.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
  }

  async invite(
    input: { email: string; fullName: string; department?: string; roleIds: string[] },
    actor: AdminContext,
    meta: Meta,
  ) {
    const email = input.email.toLowerCase().trim();
    if (!email || !input.fullName?.trim()) throw new BadRequestException("Name and email required");
    const exists = await this.prisma.adminUser.findUnique({ where: { email } });
    if (exists) throw new BadRequestException("An admin with that email already exists");

    const tempPassword = randomBytes(6).toString("base64url");
    const admin = await this.prisma.adminUser.create({
      data: {
        email,
        fullName: input.fullName.trim(),
        department: input.department?.trim() || null,
        status: "ACTIVE",
        passwordHash: hashPassword(tempPassword),
        roles: { create: (input.roleIds ?? []).map((roleId) => ({ roleId })) },
      },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "admin_user.invite",
      resource: "AdminUser",
      resourceId: admin.id,
      ip: meta.ip,
      device: meta.device,
      newValue: { email, department: admin.department, roleIds: input.roleIds },
    });
    // Temp password returned once (dev). In production this goes out via email.
    return { id: admin.id, email: admin.email, tempPassword };
  }

  async updateProfile(id: string, input: { fullName?: string; department?: string }, actor: AdminContext, meta: Meta) {
    const before = await this.require(id);
    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: {
        fullName: input.fullName?.trim() || undefined,
        department: input.department !== undefined ? input.department.trim() || null : undefined,
      },
      select: { id: true, fullName: true, department: true },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "admin_user.edit",
      resource: "AdminUser",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      previousValue: { fullName: before.fullName, department: before.department },
      newValue: { fullName: updated.fullName, department: updated.department },
    });
    return updated;
  }

  async setStatus(id: string, status: AdminStatus, actor: AdminContext, meta: Meta) {
    if (id === actor.id && status === "DISABLED")
      throw new BadRequestException("You can't disable your own account");
    const before = await this.require(id);
    const updated = await this.prisma.adminUser.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: status === "DISABLED" ? "admin_user.disable" : "admin_user.enable",
      resource: "AdminUser",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      previousValue: { status: before.status },
      newValue: { status },
    });
    return updated;
  }

  async setRoles(id: string, roleIds: string[], actor: AdminContext, meta: Meta) {
    const before = await this.prisma.adminUserRole.findMany({ where: { adminUserId: id }, select: { roleId: true } });
    await this.prisma.$transaction([
      this.prisma.adminUserRole.deleteMany({ where: { adminUserId: id } }),
      this.prisma.adminUserRole.createMany({ data: roleIds.map((roleId) => ({ adminUserId: id, roleId })) }),
    ]);
    await this.audit.record({
      adminUserId: actor.id,
      action: "admin_user.assign_roles",
      resource: "AdminUser",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      previousValue: { roleIds: before.map((b) => b.roleId) },
      newValue: { roleIds },
    });
    return this.detail(id);
  }

  async resetPassword(id: string, actor: AdminContext, meta: Meta) {
    await this.require(id);
    const tempPassword = randomBytes(6).toString("base64url");
    await this.prisma.adminUser.update({ where: { id }, data: { passwordHash: hashPassword(tempPassword) } });
    await this.audit.record({
      adminUserId: actor.id,
      action: "admin_user.reset_password",
      resource: "AdminUser",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
    });
    return { tempPassword };
  }

  private async require(id: string) {
    const a = await this.prisma.adminUser.findUnique({
      where: { id },
      select: { fullName: true, department: true, status: true },
    });
    if (!a) throw new NotFoundException("Admin not found");
    return a;
  }
}
