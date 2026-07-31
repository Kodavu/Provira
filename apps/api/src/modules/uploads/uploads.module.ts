import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller.js";

// Storage adapter comes from the @Global IntegrationsModule.
@Module({
  controllers: [UploadsController],
})
export class UploadsModule {}
