import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service.js";

// Public skill catalog — powers the worker profile editor and job posting.
@Controller("skills")
export class SkillsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list() {
    const skills = await this.prisma.skill.findMany({
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });
    return skills.map((s) => ({ slug: s.slug, name: s.name, category: s.category ?? null }));
  }
}
