import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import type { KycLevel, Language, RoleType, VerificationDocType } from "@tally/db";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(":id")
  get(@Param("id") id: string) {
    return this.users.get(id);
  }

  @Get(":id/dashboard")
  dashboard(@Param("id") id: string) {
    return this.users.workerDashboard(id);
  }

  @Get(":id/wallet")
  wallet(@Param("id") id: string) {
    return this.users.wallet(id);
  }

  @Post(":id/withdraw")
  withdraw(@Param("id") id: string, @Body() body: { amount: string }) {
    return this.users.withdraw(id, BigInt(body.amount));
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() body: { fullName?: string; language?: Language; hasSmartphone?: boolean },
  ) {
    return this.users.updateProfile(id, body);
  }

  @Post(":id/roles")
  addRole(@Param("id") id: string, @Body() body: { role: RoleType }) {
    return this.users.addRole(id, body.role);
  }

  @Get(":id/verification")
  verificationStatus(@Param("id") id: string) {
    return this.users.verificationStatus(id);
  }

  @Post(":id/verification")
  submitVerification(
    @Param("id") id: string,
    @Body()
    body: {
      requestedLevel: KycLevel;
      bvn?: string;
      documents?: Array<{ type: VerificationDocType; label: string; url: string }>;
    },
  ) {
    return this.users.submitVerification(id, body);
  }
}
