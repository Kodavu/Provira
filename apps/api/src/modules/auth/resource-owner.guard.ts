import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
  SetMetadata,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service.js";
import { authenticateUser } from "./user-auth.guard.js";

/**
 * Declares whose ownership a route requires when the owning user id isn't a
 * plain path/query/body value but must be resolved through a resource record:
 *
 *  - job / employer     → Job.employer.userId (the employer who posted it)
 *  - jobAssignment/worker  → JobAssignment.worker.userId (the assigned worker)
 *  - jobAssignment/employer → JobAssignment.job.employer.userId
 *  - employerProfile/employer → EmployerProfile.userId
 *
 * The resource id is read from `param` (default) or `body`.
 */
export interface ResourceOwnerSpec {
  resource: "job" | "jobAssignment" | "employerProfile";
  owner: "employer" | "worker";
  /** Route param holding the resource id (default: "id"). */
  param?: string;
  /** Body field holding the resource id (takes precedence over param). */
  body?: string;
}

export const RESOURCE_OWNER_KEY = "resource_owner_spec";
export const ResourceOwner = (spec: ResourceOwnerSpec) =>
  SetMetadata(RESOURCE_OWNER_KEY, spec);

/**
 * Authenticates the session token, then confirms the caller owns the resource
 * the route acts on — resolving the owning user id via a Prisma lookup along the
 * relation described by @ResourceOwner. Rejects with 404 if the resource is
 * missing (no existence leak) and 403 if it belongs to someone else.
 */
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const user = await authenticateUser(req, this.jwt);

    const spec = this.reflector.getAllAndOverride<ResourceOwnerSpec>(RESOURCE_OWNER_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!spec) return true; // no spec → authenticated-only

    const resourceId = spec.body
      ? req.body?.[spec.body]
      : req.params?.[spec.param ?? "id"];
    if (!resourceId) throw new NotFoundException("Resource not found");

    const ownerUserId = await this.resolveOwner(spec, resourceId);
    if (!ownerUserId) throw new NotFoundException("Resource not found");
    if (ownerUserId !== user.id) {
      throw new ForbiddenException("You don't have access to this resource");
    }
    return true;
  }

  private async resolveOwner(
    spec: ResourceOwnerSpec,
    id: string,
  ): Promise<string | null> {
    if (spec.resource === "employerProfile") {
      const ep = await this.prisma.employerProfile.findUnique({
        where: { id },
        select: { userId: true },
      });
      return ep?.userId ?? null;
    }

    if (spec.resource === "job") {
      const job = await this.prisma.job.findUnique({
        where: { id },
        select: { employer: { select: { userId: true } } },
      });
      return job?.employer.userId ?? null;
    }

    // jobAssignment
    const assignment = await this.prisma.jobAssignment.findUnique({
      where: { id },
      select: {
        worker: { select: { userId: true } },
        job: { select: { employer: { select: { userId: true } } } },
      },
    });
    if (!assignment) return null;
    return spec.owner === "worker"
      ? assignment.worker.userId
      : assignment.job.employer.userId;
  }
}
