import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { UsersService } from "./users.service.js";
import type { Language, RoleType } from "@tally/db";

@Controller("users")
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(":id")
  get(@Param("id") id: string) {
    return this.users.get(id);
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
}
