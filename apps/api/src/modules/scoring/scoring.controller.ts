import { Controller, Get, Param } from "@nestjs/common";
import { ScoringService } from "./scoring.service.js";

@Controller("scoring")
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
