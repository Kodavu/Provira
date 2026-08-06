import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { UserAuthGuard, type OwnerBinding } from "./user-auth.guard.js";

// Minimal fakes: the guard only uses verifyAsync (jwt) and getAllAndOverride
// (reflector). A verifier keyed by token lets us simulate valid/invalid tokens.
function makeGuard(
  tokens: Record<string, { sub: string; kind?: string; phone?: string }>,
  binding?: OwnerBinding,
) {
  const jwt = {
    verifyAsync: async (t: string) => {
      const p = tokens[t];
      if (!p) throw new Error("bad token");
      return p;
    },
  };
  const reflector = { getAllAndOverride: () => binding } as unknown as Reflector;
  return new UserAuthGuard(jwt as never, reflector);
}

function ctxFor(req: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => req }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

describe("UserAuthGuard", () => {
  it("rejects a request with no token", async () => {
    const guard = makeGuard({});
    await expect(guard.canActivate(ctxFor({ headers: {}, params: {} }))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it("rejects an unverifiable token", async () => {
    const guard = makeGuard({ good: { sub: "u1" } });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("forged"), params: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects an admin-kind token on the user surface", async () => {
    const guard = makeGuard({ a: { sub: "admin1", kind: "admin" } });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("a"), params: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("allows the owner to access their own :userId route", async () => {
    const guard = makeGuard({ t: { sub: "u1" } });
    const req = { headers: bearer("t"), params: { userId: "u1" } };
    await expect(guard.canActivate(ctxFor(req))).resolves.toBe(true);
    expect((req as { user?: { id: string } }).user?.id).toBe("u1");
  });

  it("forbids accessing another user's :userId route", async () => {
    const guard = makeGuard({ t: { sub: "u1" } });
    const req = { headers: bearer("t"), params: { userId: "u2" } };
    await expect(guard.canActivate(ctxFor(req))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("binds a custom param name (e.g. :id)", async () => {
    const guard = makeGuard({ t: { sub: "u1" } }, { param: "id" });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: { id: "u1" } })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: { id: "u2" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("binds an owner id carried in the query string", async () => {
    const guard = makeGuard({ t: { sub: "u1" } }, { query: "userId" });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: {}, query: { userId: "u1" } })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: {}, query: { userId: "u2" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("binds an owner id carried in the body", async () => {
    const guard = makeGuard({ t: { sub: "u1" } }, { body: "authorUserId" });
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: {}, body: { authorUserId: "u1" } })),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: {}, body: { authorUserId: "u2" } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("authenticates but skips ownership when no owner id is present", async () => {
    const guard = makeGuard({ t: { sub: "u1" } }, { body: "userId" });
    // disburse-style route: valid session, nothing to bind → allowed.
    await expect(
      guard.canActivate(ctxFor({ headers: bearer("t"), params: { applicationId: "app1" }, body: {} })),
    ).resolves.toBe(true);
  });
});
