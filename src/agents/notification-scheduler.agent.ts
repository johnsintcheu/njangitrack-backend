import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class NotificationSchedulerAgent {
  private readonly logger = new Logger(NotificationSchedulerAgent.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async sendScheduledReminders() {
    const start = Date.now();
    this.logger.log('🤖 Notification Scheduler Agent running...');

    let processed = 0;
    try {
      const pending = await this.prisma.notification.findMany({
        where: { deliveryStatus: 'PENDING' },
      });

      if (pending.length === 0) {
        this.logger.log('✅ No pending notifications at this time.');
      } else {
        this.logger.log(`📨 Processing ${pending.length} pending notifications...`);

        for (const notification of pending) {
          await this.prisma.notification.update({
            where: { id: notification.id },
            data: {
              deliveryStatus: 'SENT',
              sentAt: new Date(),
            },
          });
          processed++;
        }
      }

      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Notification Scheduler Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
        create: {
          agentName: 'Notification Scheduler Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
      });
    } catch (e) {
      this.logger.error('❌ Notification Scheduler Agent error', e);
      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Notification Scheduler Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          status: 'ERROR',
        },
        create: {
          agentName: 'Notification Scheduler Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: 0,
          status: 'ERROR',
        },
      });
    }
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async retryFailedNotifications() {
    const start = Date.now();
    this.logger.log('🔄 Retrying failed notifications...');
    let processed = 0;
    try {
      const count = await this.notificationService.retryFailedNotifications();
      processed = count;
      if (count > 0) {
        this.logger.log(`🔄 Retried ${count} failed notifications`);
      }
      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Notification Retry Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
        create: {
          agentName: 'Notification Retry Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: processed,
          status: 'HEALTHY',
        },
      });
    } catch (e) {
      this.logger.error('❌ Notification Retry Agent error', e);
      await this.prisma.agentRunLog.upsert({
        where: { agentName: 'Notification Retry Agent' },
        update: {
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          status: 'ERROR',
        },
        create: {
          agentName: 'Notification Retry Agent',
          lastRunAt: new Date(),
          lastRunDurationMs: Date.now() - start,
          lastRunRecordsProcessed: 0,
          status: 'ERROR',
        },
      });
    }
  }

  async scheduleContributionReminder(
    memberId: string,
    daysBeforeDeadline: number,
    deadlineDate: Date,
  ) {
    const messages: Record<number, string> = {
      7: `Reminder: Your Njangi contribution is due in 7 days on ${deadlineDate.toDateString()}`,
      3: `Reminder: Your Njangi contribution is due in 3 days on ${deadlineDate.toDateString()}`,
      1: `Urgent: Your Njangi contribution is due TOMORROW on ${deadlineDate.toDateString()}`,
      0: `FINAL REMINDER: Your Njangi contribution is due TODAY!`,
    };

    const message = messages[daysBeforeDeadline] || 
      `Reminder: Your Njangi contribution deadline is approaching`;

    await this.notificationService.sendNotification({
      recipientId: memberId,
      type: 'CONTRIBUTION_REMINDER',
      channel: 'SMS',
      messageContent: message,
    });

    this.logger.log(
      `📅 Scheduled T-${daysBeforeDeadline} reminder for member ${memberId}`,
    );
  }
}