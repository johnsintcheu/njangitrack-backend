import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { NotificationModule } from './notification/notification.module';
import { NotificationSchedulerAgent } from './agents/notification-scheduler.agent';
import { NotificationService } from './notification/notification.service';
import { AgentsController } from './agents/agents.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    NotificationModule,
  ],
  controllers: [AgentsController],
  providers: [NotificationSchedulerAgent, NotificationService],
})
export class AppModule {}
