import { ForbiddenException, NotFoundException, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { ResourceOwnerGuard, type ResourceOwnerSpec } from "./resource-owner.guard.js";

// Fixtures: two employers (with a job each) and one worker on an assignment.
const db = {
  employerProfile: { epA: { userId: "empA" }, epB: { userId: "empB" } },
  job: { jobA: { employer: { userId: "empA" } } },
  jobAssignment: {
    asg1: { worker: { userId: "wrk1" }, job: { employer: { userId: "empA" } } },
  },
};

function makeGuard(
  spec: ResourceOwnerSpec | undefined,
  tokens: Record<string, { sub: string; kind?: string }>,
) {
  const jwt = {
    verifyAsync: async (t: string) => {
      const p = tokens[t];
      if (!p) throw new Error("bad");
      return p;
    },
  };
  const reflector = { getAllAndOverride: () => spec } as unknown as Reflector;
  const prisma = {
    employerProfile: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        (db.employerProfile as Record<string, unknown>)[where.id] ?? null,
    },
    job: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        (db.job as Record<string, unknown>)[where.id] ?? null,
    },
    jobAssignment: {
      findUnique: async ({ where }: { where: { id: string } }) =>
        (db.jobAssignment as Record<string, unknown>)[where.id] ?? null,
    },
  };
  return new ResourceOwnerGuard(jwt as never, reflector, prisma as never);
}

function ctxFor(req: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

describe("ResourceOwnerGuard", () => {
  it("requires a valid token", async () => {
    const guard = makeGuard({ resource: "job", owner: "employer" }, {});
    await expect(
      guard.canActivate(ctxFor({ headers: {}, params: { id: "jobA" } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("lets a job's own employer through", async () => {
    const guard = makeGuard({ resource: "job", owner: "employer" }, { t: { sub: "empA" } });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: { id: "jobA" } })),
    ).resolves.toBe(true);
  });

  it("blocks a different employer from another's job", async () => {
    const guard = makeGuard({ resource: "job", owner: "employer" }, { t: { sub: "empB" } });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: { id: "jobA" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("404s a missing resource instead of leaking existence", async () => {
    const guard = makeGuard({ resource: "job", owner: "employer" }, { t: { sub: "empA" } });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: { id: "ghost" } })),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("resolves employerProfile ownership from the body", async () => {
    const spec: ResourceOwnerSpec = { resource: "employerProfile", owner: "employer", body: "employerId" };
    const ok = makeGuard(spec, { t: { sub: "empA" } });
    await expect(
      ok.canActivate(ctxFor({ headers: bearer("t"), params: {}, body: { employerId: "epA" } })),
    ).resolves.toBe(true);
    const bad = makeGuard(spec, { t: { sub: "empB" } });
    await expect(
      bad.canActivate(ctxFor({ headers: bearer("t"), params: {}, body: { employerId: "epA" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("resolves the assignment's worker for worker-owned routes", async () => {
    const spec: ResourceOwnerSpec = { resource: "jobAssignment", owner: "worker", param: "assignmentId" };
    const ok = makeGuard(spec, { t: { sub: "wrk1" } });
    await expect(
      ok.canActivate(ctxFor({ headers: bearer("t"), params: { assignmentId: "asg1" } })),
    ).resolves.toBe(true);
    // The job's employer must NOT pass a worker-owned route.
    const asEmployer = makeGuard(spec, { t: { sub: "empA" } });
    await expect(
      asEmployer.canActivate(ctxFor({ headers: bearer("t"), params: { assignmentId: "asg1" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("resolves the assignment's employer for employer-owned routes", async () => {
    const spec: ResourceOwnerSpec = { resource: "jobAssignment", owner: "employer", param: "assignmentId" };
    const ok = makeGuard(spec, { t: { sub: "empA" } });
    await expect(
      ok.canActivate(ctxFor({ headers: bearer("t"), params: { assignmentId: "asg1" } })),
    ).resolves.toBe(true);
    const asWorker = makeGuard(spec, { t: { sub: "wrk1" } });
    await expect(
      asWorker.canActivate(ctxFor({ headers: bearer("t"), params: { assignmentId: "asg1" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("passes through (auth-only) when no spec is set", async () => {
    const guard = makeGuard(undefined, { t: { sub: "anyone" } });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: {} })),
    ).resolves.toBe(true);
  });
});
