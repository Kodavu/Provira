import { Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RequestOtpDto, VerifyOtpDto } from "./dto.js";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("otp/request")
  request(@Body() dto: RequestOtpDto) {
    return this.auth.requestOtp(dto.phone, dto.purpose);
  }

  @Post("otp/verify")
  verify(@Body() dto: VerifyOtpDto) {
    return this.auth.verifyOtp(dto.phone, dto.code);
  }
}
