import { Body, Controller, Get, Param, Put, UseGuards } from "@nestjs/common";
import { EmployersService } from "./employers.service.js";
import { UserAuthGuard } from "../auth/user-auth.guard.js";

// Employer's own dashboard + editable profile — bound to the caller via the
// `:userId` path segment. (Public-facing profiles live under /profiles.)
@Controller("employers")
@UseGuards(UserAuthGuard)
export class EmployersController {
  constructor(private readonly employers: EmployersService) {}

  @Get(":userId/dashboard")
  dashboard(@Param("userId") userId: string) {
    return this.employers.dashboard(userId);
  }

  @Get(":userId/profile")
  profile(@Param("userId") userId: string) {
    return this.employers.profile(userId);
  }

  @Put(":userId/profile")
  updateProfile(
    @Param("userId") userId: string,
    @Body()
    body: {
      businessName?: string;
      logoUrl?: string;
      industry?: string;
      companySize?: string;
      websiteUrl?: string;
      about?: string;
      state?: string;
      area?: string;
      ward?: string;
      label?: string;
    },
  ) {
    return this.employers.updateProfile(userId, body);
  }
}
