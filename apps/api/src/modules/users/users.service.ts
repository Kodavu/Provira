import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";
import type { Language, RoleType } from "@tally/db";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async get(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: true,
        workerProfile: true,
        traderProfile: true,
        employerProfile: true,
        scoreProfile: true,
      },
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async updateProfile(
    userId: string,
    data: { fullName?: string; language?: Language; hasSmartphone?: boolean },
  ) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  /** Attach a role and create its profile row if missing. */
  async addRole(userId: string, role: RoleType) {
    await this.prisma.userRole.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role },
      update: { isActive: true },
    });
    if (role === "WORKER")
      await this.prisma.workerProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    if (role === "TRADER")
      await this.prisma.traderProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    if (role === "EMPLOYER")
      await this.prisma.employerProfile.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });
    return this.get(userId);
  }
}
