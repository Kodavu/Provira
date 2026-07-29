import { Controller, Get, Param } from "@nestjs/common";
import { EmployersService } from "./employers.service.js";

@Controller("employers")
export class EmployersController {
  constructor(private readonly employers: EmployersService) {}

  @Get(":userId/dashboard")
  dashboard(@Param("userId") userId: string) {
    return this.employers.dashboard(userId);
  }
}
