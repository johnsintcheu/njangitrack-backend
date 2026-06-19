import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { FineModule } from './fine/fine.module';
import { ContributionMonitorAgent } from './agents/contribution-monitor.agent';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    FineModule,
  ],
  providers: [ContributionMonitorAgent],
})
export class AppModule {}