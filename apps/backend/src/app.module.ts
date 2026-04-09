import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProspectsModule } from './prospects/prospects.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { PlanningModule } from './planning/planning.module';
import { VisitsModule } from './visits/visits.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProspectsModule,
    ActivityLogsModule,
    PlanningModule,
    VisitsModule,
  ],
})
export class AppModule {}
