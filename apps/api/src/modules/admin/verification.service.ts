import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import type { AdminContext } from "./rbac.js";
import type { KycLevel } from "@tally/db";

interface Meta {
  ip?: string;
  device?: string;
}

// Human labels for the KYC level the request would grant.
const LEVEL_LABEL: Record<string, string> = {
  BASIC: "basic verified",
  BVN_VERIFIED: "BVN verified",
  FULL: "fully verified",
};

/**
 * KYC / verification review. A user's VerificationRequest raises their KYC
 * level; the compliance / verification team approves it (bumping User.kycLevel)
 * or rejects it with a reason. Raw BVN/NIN is never surfaced — only whether one
 * was submitted. Every decision is audited and the user is notified.
 */
@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notifications: NotificationService,
  ) {}

  async queue(status: "pending" | "all"): Promise<unknown> {
    const requests = await this.prisma.verificationRequest.findMany({
      where: status === "pending" ? { status: "PENDING" } : {},
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        user: { select: { id: true, fullName: true, phone: true, kycLevel: true } },
        _count: { select: { documents: true } },
      },
    });
    return requests.map((r) => ({
      id: r.id,
      requestedLevel: r.requestedLevel,
      status: r.status,
      hasBvn: !!r.bvnHash,
      documentCount: r._count.documents,
      createdAt: r.createdAt,
      user: r.user,
    }));
  }

  async detail(id: string): Promise<unknown> {
    const r = await this.prisma.verificationRequest.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, phone: true, email: true, kycLevel: true, status: true } },
        documents: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!r) throw new NotFoundException("Verification request not found");
    return {
      id: r.id,
      requestedLevel: r.requestedLevel,
      status: r.status,
      hasBvn: !!r.bvnHash,
      decisionReason: r.decisionReason,
      createdAt: r.createdAt,
      decidedAt: r.decidedAt,
      user: r.user,
      documents: r.documents.map((d) => ({ id: d.id, type: d.type, label: d.label, url: d.url })),
    };
  }

  async approve(id: string, actor: AdminContext, meta: Meta): Promise<unknown> {
    const req = await this.require(id);
    const bvnUpdate = req.bvnHash ? { bvnHash: req.bvnHash } : {};
    await this.prisma.$transaction([
      this.prisma.verificationRequest.update({
        where: { id },
        data: { status: "APPROVED", reviewedByAdminId: actor.id, decidedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: req.userId },
        data: { kycLevel: req.requestedLevel as KycLevel, ...bvnUpdate },
      }),
    ]);
    await this.audit.record({
      adminUserId: actor.id,
      action: "verification.approve",
      resource: "VerificationRequest",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      newValue: { userId: req.userId, kycLevel: req.requestedLevel },
    });
    await this.notifications.notify(req.userId, "verification.approved", {
      level: LEVEL_LABEL[req.requestedLevel] ?? "verified",
    });
    return this.detail(id);
  }

  async reject(id: string, reason: string, actor: AdminContext, meta: Meta): Promise<unknown> {
    const req = await this.require(id);
    await this.prisma.verificationRequest.update({
      where: { id },
      data: { status: "REJECTED", reviewedByAdminId: actor.id, decisionReason: reason, decidedAt: new Date() },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "verification.reject",
      resource: "VerificationRequest",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      newValue: { userId: req.userId, reason },
    });
    await this.notifications.notify(req.userId, "verification.rejected", { reason });
    return this.detail(id);
  }

  private async require(id: string) {
    const req = await this.prisma.verificationRequest.findUnique({ where: { id } });
    if (!req) throw new NotFoundException("Verification request not found");
    if (req.status !== "PENDING") throw new BadRequestException("This request has already been decided");
    return req;
  }
}
