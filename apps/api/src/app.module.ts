import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module.js";
import { IntegrationsModule } from "./integrations/integrations.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { JobsModule } from "./modules/jobs/jobs.module.js";
import { EscrowModule } from "./modules/escrow/escrow.module.js";
import { AttendanceModule } from "./modules/attendance/attendance.module.js";
import { ScoringModule } from "./modules/scoring/scoring.module.js";
import { LendingModule } from "./modules/lending/lending.module.js";
import { PaymentsModule } from "./modules/payments/payments.module.js";
import { ChannelsModule } from "./modules/channels/channels.module.js";
import { TradersModule } from "./modules/traders/traders.module.js";
import { EmployersModule } from "./modules/employers/employers.module.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { NotificationsModule } from "./modules/notifications/notifications.module.js";
import { UploadsModule } from "./modules/uploads/uploads.module.js";
import { GeoModule } from "./modules/geo/geo.module.js";
import { BanksModule } from "./modules/banks/banks.module.js";
import { ReviewsModule } from "./modules/reviews/reviews.module.js";
import { ProfilesModule } from "./modules/profiles/profiles.module.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    IntegrationsModule,
    AuthModule,
    UsersModule,
    JobsModule,
    EscrowModule,
    AttendanceModule,
    ScoringModule,
    LendingModule,
    PaymentsModule,
    ChannelsModule,
    TradersModule,
    EmployersModule,
    NotificationsModule,
    UploadsModule,
    AdminModule,
    GeoModule,
    BanksModule,
    ReviewsModule,
    ProfilesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
