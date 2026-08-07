import { Body, Controller, Delete, Get, Param, Patch, Post, Put, UseGuards } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import type { KycLevel, Language, RoleType, VerificationDocType } from "@truvo/db";
import { OwnerFrom, UserAuthGuard } from "../auth/user-auth.guard.js";

// Every route is scoped to the user in the `:id` path segment; the guard binds
// it to the caller's own session so users can only touch their own account.
@Controller("users")
@UseGuards(UserAuthGuard)
@OwnerFrom({ param: "id" })
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
    @Body() body: { fullName?: string; language?: Language; hasSmartphone?: boolean; jobFeed?: string },
  ) {
    return this.users.updateProfile(id, body);
  }

  @Get(":id/worker-profile")
  workerProfile(@Param("id") id: string) {
    return this.users.workerProfile(id);
  }

  @Put(":id/worker-profile")
  updateWorkerProfile(
    @Param("id") id: string,
    @Body()
    body: {
      fullName?: string;
      headline?: string;
      avatarUrl?: string;
      bio?: string;
      languages?: Language[];
      skillSlugs?: string[];
      state?: string;
      area?: string;
      ward?: string;
      label?: string;
    },
  ) {
    return this.users.updateWorkerProfile(id, body);
  }

  @Get(":id/portfolio")
  portfolio(@Param("id") id: string) {
    return this.users.listPortfolio(id);
  }

  @Post(":id/portfolio")
  addPortfolio(
    @Param("id") id: string,
    @Body() body: { kind: string; title: string; description?: string; url: string; thumbnailUrl?: string },
  ) {
    return this.users.addPortfolio(id, body);
  }

  @Delete(":id/portfolio/:itemId")
  deletePortfolio(@Param("id") id: string, @Param("itemId") itemId: string) {
    return this.users.deletePortfolio(id, itemId);
  }

  @Post(":id/roles")
  addRole(@Param("id") id: string, @Body() body: { role: RoleType }) {
    return this.users.addRole(id, body.role);
  }

  @Get(":id/verification")
  verificationStatus(@Param("id") id: string) {
    return this.users.verificationStatus(id);
  }

  @Post(":id/bank-account/lookup")
  lookupBankAccount(
    @Param("id") _id: string,
    @Body() body: { bankCode: string; accountNumber: string },
  ) {
    return this.users.lookupBankAccount(body.bankCode, body.accountNumber);
  }

  @Put(":id/bank-account")
  saveBankAccount(
    @Param("id") id: string,
    @Body() body: { bankCode: string; bankName?: string; accountNumber: string; accountName: string },
  ) {
    return this.users.saveBankAccount(id, body);
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
