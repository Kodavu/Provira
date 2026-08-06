import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ScoringService } from "./scoring.service.js";
import { UserAuthGuard } from "../auth/user-auth.guard.js";

// A user's trust score + breakdown is private to them, bound via `:userId`.
@Controller("scoring")
@UseGuards(UserAuthGuard)
export class ScoringController {
  constructor(private readonly scoring: ScoringService) {}

  @Get(":userId")
  get(@Param("userId") userId: string) {
    return this.scoring.getProfile(userId);
  }

  @Get(":userId/breakdown")
  breakdown(@Param("userId") userId: string) {
    return this.scoring.breakdown(userId);
  }
}
