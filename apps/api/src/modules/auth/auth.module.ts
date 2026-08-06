import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { UserAuthGuard } from "./user-auth.guard.js";
import { ResourceOwnerGuard } from "./resource-owner.guard.js";

// Global so any module can bind user-owned routes with UserAuthGuard without
// re-importing AuthModule or re-registering the JWT config.
@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-change-me",
      signOptions: { expiresIn: "30d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserAuthGuard, ResourceOwnerGuard],
  // Export the guards + JwtModule so other modules can bind user-owned routes
  // without re-registering the JWT config.
  exports: [AuthService, UserAuthGuard, ResourceOwnerGuard, JwtModule],
})
export class AuthModule {}
