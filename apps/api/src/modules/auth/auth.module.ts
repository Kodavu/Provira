import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { UserAuthGuard } from "./user-auth.guard.js";

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "dev-only-change-me",
      signOptions: { expiresIn: "30d" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserAuthGuard],
  // Export the guard + JwtModule so other modules (e.g. notifications) can bind
  // user-owned routes without re-registering the JWT config.
  exports: [AuthService, UserAuthGuard, JwtModule],
})
export class AuthModule {}
