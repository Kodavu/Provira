import { Controller, Get, Param } from "@nestjs/common";
import { ProfilesService } from "./profiles.service.js";

// Public profiles — readable by any authenticated user for hiring/decision trust.
@Controller("profiles")
export class ProfilesController {
  constructor(private readonly profiles: ProfilesService) {}

  @Get("worker/:userId")
  worker(@Param("userId") userId: string) {
    return this.profiles.workerProfile(userId);
  }

  @Get("employer/:userId")
  employer(@Param("userId") userId: string) {
    return this.profiles.employerProfile(userId);
  }
}
