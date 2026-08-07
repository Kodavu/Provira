import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import { AuditService } from "./audit.service.js";
import { NotificationService } from "../notifications/notification.service.js";
import { EscrowService } from "../escrow/escrow.service.js";
import type { AdminContext } from "./rbac.js";
import type { DisputeStatus } from "@truvo/db";

interface Meta {
  ip?: string;
  device?: string;
}

// How a job dispute settles the held escrow.
export type DisputeOutcome = "REFUND_EMPLOYER" | "RELEASE_WORKER" | "SPLIT";
export interface DisputeResolution {
  outcome: DisputeOutcome;
  releaseAmount?: string; // kobo, required for SPLIT
  refundAmount?: string; // kobo, required for SPLIT
}

function naira(kobo: bigint): string {
  return `₦${(Number(kobo) / 100).toLocaleString("en-NG")}`;
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
    private readonly notifications: NotificationService,
    private readonly escrow: EscrowService,
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

  async resolve(id: string, actor: AdminContext, meta: Meta, note?: string, resolution?: DisputeResolution) {
    // A resolution with a money outcome settles the job's held escrow first, so
    // a RESOLVED dispute always reflects the actual fund movement.
    if (resolution) await this.settleEscrow(id, resolution, actor, meta);
    return this.transition(id, "RESOLVED", "resolved", "dispute.resolve", actor, meta, note, true);
  }

  /**
   * Move the held escrow according to the admin's decision: refund the employer,
   * release to the worker, or split. Records the money movement on the case
   * timeline + audit trail, and notifies both parties.
   */
  private async settleEscrow(disputeId: string, resolution: DisputeResolution, actor: AdminContext, meta: Meta) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
      select: { id: true, code: true, subjectType: true, subjectId: true, reporterId: true, defendantId: true },
    });
    if (!dispute) throw new NotFoundException("Dispute not found");
    if (dispute.subjectType !== "job" || !dispute.subjectId) {
      throw new BadRequestException("This dispute isn't attached to a job, so there's no escrow to settle");
    }
    const jobId = dispute.subjectId;

    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      include: { employer: true, escrow: true },
    });
    if (!job?.escrow) throw new BadRequestException("This job has no escrow");

    const employerUserId = job.employer.userId;
    // The worker party to the dispute is whichever side isn't the employer.
    const workerUserId = dispute.reporterId === employerUserId ? dispute.defendantId : dispute.reporterId;

    const held = (await this.prisma.account.findUnique({ where: { id: job.escrow.accountId } }))?.balance ?? 0n;
    if (held <= 0n) throw new BadRequestException("No escrow is still held for this job");

    let release = 0n;
    let refund = 0n;
    if (resolution.outcome === "REFUND_EMPLOYER") {
      refund = held;
    } else if (resolution.outcome === "RELEASE_WORKER") {
      if (!workerUserId) throw new BadRequestException("No worker party on this dispute");
      release = held;
    } else {
      // SPLIT — explicit amounts, must sum to the held balance.
      release = BigInt(resolution.releaseAmount ?? "0");
      refund = BigInt(resolution.refundAmount ?? "0");
      if (release < 0n || refund < 0n) throw new BadRequestException("Amounts can't be negative");
      if (release + refund !== held) throw new BadRequestException("Split must add up to the escrow still held");
      if (release > 0n && !workerUserId) throw new BadRequestException("No worker party to release to");
    }

    await this.escrow.resolveDispute(jobId, {
      workerUserId: workerUserId ?? undefined,
      releaseAmount: release,
      refundAmount: refund,
      idempotencyKey: `dispute:${disputeId}`,
    });

    await this.prisma.disputeEvent.create({
      data: {
        disputeId,
        adminUserId: actor.id,
        type: "escrow_resolved",
        note: `Escrow settled — ${release > 0n ? `${naira(release)} to worker` : ""}${release > 0n && refund > 0n ? ", " : ""}${refund > 0n ? `${naira(refund)} to employer` : ""}`,
      },
    });
    await this.audit.record({
      adminUserId: actor.id,
      action: "dispute.escrow_resolve",
      resource: "Dispute",
      resourceId: disputeId,
      ip: meta.ip,
      device: meta.device,
      newValue: { jobId, outcome: resolution.outcome, release: release.toString(), refund: refund.toString() },
    });

    // Tell both parties how the money settled.
    if (release > 0n && workerUserId) {
      await this.notifications.notify(workerUserId, "dispute.resolved", { code: dispute.code });
      await this.notifications.notify(workerUserId, "earnings.credited", { amount: naira(release), title: job.title });
    }
    if (refund > 0n) {
      await this.notifications.notify(employerUserId, "dispute.resolved", { code: dispute.code });
      await this.notifications.notify(employerUserId, "escrow.refunded", { amount: naira(refund), title: job.title });
    }
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
    const dispute = await this.prisma.dispute.findUnique({
      where: { id },
      select: { id: true, code: true, reporterId: true },
    });
    if (!dispute) throw new NotFoundException("Dispute not found");
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
    // Notify the reporter that support replied — the reply is now actually
    // delivered (in-app + SMS/push per their prefs), not just stored.
    await this.notifications.notify(dispute.reporterId, "dispute.replied", {
      code: dispute.code,
      preview: text.length > 80 ? `${text.slice(0, 80)}…` : text,
      disputeId: dispute.id,
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
