import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { CycleModule } from './cycle/cycle.module';
import { ContributionModule } from './contribution/contribution.module';
import { ReportsModule } from './reports/reports.module';
import { PaymentsModule } from './payment/payments.module';
import { PayoutReadinessAgent } from './agents/payout-readiness.agent';
import { AgentsController } from './agents/agents.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    CycleModule,
    ContributionModule,
    ReportsModule,
    PaymentsModule,
  ],
  controllers: [AgentsController],
  providers: [PayoutReadinessAgent],
})
export class AppModule {}