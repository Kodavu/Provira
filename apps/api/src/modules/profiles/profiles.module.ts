import { Module } from "@nestjs/common";
import { ProfilesController } from "./profiles.controller.js";
import { ProfilesService } from "./profiles.service.js";
import { ReviewsModule } from "../reviews/reviews.module.js";

@Module({
  imports: [ReviewsModule],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}
