import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { AdminAuditLog, Prisma } from "@tally/db";

export interface AuditInput {
  adminUserId?: string;
  action: string; // e.g. "user.suspend"
  resource: string; // e.g. "User"
  resourceId?: string;
  ip?: string;
  device?: string;
  previousValue?: Prisma.InputJsonValue;
  newValue?: Prisma.InputJsonValue;
}

/**
 * Append-only audit trail. The app only ever INSERTs here — production hardening
 * grants the DB role INSERT/SELECT (no UPDATE/DELETE) on admin_audit_log and
 * exports nightly, so "immutable" is enforced at the database, not just in code.
 */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  record(input: AuditInput): Promise<AdminAuditLog> {
    return this.prisma.adminAuditLog.create({
      data: {
        adminUserId: input.adminUserId,
        action: input.action,
        resource: input.resource,
        resourceId: input.resourceId,
        ip: input.ip,
        device: input.device,
        previousValue: input.previousValue,
        newValue: input.newValue,
      },
    });
  }

  list(limit = 50): Promise<unknown[]> {
    return this.prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { adminUser: { select: { fullName: true, email: true } } },
    });
  }
}
