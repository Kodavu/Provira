import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import type { AdminContext } from "./rbac.js";
import type { DisputeStatus } from "@tally/db";

interface Meta {
  ip?: string;
  device?: string;
}

/**
 * Dispute workflow. Every state change records BOTH a DisputeEvent (the
 * case timeline, visible to staff) and an AdminAuditLog (the immutable platform
 * audit trail) — so a dispute's history and the admin audit are never out of sync.
 */
@Injectable()
export class DisputesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  detail(id: string): Promise<unknown> {
    return this.prisma.dispute.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, fullName: true, phone: true } },
        defendant: { select: { id: true, fullName: true, phone: true } },
        assignedAdmin: { select: { id: true, fullName: true } },
        events: {
          orderBy: { createdAt: "asc" },
          include: { adminUser: { select: { fullName: true } } },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          include: { adminUser: { select: { fullName: true } } },
        },
        evidence: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  /** Active admins that can be assigned a case. */
  staff() {
    return this.prisma.adminUser.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, department: true },
      orderBy: { fullName: "asc" },
    });
  }

  async assign(id: string, adminUserId: string, actor: AdminContext, meta: Meta) {
    const before = await this.require(id);
    const assignee = await this.prisma.adminUser.findUnique({
      where: { id: adminUserId },
      select: { fullName: true },
    });
    // Assigning an OPEN case also moves it into review.
    const nextStatus: DisputeStatus =
      before.status === "OPEN" ? "UNDER_REVIEW" : before.status;

    await this.prisma.dispute.update({
      where: { id },
      data: { assignedAdminId: adminUserId, status: nextStatus },
    });
    await this.prisma.disputeEvent.create({
      data: {
        disputeId: id,
        adminUserId: actor.id,
        type: "assigned",
        note: `Assigned to ${assignee?.fullName ?? "an admin"}`,
        fromStatus: before.status,
        toStatus: nextStatus,
      },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "dispute.assign",
      resource: "Dispute",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      previousValue: { assignedAdminId: before.assignedAdminId, status: before.status },
      newValue: { assignedAdminId: adminUserId, status: nextStatus },
    });
    return this.detail(id);
  }

  escalate(id: string, actor: AdminContext, meta: Meta, note?: string) {
    return this.transition(id, "ESCALATED", "escalated", "dispute.escalate", actor, meta, note);
  }

  resolve(id: string, actor: AdminContext, meta: Meta, note?: string) {
    return this.transition(id, "RESOLVED", "resolved", "dispute.resolve", actor, meta, note, true);
  }

  close(id: string, actor: AdminContext, meta: Meta, note?: string) {
    return this.transition(id, "CLOSED", "closed", "dispute.close", actor, meta, note);
  }

  /** Soft transitions (Under review / Waiting for user) — gated by disputes:assign. */
  setStatus(id: string, status: DisputeStatus, actor: AdminContext, meta: Meta) {
    return this.transition(id, status, "status_change", "dispute.status", actor, meta);
  }

  async addNote(id: string, body: string, actor: AdminContext, meta: Meta) {
    await this.require(id);
    await this.prisma.disputeMessage.create({
      data: { disputeId: id, authorType: "ADMIN", adminUserId: actor.id, body, isInternal: true },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "dispute.note",
      resource: "Dispute",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      newValue: { note: body.slice(0, 120) },
    });
    return this.detail(id);
  }

  /**
   * A user-visible reply (isInternal=false) — this is what the reporter/defendant
   * would see. Unlike an internal note it also lands on the case timeline so the
   * back-and-forth with the user is auditable.
   */
  async addReply(id: string, body: string, actor: AdminContext, meta: Meta) {
    const text = body?.trim();
    if (!text) throw new BadRequestException("A message is required");
    await this.require(id);
    await this.prisma.disputeMessage.create({
      data: { disputeId: id, authorType: "ADMIN", adminUserId: actor.id, body: text, isInternal: false },
    });
    await this.prisma.disputeEvent.create({
      data: { disputeId: id, adminUserId: actor.id, type: "reply", note: "Replied to the user" },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "dispute.reply",
      resource: "Dispute",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      newValue: { body: text.slice(0, 120) },
    });
    return this.detail(id);
  }

  /** Attach a piece of evidence (a link to a stored file) and record it on the timeline. */
  async addEvidence(id: string, label: string, url: string, actor: AdminContext, meta: Meta) {
    const cleanLabel = label?.trim();
    const cleanUrl = url?.trim();
    if (!cleanLabel) throw new BadRequestException("A label is required");
    if (!/^https?:\/\//i.test(cleanUrl ?? "")) throw new BadRequestException("A valid http(s) URL is required");
    await this.require(id);
    const ev = await this.prisma.disputeEvidence.create({
      data: { disputeId: id, label: cleanLabel, url: cleanUrl },
    });
    await this.prisma.disputeEvent.create({
      data: { disputeId: id, adminUserId: actor.id, type: "evidence", note: `Attached "${cleanLabel}"` },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "dispute.evidence",
      resource: "Dispute",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      newValue: { label: cleanLabel, url: cleanUrl },
    });
    return ev && this.detail(id);
  }

  private async require(id: string) {
    const d = await this.prisma.dispute.findUnique({
      where: { id },
      select: { status: true, assignedAdminId: true },
    });
    if (!d) throw new NotFoundException("Dispute not found");
    return d;
  }

  private async transition(
    id: string,
    toStatus: DisputeStatus,
    eventType: string,
    action: string,
    actor: AdminContext,
    meta: Meta,
    note?: string,
    resolved = false,
  ) {
    const before = await this.require(id);
    await this.prisma.dispute.update({
      where: { id },
      data: { status: toStatus, resolvedAt: resolved ? new Date() : undefined },
    });
    await this.prisma.disputeEvent.create({
      data: {
        disputeId: id,
        adminUserId: actor.id,
        type: eventType,
        note,
        fromStatus: before.status,
        toStatus,
      },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action,
      resource: "Dispute",
      resourceId: id,
      ip: meta.ip,
      device: meta.device,
      previousValue: { status: before.status },
      newValue: { status: toStatus },
    });
    return this.detail(id);
  }
}
