import { Module } from "@nestjs/common";
import { EmployersController } from "./employers.controller.js";
import { EmployersService } from "./employers.service.js";

@Module({
  controllers: [EmployersController],
  providers: [EmployersService],
})
export class EmployersModule {}
