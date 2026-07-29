import { IsIn, IsOptional, IsString, Length, Matches } from "class-validator";

export class RequestOtpDto {
  // E.164, e.g. +2348012345678
  @Matches(/^\+?[1-9]\d{7,14}$/, { message: "phone must be E.164" })
  phone!: string;

  @IsOptional()
  @IsIn(["login", "signup"])
  purpose?: "login" | "signup";
}

export class VerifyOtpDto {
  @Matches(/^\+?[1-9]\d{7,14}$/)
  phone!: string;

  @IsString()
  @Length(4, 4)
  code!: string;
}
